import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const {load}=createTypeScriptLoader();
const {createAtlasColorField}=load(resolve(root,'src/features/atlas/atlas-field.ts'));
const projects=[{id:'a',c:'one',x:.3,y:.2,influence:.8},{id:'b',c:'two',x:.7,y:.6,influence:1.3},{id:'c',c:'one',x:.8,y:.9,influence:1}];
for(const mobile of [false,true])test('Color reader preserves weights exactly with reusable output: '+mobile,()=>{
 const ids=['two','one','empty'],sample=createAtlasColorField(projects,mobile,ids),scratch=[0,0,0];
 for(let i=0;i<1000;i++){
  const x=Math.sin(i*.13)*2,y=Math.cos(i*.23)*2,expected=[0,0,0];
  for(const p of projects){const sx=mobile?.25:.22,sy=mobile?.13:.22;expected[ids.indexOf(p.c)]+=p.influence*Math.exp(-.5*(((x-p.x)/sx)**2+((y-p.y)/sy)**2));}
  const powered=expected.map(value=>value**5),sum=powered.reduce((a,b)=>a+b,0)||1,reference=powered.map(value=>value/sum);
  assert.deepEqual(sample(x,y),reference);assert.equal(sample(x,y,scratch),scratch);assert.deepEqual(scratch,reference);
 }
 const first=sample(.3,.2),saved=[...first];sample(.8,.9);assert.deepEqual(first,saved);
});
test('Color reader supports no categories and missing territory sources',()=>{
 assert.deepEqual(createAtlasColorField(projects,false,[])(0,0),[]);
 assert.deepEqual(createAtlasColorField(projects,false,['missing'])(0,0),[0]);
});
