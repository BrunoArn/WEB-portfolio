import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

// Recorded from the approved generator before skipping homogeneous cells.
const {cases,...shared}=JSON.parse(readFileSync(new URL('./fixtures/atlas-relief-reference.json',import.meta.url),'utf8'));
const fixtures=cases.map(f=>({...shared,...f}));
const root=fileURLToPath(new URL('../',import.meta.url));
function engine(fixture){
 const overrides={};
 if(fixture.field){
  const field=fixture.field==='plateau'?(x,y)=>x<.4?.18:y*.9:()=>fixture.field==='below'?-1:2;
  overrides[resolve(root,'src/features/atlas/atlas-field.ts')]={createAtlasField:()=>field};
 }
 const {load}=createTypeScriptLoader({overrides});
 return load(resolve(root,'src/features/atlas/atlas-geometry.ts'));
}
for(const f of fixtures)test('approved contour coordinates and order: '+f.name,()=>{
 const {buildAtlasRelief}=engine(f),cache={};
 for(let repeat=0;repeat<2;repeat++){const curves=buildAtlasRelief(f.w,f.h,f.projects,f.mobile,f.bounds,f.settings,f.regions,cache);assert.equal(curves.length,f.contours);assert.equal(createHash('sha256').update(JSON.stringify(curves)).digest('hex'),f.hash);}
});
