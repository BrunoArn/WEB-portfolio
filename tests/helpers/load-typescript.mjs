import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,extname,resolve} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const require=createRequire(import.meta.url);

/** Isolated module cache per fixture; optional browser globals and dependency mocks. */
export function createTypeScriptLoader({globals,overrides={}}={}){
 const modules=new Map();
 const context=globals?vm.createContext({console,Float32Array,Float64Array,Uint8Array,...globals}):undefined;
 function load(filename){
  filename=resolve(filename);
  if(Object.hasOwn(overrides,filename))return overrides[filename];
  if(modules.has(filename))return modules.get(filename).exports;
  const loaded={exports:{}};modules.set(filename,loaded);
  const source=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const localRequire=id=>{
   if(Object.hasOwn(overrides,id))return overrides[id];
   if(id.startsWith('.'))return load(resolve(dirname(filename),extname(id)?id:id+'.ts'));
   return require(id);
  };
  const wrapped='(function(require,module,exports){'+source+'\n})';
  const factory=context?vm.runInContext(wrapped,context,{filename}):vm.runInThisContext(wrapped,{filename});
  factory(localRequire,loaded,loaded.exports);
  return loaded.exports;
 }
 return {load,loadedFiles:()=>[...modules.keys()]};
}
