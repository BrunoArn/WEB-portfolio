import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function fixture(field=()=>0){
 let calls=0;const loaded={exports:{}},modules={
  './atlas-webgl':{},'./atlas-raster':{},'./atlas-motion':{},'./atlas-layout':{},'../../../shared/atlas-terrain-settings':{},
  './atlas-field':{createAtlasField:(...args)=>(x,y)=>{calls++;return field(x,y,...args)},createAtlasColorField:()=>()=>[]},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/features/atlas/atlas-engine.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:loaded.exports,module:loaded,require:id=>{assert.ok(modules[id],id);return modules[id]},Float32Array,Float64Array,Uint8Array});
 const defaults={w:100,h:100,projects:[{id:'one',c:'games',x:.3,y:.4,mx:.3,my:.4,influence:1}],mobile:false,settings:{amplitude:50},regions:[]};
 const args=(options={})=>({...defaults,...options});
 return {defaults,level:loaded.exports.atlasFirstContourLevel,calls:()=>calls,
  check:(before,after,options={})=>{const s=args(options);return loaded.exports.atlasExtensionHasNoContours(s.w,s.h,s.projects,s.mobile,before,after,s.settings,s.regions,s.cache)},
  build:(bounds,options={})=>{const s=args(options);return loaded.exports.buildAtlasRelief(s.w,s.h,s.projects,s.mobile,bounds,s.settings,s.regions,s.cache)},
 };
}
const before={left:-10,top:-10,right:10,bottom:10},around={left:-20,top:-20,right:20,bottom:20};
test('identical sampled cells need no speculative field work',()=>{
 const f=fixture();assert(f.check(before,before));assert(f.check({left:.1,top:.1,right:9.9,bottom:9.9},{left:0,top:0,right:10,bottom:10}));assert.equal(f.calls(),0);
});
test('each additional side and shared boundary rejects a potential curve',()=>{
 const cases=[[-15,0,{...before,left:-20}],[-10,0,{...before,left:-20}],[15,0,{...before,right:20}],[10,0,{...before,right:20}],[0,-15,{...before,top:-20}],[0,-10,{...before,top:-20}],[0,15,{...before,bottom:20}],[0,10,{...before,bottom:20}],[-15,-15,around],[15,-15,around],[-15,15,around],[15,15,around]];
 for(const [px,py,after]of cases){const f=fixture((x,y)=>Math.round(x*100)===px&&Math.round(y*100)===py?.3:0);assert.equal(f.check(before,after),false,JSON.stringify({px,py}));}
});
test('high values strictly inside the old area do not trigger a rebuild',()=>{
 const f=fixture((x,y)=>x===0&&y===0?.9:.1);assert(f.check(before,around));
});
test('the shared first level uses Float32 rounding exactly as the generator',()=>{
 const f=fixture(),value=new Float32Array([f.level]),bits=new Uint32Array(value.buffer);bits[0]--;const below=value[0];
 assert(below<f.level);assert(fixture(()=>below).check(before,around));
 assert.equal(fixture(()=>f.level).check(before,around),false,'0.18 rounds up in Float32 and must not be treated as empty');
 assert.equal(fixture(()=>.2).check(before,around),false);
 for(const value of [NaN,Infinity,-Infinity])assert.equal(fixture(()=>value).check(before,around),false);
});
test('valid cached boundary samples are reused without allocating a replacement grid',()=>{
 const f=fixture(),cache={},base={left:0,top:0,right:10,bottom:10},after={...base,left:-10};f.build(base,{cache});const count=f.calls(),grid=cache.grid;assert(f.check(base,after,{cache}));assert.equal(f.calls()-count,6);assert.equal(cache.grid,grid);
});
test('stale caches are rejected for world, profile, project, controls and region changes',()=>{
 const changes=[{w:105},{h:110},{mobile:true},{settings:{amplitude:60}},{regions:[{_key:'new'}]}];
 for(const key of ['id','c','x','y','influence'])changes.push({projectKey:key});
 for(const change of changes){let high=false;const f=fixture(x=>high&&x===0?.3:0),cache={},base={left:0,top:0,right:10,bottom:10},after={...base,left:-10};f.build(base,{cache});high=true;
  const options={...change,cache};if(change.projectKey){const p=f.defaults.projects[0],key=change.projectKey;p[key]=typeof p[key]==='string'?'changed':p[key]+.1;}
  assert.equal(f.check(base,after,options),false,JSON.stringify(change));
 }
 let high=false;const f=fixture(x=>high&&x===0?.3:0),cache={},base={left:0,top:0,right:10,bottom:10};f.defaults.regions.push({_key:'ridge',desktop:{intensity:.1}});f.build(base,{cache});high=true;f.defaults.regions[0].desktop.intensity=.2;assert.equal(f.check(base,{...base,left:-10},{cache}),false);
});
test('unsupported domains and very large checks take the normal path without sampling',()=>{
 const f=fixture();for(const [w,h,after]of [[0,100,around],[Number.MIN_VALUE,100,around],[100,NaN,around],[100,100,{...before,left:-Infinity}],[100,100,{...before,left:0}],[100,100,{...around,right:10000,bottom:10000}]])assert.equal(f.check(before,after,{w,h}),false);assert.equal(f.calls(),0);
});
function reference(w,h,old,next,field,level){
 const sx=w/Math.max(2,Math.round(w/5)),sy=h/Math.max(2,Math.round(h/5));
 const grid=b=>({l:Math.floor(b.left/sx),r:Math.ceil(b.right/sx),t:Math.floor(b.top/sy),b:Math.ceil(b.bottom/sy)}),a=grid(old),b=grid(next);
 for(let y=b.t;y<b.b;y++)for(let x=b.l;x<b.r;x++){
  if(x>=a.l&&x<a.r&&y>=a.t&&y<a.b)continue;
  for(const [gx,gy]of [[x,y],[x+1,y],[x,y+1],[x+1,y+1]]){const v=Math.fround(field(gx*sx/w,gy*sy/h));if(!Number.isFinite(v)||v>level)return false;}
 }return true;
}
test('strip proof matches exhaustive inspection of added cells on irregular negative grids',()=>{
 for(const [w,h]of [[97,123],[137.5,91],[390,1160]])for(let seed=0;seed<10;seed++){
  const field=(x,y)=>seed%3===0?.1:.13+.08*Math.sin(x*(seed+5)*31+y*17),f=fixture(field),base={left:-12.1,top:-7.2,right:13.3,bottom:14.4};
  for(const after of [{...base,left:-24},{...base,right:26},{...base,top:-19},{...base,bottom:29},{left:-24,top:-19,right:26,bottom:29}])assert.equal(f.check(base,after,{w,h}),reference(w,h,base,after,field,f.level));
 }
});
