import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const {load}=createTypeScriptLoader();
const atlas=name=>load(fileURLToPath(new URL('../src/features/atlas/'+name+'.ts',import.meta.url)));
const {advanceAtlasPointer,atlasMouseImpulseReference,atlasPointerImpulseReference}=atlas('atlas-pointer-impulse');
const {createAtlasString}=atlas('atlas-string-response');
const strand=()=>createAtlasString({path:[[0,0],[200,0]],closed:false});
function passage(speed,{dt=1/60,unit=1,input='mouse'}={}){
 const line=strand();const hits=[];
 for(let y=-90*unit;y<=90*unit;y+=speed*dt*unit){
  advanceAtlasPointer(line,100*unit,y,true,speed,85,dt,unit,65,false,input);
  for(const impulse of line.pointer.impulses)if(impulse.age===.035)hits.push({y:y/unit,value:impulse.value/unit});
 }
 return {line,hits};
}
test('slow mouse passages excite a strand close to contact, including below the former speed gate',()=>{
 for(const speed of [12,20,40,80]){const {hits}=passage(speed);assert.equal(hits.length,1,'speed '+speed);assert(Math.abs(hits[0].y)<=12);assert(Math.abs(hits[0].value)>3);}
});
test('a passage does not spend its wave at the broad influence boundary',()=>{
 const line=strand();advanceAtlasPointer(line,100,-60,true,40,85,.02,1,65);
 assert(line.pointer.impulses.every(i=>i.age<0));assert.equal(line.pointer.armed,true);
 advanceAtlasPointer(line,100,-10,true,40,85,.02,1,65);assert(line.pointer.impulses.some(i=>i.age>=0));
});
test('stationary pointer and very slow jitter do not generate waves',()=>{
 for(const speed of [0,1,4,7.9]){const line=strand();for(let i=0;i<100;i++)advanceAtlasPointer(line,100,5,true,speed,85,.02,1,65);assert(line.pointer.impulses.every(i=>i.age<0));}
});
test('fast mouse response stays bounded and close to the previous high-speed amplitude',()=>{
 for(const speed of [450,900]){const {hits}=passage(speed);assert.equal(hits.length,1);assert(Math.abs(hits[0].y)>50);}
 let previous=0;
 for(const speed of [8,12,25,50,100,250,450,900,5000]){
  const line=strand();advanceAtlasPointer(line,100,10,true,speed,85,.02,1,65);
  const value=Math.abs(line.pointer.impulses[0].value);assert(value>=previous);previous=value;
  const cap=11*.85*atlasPointerImpulseReference.maximumGain;assert(value<=cap);
  if(speed>=450){const normal=10/Math.hypot(10,8),old=cap*(1-Math.exp(-speed/450))*normal*Math.exp(-.5*100/(65*65));assert(value/old<1.02);}
 }
});
test('contact and energy remain consistent across sampling rates and world scale',()=>{
 const samples=[passage(40,{dt:1/30}),passage(40,{dt:1/60}),passage(40,{dt:1/120}),passage(40,{unit:2})].map(r=>r.hits[0]);
 for(const hit of samples){assert(Math.abs(hit.y-samples[0].y)<1.5);assert(Math.abs(hit.value-samples[0].value)<.2);}
});
test('slow passage is finite, respects cooldown and dissipates after leaving',()=>{
 const {line}=passage(40);for(let i=0;i<100;i++)advanceAtlasPointer(line,100,5,false,0,85,.02,1,65);
 assert(line.pointer.impulses.every(i=>i.age<0));assert.equal(line.pointer.armed,true);
 advanceAtlasPointer(line,100,10,true,40,85,.02,1,65);assert.equal(line.pointer.impulses.filter(i=>i.age>=0).length,1);
 advanceAtlasPointer(line,100,10,true,40,85,.02,1,65);assert.equal(line.pointer.impulses.filter(i=>i.age>=0).length,1);
 assert.equal(atlasMouseImpulseReference.cooldown,atlasPointerImpulseReference.cooldown);
});
test('touch keeps the broad contact area, speed threshold and stationary tap',()=>{
 assert.equal(passage(12,{input:'touch'}).hits.length,0);
 const {hits}=passage(40,{input:'touch'});assert.equal(hits.length,1);assert(Math.abs(hits[0].y)>60);
 const line=strand();advanceAtlasPointer(line,100,0,true,0,85,0,1,65,true,'touch');assert(line.pointer.impulses.some(i=>i.age>=0&&Math.abs(i.value)>0));
});
