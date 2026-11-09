import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const {load}=createTypeScriptLoader();
const {getAtlasView,atlasWorlds}=load(fileURLToPath(new URL('../src/features/atlas/atlas-layout.ts',import.meta.url)));

for(const width of [320,390,760])test('footer terrain extension preserves mobile anchors at '+width+'px',()=>{
 const height=atlasWorlds.mobile.height*Math.min(1,width/atlasWorlds.mobile.width);
 const resting=getAtlasView(width,height,true);
 const extended=getAtlasView(width,height+96,true);
 assert.equal(extended.scale,resting.scale);
 for(const [x,y] of [[.24,.30],[.74,.64],[.59,.94]]){
  const project=view=>[view.offsetX+x*view.world.width*view.scale,view.offsetY+y*view.world.height*view.scale];
  assert.deepEqual(project(extended),project(resting));
 }
 assert(extended.bounds.bottom*extended.scale+extended.offsetY>=height+96,'terrain covers footer');
});
