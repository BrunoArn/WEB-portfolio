import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const {load,loadedFiles}=createTypeScriptLoader({overrides:{'server-only':{}}});
const {getAtlasBackgroundScene,simplifyAtlasOutline}=load(resolve(root,'src/features/atlas/atlas-background-scene.ts'));
const {resolveAtlasTerrainSettings}=load(resolve(root,'shared/atlas-terrain-settings.ts'));
const fixture=()=>({
  mobile:false,
  projects:[{id:'a',c:'one',x:.25,y:.4,mx:.7,my:.2,influence:1},{id:'b',c:'two',x:.72,y:.6,mx:.35,my:.8,influence:1}],
  territories:[{id:'one',name:'One',color:'#91b478',x:.2,y:.3,mx:.5,my:.2},{id:'two',name:'Two',color:'#699caa',x:.7,y:.6,mx:.5,my:.8}],
  terrain:resolveAtlasTerrainSettings({regions:[]}),
});

test('Resting scene is prepared without a browser and reused across localized labels',async()=>{
  const input=fixture(),first=getAtlasBackgroundScene(input),localized=structuredClone(input);
  localized.territories[0].name='Outro nome';assert.equal(getAtlasBackgroundScene(localized),first);
  const scene=await first;assert(scene.geometryHash.length>0);assert(scene.palette.startsWith('data:image/png;base64,'));
});
test('Published terrain changes invalidate the generated geometry',async()=>{
  const first=await getAtlasBackgroundScene(fixture()),changed=fixture();changed.terrain.desktop.amplitude=75;
  const next=await getAtlasBackgroundScene(changed);assert.notEqual(next.id,first.id);assert.notEqual(next.geometryHash,first.geometryHash);
});
test('Palette changes refresh colors while preserving contour geometry',async()=>{
  const first=await getAtlasBackgroundScene(fixture()),changed=fixture();changed.territories[0].color='#ccaa88';
  const next=await getAtlasBackgroundScene(changed);assert.notEqual(next.palette,first.palette);assert.equal(next.geometryHash,first.geometryHash);
});
test('Responsive scenes use their respective Atlas world and positions',async()=>{
  const desktop=await getAtlasBackgroundScene(fixture()),input=fixture();input.mobile=true;
  const mobile=await getAtlasBackgroundScene(input);assert.equal(desktop.width,1440);assert.equal(mobile.width,390);assert.equal(mobile.height,1160);assert.notEqual(mobile.id,desktop.id);assert.notEqual(mobile.geometryHash,desktop.geometryHash);
});

test('SVG compaction preserves endpoints and bounds geometric error',()=>{
  const points=Array.from({length:1000},(_,i)=>[i/10,Math.sin(i/40)*3]),result=simplifyAtlasOutline(points);
  assert.deepEqual(result[0],points[0]);assert.deepEqual(result.at(-1),points.at(-1));assert(result.length<points.length/5);
  for(const [x,y] of points){let distance=Infinity;for(let i=1;i<result.length;i++){const [ax,ay]=result[i-1],[bx,by]=result[i],dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;distance=Math.min(distance,Math.hypot(x-ax-t*dx,y-ay-t*dy));}assert(distance<=.25+1e-8);}
});

test('server background dependencies do not load browser controllers',()=>{
 assert(!loadedFiles().some(filename=>/atlas-(engine|webgl|motion|interaction)\.ts$/.test(filename)));
});
