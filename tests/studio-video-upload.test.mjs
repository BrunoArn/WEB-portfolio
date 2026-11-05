import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const filename=fileURLToPath(new URL('../studio/lib/video-thumbnails/upload.ts',import.meta.url));
const hash='a'.repeat(40),id='file-'+hash+'-mp4';
function fixture(processor){const {load}=createTypeScriptLoader({globals:{setTimeout},overrides:{'./capture':{captureVideoFrame:()=>new Blob(['frame'],{type:'image/webp'}),videoFileHash:async()=>hash},'./process':{processVideoThumbnail:processor,ThumbnailBusyError:class extends Error{}}}});return load(filename);}
const client=(project='project')=>({config:()=>({projectId:project,dataset:'production'})});
test('A late upload cannot associate a frame with a different file',async()=>{let calls=0;const f=fixture(async()=>{calls++;return 'created'}),source=f.localVideo(new File(['video'],'clip.mp4'));assert.equal(await f.thumbnailForUpload(client(),'file-'+ 'b'.repeat(40)+'-mp4',source),'waiting');assert.equal(calls,0);});
test('Concurrent input updates share the same generation promise',async()=>{let calls=0,release;const f=fixture(async()=>{calls++;await new Promise(r=>release=r);return 'created'}),source=f.localVideo(new File(['video'],'clip.mp4'));const first=f.thumbnailForUpload(client(),id,source),second=f.thumbnailForUpload(client(),id,source);await new Promise(r=>setImmediate(r));assert.equal(calls,1);release();assert.deepEqual(await Promise.all([first,second]),['created','created']);});
test('Different datasets/projects do not share processing state',async()=>{let calls=0;const f=fixture(async()=>{calls++;return 'created'}),source=f.localVideo(new File(['video'],'clip.mp4'));await Promise.all([f.thumbnailForUpload(client('a'),id,source),f.thumbnailForUpload(client('b'),id,source)]);assert.equal(calls,2);});
test('A failed upload can be retried instead of retaining a rejected promise',async()=>{let calls=0;const f=fixture(async()=>{if(++calls===1)throw Error('Network error');return 'created'}),source=f.localVideo(new File(['video'],'clip.mp4'));await assert.rejects(f.thumbnailForUpload(client(),id,source),/Network/);assert.equal(await f.thumbnailForUpload(client(),id,source),'created');assert.equal(calls,2);});
