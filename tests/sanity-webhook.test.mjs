import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {encodeSignatureHeader} from '@sanity/webhook';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=new URL('../',import.meta.url);
const helpers=createTypeScriptLoader({overrides:{'@/i18n/config':{locales:['pt','en']}}}).load(fileURLToPath(new URL('src/sanity/webhook.ts',root)));
const base={_id:'project-1',_type:'project',dataset:'production',operation:'update',slug:'new',previousSlug:'old',thumbnailChanged:false};
const secret='unit-test-secret-not-a-real-key';
function fixture({configured=true,fail=false}={}){
 const tags=[],paths=[],logs=[];
 const {load}=createTypeScriptLoader({globals:{Request,Response,process:{env:{SANITY_REVALIDATE_SECRET:configured?secret:undefined}},console:{error:message=>logs.push(message)}},overrides:{
  '@/sanity/env':{sanityEnv:{dataset:'production'}},'@/sanity/webhook':helpers,
  'next/cache':{revalidateTag:(...args)=>{if(fail)throw Error('internal details');tags.push(JSON.parse(JSON.stringify(args)));},revalidatePath:path=>paths.push(path)},
 }});
 return {...load(fileURLToPath(new URL('src/app/api/sanity/revalidate/route.ts',root))),tags,paths,logs};
}
async function request(payload=base,{raw=JSON.stringify(payload),key=secret,headers={}}={}){
 return new Request('https://site.test/api/sanity/revalidate',{method:'POST',headers:{'content-type':'application/json','sanity-webhook-signature':await encodeSignatureHeader(raw,Date.now(),key),...headers},body:raw});
}

test('Valid signed publication invalidates project dependencies and both old/new PT/EN paths',async()=>{
 const f=fixture(),response=await f.POST(await request());assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(f.tags,[['sanity:projects',{expire:0}]]);assert.deepEqual(f.paths,['/pt/projects/old','/pt/projects/new','/en/projects/old','/en/projects/new']);
 assert.equal((await response.json()).revalidated,true);
});
for(const operation of ['create','delete'])test(operation+' works when only one side has a slug',async()=>{
 const f=fixture();const p={...base,operation,slug:operation==='create'?'new':null,previousSlug:operation==='delete'?'old':null};
 assert.equal((await f.POST(await request(p))).status,200);assert.deepEqual(f.paths,['/pt/projects/'+(p.slug??p.previousSlug),'/en/projects/'+(p.slug??p.previousSlug)]);
});
test('Repeated delivery is safe and unchanged slugs produce no duplicate paths',async()=>{
 const f=fixture(),p={...base,previousSlug:'new'};const first=await(await f.POST(await request(p))).json(),second=await(await f.POST(await request(p))).json();assert.deepEqual(first,second);assert.equal(first.paths.length,2);
});
for(const [type,tag]of [['category','sanity:categories'],['atlasSettings','sanity:atlas'],['aboutPage','sanity:about']])test(type+' invalidates the matching dependency group',async()=>{
 const f=fixture();await f.POST(await request({...base,_type:type}));assert.deepEqual(f.tags,[[tag,{expire:0}]]);assert.deepEqual(f.paths,type==='aboutPage'?['/pt/about','/en/about']:[]);
});
test('Saved video thumbnails invalidate projects without reprocessing media',async()=>{
 const f=fixture();await f.POST(await request({...base,_type:'sanity.fileAsset',thumbnailChanged:true}));assert.deepEqual(f.tags,[['sanity:projects',{expire:0}]]);assert.deepEqual(f.paths,[]);
});
for(const patch of [{_id:'drafts.project-1'},{_id:'versions.release.project-1'},{_type:'unrelated'},{_type:'sanity.fileAsset',thumbnailChanged:false}])test('Unpublished or irrelevant event is acknowledged without invalidation: '+JSON.stringify(patch),async()=>{
 const f=fixture();const response=await f.POST(await request({...base,...patch,tags:['arbitrary'],paths:['/']}));assert.equal(response.status,200);assert.equal((await response.json()).revalidated,false);assert.deepEqual(f.tags,[]);assert.deepEqual(f.paths,[]);
});
test('Missing configuration fails closed without requiring a build-time secret',async()=>{
 const f=fixture({configured:false});assert.equal((await f.POST(await request())).status,503);assert.deepEqual(f.tags,[]);
});
test('Missing/malformed/wrong signatures and modified bodies cannot invalidate cache',async()=>{
 const f=fixture();for(const headers of [{'sanity-webhook-signature':''},{'sanity-webhook-signature':'invalid'}])assert.equal((await f.POST(await request(base,{headers}))).status,401);
 assert.equal((await f.POST(await request(base,{key:'wrong-secret'}))).status,401);
 const signed=await request();const altered=new Request(signed.url,{method:'POST',headers:signed.headers,body:JSON.stringify({...base,_type:'category'})});assert.equal((await f.POST(altered)).status,401);assert.deepEqual(f.tags,[]);
});
test('Signature validates the exact raw JSON rather than a reserialized body',async()=>{
 const f=fixture();assert.equal((await f.POST(await request(base,{raw:JSON.stringify(base,null,2)+'\n'}))).status,200);
});
test('Wrong dataset and malformed signed payloads do not invalidate cache',async()=>{
 const f=fixture();for(const p of [null,[],{...base,dataset:'other'},{...base,_id:''},{...base,operation:['update']},{...base,operation:'publish'},{...base,thumbnailChanged:'true'}, {...base,slug:'../../api'}, {...base,slug:'x?tag=all'}, {...base,slug:String.fromCharCode(0xd800)}, {...base,slug:'界'.repeat(200)}, {...base,slug:'x\\y'}])assert.equal((await f.POST(await request(p))).status,400,JSON.stringify(p));
 assert.equal((await f.POST(await request(base,{raw:'{invalid'}))).status,400);assert.deepEqual(f.tags,[]);
});
test('JSON content type is required',async()=>{const f=fixture();assert.equal((await f.POST(await request(base,{headers:{'content-type':'text/plain'}}))).status,415);});
test('Size is bounded by declared length and actual chunked bytes',async()=>{
 const f=fixture();assert.equal((await f.POST(await request(base,{headers:{'content-length':'20000'}}))).status,413);
 const r=new Request('https://site.test/api/sanity/revalidate',{method:'POST',duplex:'half',headers:{'content-type':'application/json','sanity-webhook-signature':'any'},body:new ReadableStream({start(controller){controller.enqueue(new Uint8Array(17000));controller.close();}})});
 assert.equal((await f.POST(r)).status,413);assert.deepEqual(f.tags,[]);
});
test('Invalid UTF-8 and empty bodies are rejected',async()=>{
 await assert.rejects(helpers.readWebhookBody(new Request('https://site.test',{method:'POST',body:new Uint8Array([255])})),error=>error.status===400);
 await assert.rejects(helpers.readWebhookBody(new Request('https://site.test',{method:'POST'})),error=>error.status===400);
});
test('Unicode slugs are encoded as one local project path segment',()=>{
 const p=helpers.parseWebhookPayload(JSON.stringify({...base,slug:'ação',previousSlug:null}),'production');assert.deepEqual(helpers.webhookInvalidation(p).paths,['/pt/projects/a%C3%A7%C3%A3o','/en/projects/a%C3%A7%C3%A3o']);
});
test('Internal invalidation errors produce a retryable response without leaking details',async()=>{
 const f=fixture({fail:true}),response=await f.POST(await request());assert.equal(response.status,500);const text=await response.text();assert(!text.includes(secret)&&!text.includes('internal details'));assert.equal(f.logs.length,1);
});
