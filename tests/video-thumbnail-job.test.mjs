import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const {load}=createTypeScriptLoader({globals:{crypto:globalThis.crypto}});
const {processVideoThumbnail,ThumbnailBusyError,ThumbnailInputError}=load(fileURLToPath(new URL('../studio/lib/video-thumbnails/process.ts',import.meta.url)));
const id='file-'+ 'a'.repeat(40)+'-mp4';
function fixture(){
 const docs=new Map([[id,{_id:id,_rev:'1',_type:'sanity.fileAsset',mimeType:'video/mp4',size:100,url:'https://cdn.sanity.io/files/project/production/'+'a'.repeat(40)+'.mp4'}]]);let uploads=0;
 const client={config:()=>({projectId:'project',dataset:'production'}),getDocument:async key=>structuredClone(docs.get(key)),assets:{upload:async()=>{uploads++;const image={_id:'image-test',_type:'sanity.imageAsset'};docs.set(image._id,image);return image}},patch(key){let revision,values={},remove=[];const patch={ifRevisionId(value){revision=value;return patch},set(value){values=value;return patch},unset(value){remove=value;return patch},async commit(){const doc=docs.get(key);if(doc?._rev!==revision)throw Object.assign(Error('Conflict'),{statusCode:409});Object.assign(doc,values);remove.forEach(k=>delete doc[k]);doc._rev=String(Number(doc._rev)+1);return structuredClone(doc)}};return patch}};
 return {client,docs,uploads:()=>uploads};
}
test('Generates and persists once per file; repeated deliveries reuse the same image',async()=>{
 const f=fixture();let captures=0;const extract=async()=>{captures++;return new Blob(['frame'],{type:'image/webp'})};assert.equal(await processVideoThumbnail(f.client,id,extract),'created');assert.equal(await processVideoThumbnail(f.client,id,extract),'existing');assert.equal(captures,1);assert.equal(f.uploads(),1);assert.equal(f.docs.get(id).videoThumbnail._ref,'image-test');assert.equal(f.docs.get(id).videoThumbnailProcessing,undefined);
});
test('Concurrent delivery cannot decode or upload the same video twice',async()=>{
 const f=fixture();let release,started;const wait=new Promise(r=>started=r);const first=processVideoThumbnail(f.client,id,async()=>{started();await new Promise(r=>release=r);return new Blob(['frame'],{type:'image/webp'})});await wait;await assert.rejects(processVideoThumbnail(f.client,id,async()=>{throw Error('Duplicate extraction')}),ThumbnailBusyError);release();assert.equal(await first,'created');assert.equal(f.uploads(),1);
});
test('Failure clears only its own claim and allows a later retry',async()=>{
 const f=fixture();await assert.rejects(processVideoThumbnail(f.client,id,async()=>{throw Error('Decode failed')}),/Decode failed/);assert.equal(f.docs.get(id).videoThumbnailProcessing,undefined);assert.equal(await processVideoThumbnail(f.client,id,async()=>new Blob(['frame'],{type:'image/webp'})),'created');
});
test('An expired claim can be recovered after a crashed worker',async()=>{
 const f=fixture();f.docs.get(id).videoThumbnailProcessing={owner:'old',startedAt:Date.now()-600000};assert.equal(await processVideoThumbnail(f.client,id,async()=>new Blob(['frame'],{type:'image/webp'})),'created');
});
test('A newer worker claim is preserved on ownership conflict',async()=>{
 const f=fixture();await assert.rejects(processVideoThumbnail(f.client,id,async()=>{f.docs.get(id).videoThumbnailProcessing={owner:'new',startedAt:Date.now()};return new Blob(['frame'],{type:'image/webp'})}),ThumbnailBusyError);assert.equal(f.docs.get(id).videoThumbnailProcessing.owner,'new');
});
test('A deleted thumbnail can be regenerated instead of keeping a broken reference',async()=>{
 const f=fixture();f.docs.get(id).videoThumbnail={_ref:'deleted-image'};assert.equal(await processVideoThumbnail(f.client,id,async()=>new Blob(['frame'],{type:'image/webp'})),'created');
});
test('Invalid IDs, external URLs and oversized inputs never reach the decoder',async()=>{
 const extract=async()=>{throw Error('Unexpected decoder')};await assert.rejects(processVideoThumbnail(fixture().client,'not-an-asset',extract),ThumbnailInputError);const f=fixture();f.docs.get(id).url='http://localhost/private';await assert.rejects(processVideoThumbnail(f.client,id,extract),ThumbnailInputError);f.docs.get(id).url='https://cdn.sanity.io/files/project/production/'+'a'.repeat(40)+'.mp4';f.docs.get(id).size=101*1024*1024;await assert.rejects(processVideoThumbnail(f.client,id,extract),ThumbnailInputError);
});
test('Deleted assets and non-video files are ignored',async()=>{
 const f=fixture();f.docs.get(id).mimeType='application/pdf';assert.equal(await processVideoThumbnail(f.client,id),'ignored');f.docs.delete(id);assert.equal(await processVideoThumbnail(f.client,id),'ignored');
});
test('A revision race rejects the claim before extraction',async()=>{
 const f=fixture();const patch=f.client.patch;f.client.patch=(key)=>{const result=patch(key);f.docs.get(id)._rev='changed';return result};await assert.rejects(processVideoThumbnail(f.client,id,async()=>{throw Error('Unexpected decoder')}),ThumbnailBusyError);
});
