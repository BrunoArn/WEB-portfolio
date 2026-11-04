import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const geometryPath=resolve(root,'src/features/atlas/atlas-geometry.ts');
const cachePath=resolve(root,'src/features/atlas/atlas-geometry-cache.ts');
const base={left:-20,top:-20,right:120,bottom:120};
const expanded={left:-40,top:-40,right:160,bottom:180};
function fixture(){
 const calls={builds:0,proofs:0,samples:[]};let empty=false;
 const actual=createTypeScriptLoader().load(geometryPath);
 const geometry={...actual,
  buildAtlasRelief:(...args)=>{calls.builds++;calls.samples.push(args[7]);args[7].grid={values:new Float32Array([1])};return[{index:calls.builds,contour:{closed:false,path:[[0,0],[1,1]]}}]},
  atlasExtensionHasNoContours:()=>{calls.proofs++;return empty},
 };
 const {load}=createTypeScriptLoader({overrides:{[geometryPath]:geometry}});
 const {createAtlasGeometryCache}=load(cachePath);
 const request=(bounds=base,changes={})=>({width:100,height:100,projects:[],mobile:false,bounds,controls:{amplitude:50,elongation:50,direction:0,connection:50,negativeSpace:50},regions:[],...changes});
 return{cache:createAtlasGeometryCache(),create:createAtlasGeometryCache,request,calls,setEmpty:value=>{empty=value}};
}
test('describing geometry never builds curves; duplicate preparation keeps the same entry',()=>{
 const f=fixture(),plan=f.cache.describe(f.request());assert.equal(f.calls.builds,0);
 const curves=f.cache.prepare(plan,{resting:true});assert.equal(f.cache.builds,1);
 assert.equal(f.cache.prepare(f.cache.describe(f.request()),{resting:true}),curves);assert.equal(f.calls.builds,1);assert.equal(f.calls.proofs,0);
});
test('resting geometry is retained while selections do not accumulate in a per-project cache',()=>{
 const f=fixture(),prepare=(bounds,resting)=>f.cache.prepare(f.cache.describe(f.request(bounds)),{resting});
 const original=prepare(base,true);prepare(expanded,false);assert.equal(prepare(base,true),original);
 prepare({...expanded,right:180},false);assert.equal(prepare(base,true),original);prepare(expanded,false);
 assert.equal(f.calls.builds,4);assert.equal(new Set(f.calls.samples).size,1,'one sampled field belongs to this scene');
});
test('empty coverage is reused only for the same geometry configuration and extent',()=>{
 const f=fixture(),initial=f.cache.describe(f.request()),curves=f.cache.prepare(initial,{resting:true});f.setEmpty(true);
 const empty=f.cache.describe(f.request(expanded));assert.equal(empty.key,initial.key);assert.equal(f.cache.prepare(empty,{resting:false}),curves);
 f.cache.describe(f.request(expanded));assert.equal(f.calls.proofs,1);
 const changed=f.cache.describe(f.request(expanded,{controls:{...f.request().controls,amplitude:65}}));assert.notEqual(changed.key,initial.key);assert.equal(changed.bounds,expanded);f.cache.prepare(changed,{resting:false});assert.equal(f.calls.builds,2);assert.equal(f.calls.proofs,1,'changed inputs bypass the old proof');
});
test('clear releases samples, current/resting entries and proof state together',()=>{
 const f=fixture(),original=f.cache.prepare(f.cache.describe(f.request()),{resting:true});f.setEmpty(true);f.cache.describe(f.request(expanded));assert.equal(f.calls.proofs,1);
 f.cache.clear();assert.equal(f.calls.samples[0].grid,undefined);assert.equal(f.cache.builds,0);
 const fresh=f.cache.prepare(f.cache.describe(f.request()),{resting:true});assert.notEqual(fresh,original);assert.equal(f.cache.builds,1);f.cache.describe(f.request(expanded));assert.equal(f.calls.proofs,2);
});
test('clearing one mounted scene cannot invalidate another scene',()=>{
 const f=fixture(),other=f.create(),a=f.cache.prepare(f.cache.describe(f.request()),{resting:true}),b=other.prepare(other.describe(f.request()),{resting:true});assert.notEqual(a,b);assert.notEqual(f.calls.samples[0],f.calls.samples[1]);
 f.cache.clear();assert.equal(f.calls.samples[0].grid,undefined);assert.ok(f.calls.samples[1].grid);assert.equal(other.prepare(other.describe(f.request()),{resting:true}),b);assert.equal(f.calls.builds,2);
});
test('geometry and cache dependencies do not load browser controllers',()=>{
 const {load,loadedFiles}=createTypeScriptLoader();load(cachePath);
 assert(!loadedFiles().some(filename=>/atlas-(engine|webgl|motion|interaction)\.ts$/.test(filename)));
});
