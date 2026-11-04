import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
function fixture(){
 let calls=0;
 const {load}=createTypeScriptLoader();
 const field=load(resolve(root,'src/features/atlas/atlas-field.ts'));
 const original=field.createAtlasField;
 field.createAtlasField=(...args)=>{const sample=original(...args);return(x,y)=>{calls++;return sample(x,y)}};
 const {buildAtlasRelief}=load(resolve(root,'src/features/atlas/atlas-geometry.ts'));
 const projects=[{id:'one',c:'games',x:.32,y:.43,mx:.2,my:.3,influence:1},{id:'two',c:'web',x:.68,y:.71,mx:.8,my:.7,influence:.9}];
 const build=(bounds,cache,changes={})=>buildAtlasRelief(changes.w??100,changes.h??140,changes.projects??projects,changes.mobile??false,bounds,changes.settings??{amplitude:50},changes.regions??[],cache);
 return {build,projects,calls:()=>calls};
}
const base={left:-25,top:-20,right:125,bottom:160},expanded={left:-35,top:-30,right:135,bottom:190};
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('expansion samples only uncovered grid points, including negative coordinates',()=>{
 const f=fixture(),cache={};f.build(base,cache);assert.equal(f.calls(),1147);const first=cache.grid;
 f.build(expanded,cache);assert.equal(f.calls(),1575);assert.notEqual(cache.grid,first);assert.equal(cache.grid.values.length,1575);
 f.build(base,cache);assert.equal(f.calls(),1575,'shrinking into the sampled area needs no new field evaluations');assert.equal(cache.grid.values.length,1147);
});
test('cached and uncached contours match exactly across changes to the domain',()=>{
 const f=fixture(),cache={};for(const mobile of [false,true])for(const bounds of [base,expanded,{left:-42,top:3,right:91,bottom:172},base]){
  assert.equal(digest(f.build(bounds,cache,{mobile})),digest(f.build(bounds,undefined,{mobile})));
 }
});
test('geometry inputs invalidate cached samples, including in-place edits',()=>{
 const profile={enabled:true,shape:'custom',x:40,y:55,width:30,height:15,intensity:.3,rotation:0};
 const variants=[{settings:{amplitude:70}}, {mobile:true}, {w:105}, {h:145}, {regions:[{_key:'extra',kind:'elevation',desktop:profile,mobile:profile}]}];
 for(const change of variants){const f=fixture(),cache={};f.build(base,cache);const before=f.calls(),cached=f.build(base,cache,change);assert(f.calls()>before,'changed geometry must sample again');assert.equal(digest(cached),digest(f.build(base,undefined,change)));}
 for(const key of ['id','c','x','y','influence']){const f=fixture(),cache={};f.build(base,cache);const before=f.calls();f.projects[0][key]=typeof f.projects[0][key]==='string'?'changed':f.projects[0][key]+.03;const cached=f.build(base,cache);assert.equal(f.calls()-before,1147);assert.equal(digest(cached),digest(f.build(base)));}
});
test('independent scenes do not share or overwrite a sampled field',()=>{
 const f=fixture(),a={},b={};f.build(base,a);f.build(expanded,b);const before=f.calls();f.build(base,a);assert.equal(f.calls(),before);assert.notEqual(a.grid,b.grid);
});
