import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

// Recorded from the approved generator before skipping homogeneous cells.
const {cases,...shared}=JSON.parse(readFileSync(new URL('./fixtures/atlas-relief-reference.json',import.meta.url),'utf8'));
const fixtures=cases.map(f=>({...shared,...f}));
const root=fileURLToPath(new URL('../',import.meta.url));
function engine(fixture){
 const modules=new Map();
 function load(filename){
  if(modules.has(filename))return modules.get(filename).exports;
  if(/atlas-(webgl|motion)\.ts$/.test(filename))return {};
  if(filename.endsWith('atlas-field.ts')&&fixture.field){const field=fixture.field==='plateau'?(x,y)=>x<.4?.18:y*.9:()=>fixture.field==='below'?-1:2;return{createAtlasField:()=>field};}
  const loaded={exports:{}};modules.set(filename,loaded);
  const source=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+source+'\n})',{filename})(id=>load(resolve(dirname(filename),id+'.ts')),loaded,loaded.exports);return loaded.exports;
 }
 return load(resolve(root,'src/features/atlas/atlas-engine.ts'));
}
for(const f of fixtures)test('approved contour coordinates and order: '+f.name,()=>{
 const {buildAtlasRelief}=engine(f),cache={};
 for(let repeat=0;repeat<2;repeat++){const curves=buildAtlasRelief(f.w,f.h,f.projects,f.mobile,f.bounds,f.settings,f.regions,cache);assert.equal(curves.length,f.contours);assert.equal(createHash('sha256').update(JSON.stringify(curves)).digest('hex'),f.hash);}
});
