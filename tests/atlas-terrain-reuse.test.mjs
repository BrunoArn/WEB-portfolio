import assert from 'node:assert/strict';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

function fixture(){
 const calls={prepare:0,surface:0,configure:0,screens:[],disposed:0,colorFields:0},frames=new Map();let next=0;
 const rectangle={left:0,top:0,width:100,height:100},text={left:20,top:10,width:60,height:30};
 const canvas={style:{},dataset:{}},viewport={getBoundingClientRect:()=>rectangle},intro={getBoundingClientRect:()=>text};
 const gpu={prepare:()=>calls.prepare++,updateSurface:()=>calls.surface++,paint(){},dispose:()=>calls.disposed++};
 const motion={configure:()=>calls.configure++,setScreen:(...args)=>calls.screens.push(args),prepare:()=>({}),isRunning:()=>false,set(){},pulse(){},dispose(){}};
 const projects=[],territories=[{id:'one',color:'#aabbcc'}];
 const settings={desktop:{amplitude:50},mobile:{amplitude:50},regions:[]};
 const modules={
  './atlas-webgl':{createAtlasWebGL:()=>gpu},
  './atlas-raster':{atlasRasterResolution:(w,h,dpr)=>({ratio:dpr,pixelWidth:Math.ceil(w*dpr),pixelHeight:Math.ceil(h*dpr),limited:false})},
  './atlas-motion':{mountAtlasMotion:()=>motion},
  '../../../shared/atlas-terrain-settings':{resolveAtlasTerrainSettings:value=>value},
  './atlas-layout':{getAtlasView:()=>({world:{width:100,height:100},scale:1,offsetX:0,offsetY:0,bounds:{left:-200,top:-200,right:400,bottom:400}})},
  './atlas-field':{createAtlasField:()=>((x,y)=>Math.exp(-((x-.5)**2+(y-.5)**2)*3)+.8*Math.exp(-((x-4.5)**2+(y-.5)**2)*3)),createAtlasColorField:()=>{calls.colorFields++;return()=>[1]}},
 };
 const filename=fileURLToPath(new URL('../src/features/atlas/atlas-engine.ts',import.meta.url));
 const overrides=Object.fromEntries(Object.entries(modules).map(([id,value])=>[resolve(dirname(filename),id+'.ts'),value]));
 const globals={
  window:{devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),addEventListener(){},removeEventListener(){}},
  document:{fonts:{ready:{then(){}}},createElement:()=>({width:0,height:0,getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})})},
  ResizeObserver:class {observe(){}disconnect(){}},requestAnimationFrame:fn=>{frames.set(++next,fn);return next},cancelAnimationFrame:id=>frames.delete(id),
 };
 const {load}=createTypeScriptLoader({overrides,globals});
 const controller=load(filename).mountAtlasTerrain(canvas,viewport,intro,projects,territories,'mobile',settings,{staticFallback:false,entrance:true});
 const flush=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());};flush();
 return {calls,canvas,controller,flush,text,settings,territories};
}
test('camera crops and density changes reuse the motion field and resident mesh',()=>{
 const f=fixture();assert.equal(f.calls.prepare,1);assert.equal(f.calls.configure,1);
 f.controller.extend({left:-24,top:-24,right:124,bottom:124},1.85);
 f.controller.crop({left:10,top:15,right:90,bottom:95});
 f.controller.crop();f.controller.extend();
 assert.equal(f.calls.prepare,1);assert.equal(f.calls.configure,1);assert.equal(f.calls.surface,4);
 assert.deepEqual(Array.from(f.calls.screens[1]),[10,15]);
 f.controller.crop();assert.equal(f.calls.surface,4,'identical camera reports are ignored');
 f.controller.dispose();assert.equal(f.calls.disposed,1);
});
test('closing reuses the resting contours after an expanded selection',()=>{
 const f=fixture();assert.equal(f.canvas.dataset.geometryBuilds,'1');
 f.controller.extend({left:-500,top:-500,right:600,bottom:600},1.65);assert.equal(f.calls.prepare,2);assert.equal(f.canvas.dataset.geometryBuilds,'2');
 f.controller.crop({left:-10,top:-10,right:90,bottom:90});assert.equal(f.calls.prepare,2);
 f.controller.extend();assert.equal(f.calls.prepare,3);assert.equal(f.canvas.dataset.geometryBuilds,'2','resting contours are not rebuilt');
});
test('intro and terrain edits invalidate the mesh even after a camera crop',()=>{
 const f=fixture();f.controller.crop({left:10,top:10,right:90,bottom:90});
 f.text.width=70;f.controller.crop({left:10,top:10,right:90,bottom:90});assert.equal(f.calls.prepare,2);
 f.controller.setSettings({...f.settings,desktop:{amplitude:60}});f.flush();assert.equal(f.calls.prepare,3);assert.equal(f.canvas.dataset.geometryBuilds,'2');
 f.controller.extend();assert.equal(f.canvas.dataset.geometryBuilds,'2','old resting settings must not be restored');
});

test('a proven empty extension keeps the curves and resident mesh across crops and return',()=>{
 const f=fixture();f.controller.extend({left:-100,top:-100,right:200,bottom:600},1.65);assert.equal(f.calls.prepare,1);assert.equal(f.calls.configure,1);assert.equal(f.canvas.dataset.geometryBuilds,'1');assert.equal(f.calls.surface,1);
 f.controller.crop({left:10,top:20,right:90,bottom:95});f.controller.extend();assert.equal(f.calls.prepare,1);assert.equal(f.canvas.dataset.geometryBuilds,'1');
 f.controller.setSettings({...f.settings,desktop:{amplitude:65}});f.flush();assert.equal(f.calls.prepare,2,'field edits must invalidate the empty proof');
});

test('color-field reader remains stable across crops and invalidates with geometry inputs',()=>{
 const f=fixture();assert.equal(f.calls.colorFields,1);f.controller.extend({left:-24,top:-24,right:124,bottom:124},1.85);f.controller.crop({left:10,top:15,right:90,bottom:95});f.controller.extend();assert.equal(f.calls.colorFields,1);
 f.controller.setSettings({...f.settings,desktop:{amplitude:65}});f.flush();assert.equal(f.calls.colorFields,2);
});
test('territory index changes invalidate the color-field reader on the next surface update',()=>{
 const f=fixture();f.territories.push({id:'two',color:'#556677'});f.controller.crop({left:10,top:15,right:90,bottom:95});assert.equal(f.calls.colorFields,2);
 f.territories.reverse();f.controller.crop({left:11,top:15,right:90,bottom:95});assert.equal(f.calls.colorFields,3);
});
