import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function fixture({decode=()=>Promise.resolve(),invalid=false}={}) {
    const images=[],calls=[],timers=new Map();let timerId=0;
    class Image { constructor(){this.naturalWidth=640;images.push(this);} decode(){return decode();} }
    const loaded={exports:{}};
    const js=ts.transpileModule(readFileSync(new URL('../src/components/projects/ProjectCoverTransition.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    vm.runInNewContext('(function(require,module,exports){'+js+'\n})',{
        window:{Image},setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},
    })(id=>id==='next/image'?{getImageProps(props){calls.push(props);if(invalid)throw Error('invalid source');return{props:{src:props.src+'?optimized',srcSet:'small 640w, large 1920w',sizes:props.sizes}};}}:{},loaded,loaded.exports);
    return {...loaded.exports,images,calls,timers};
}

test('Default preparation still targets the project hero',async()=>{
    const f=fixture();assert.equal(await f.prepareProjectCover('/cover.png'),true);assert.equal(f.calls[0].sizes,f.projectHeroSizes);assert.equal(f.images[0].sizes,f.projectHeroSizes);assert.equal(f.timers.size,0);
});
test('Card intent can prepare its own responsive variant without requesting hero sizes',async()=>{
    const f=fixture();assert.equal(await f.prepareProjectCover('/cover.png','460px'),true);assert.equal(f.calls[0].sizes,'460px');assert.equal(f.images[0].sizes,'460px');assert.equal(f.images[0].srcset,'small 640w, large 1920w');assert.equal(f.images[0].fetchPriority,'high');
});
test('A pending decode does not report the image ready',async()=>{
    let finish;const f=fixture({decode:()=>new Promise(resolve=>{finish=resolve;})});let resolved=false;const task=f.prepareProjectCover('/cover.png','460px').then(value=>{resolved=true;return value;});await Promise.resolve();assert.equal(resolved,false);finish();assert.equal(await task,true);assert.equal(f.timers.size,0);
});
test('Decode failure or invalid source remains a safe navigation fallback',async()=>{
    const f=fixture({decode:()=>Promise.reject(Error('decode failed'))});assert.equal(await f.prepareProjectCover('/cover.png'),false);assert.equal(f.timers.size,0);assert.equal(await fixture({invalid:true}).prepareProjectCover('/bad'),false);
});
test('Slow preparation retains its bounded timeout and releases the timer',async()=>{
    const f=fixture({decode:()=>new Promise(()=>{})});const task=f.prepareProjectCover('/cover.png');assert.equal(f.timers.size,1);[...f.timers.values()][0]();assert.equal(await task,false);assert.equal(f.timers.size,0);
});
