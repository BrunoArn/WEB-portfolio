import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const {load,loadedFiles}=createTypeScriptLoader({overrides:{'server-only':{}}});
const {getAtlasBackgroundScene,simplifyAtlasOutline,serializeAtlasOutline}=load(resolve(root,'src/features/atlas/atlas-background-scene.ts'));
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

function decodeOutline(d) {
 const tokens=d.match(/[MLHVmlhvZ]|-?(?:\d*\.)?\d+/g)??[];const points=[];let index=0,command='',x=0,y=0;
 const number=()=>Math.round(Number(tokens[index++])*10);
 while(index<tokens.length){
  if(/^[a-z]$/i.test(tokens[index]))command=tokens[index++];
  if(command==='Z')break;
  if(command==='M'||command==='L'){x=number();y=number();}
  else if(command==='l'){x+=number();y+=number();}
  else if(command==='H')x=number();else if(command==='h')x+=number();
  else if(command==='V')y=number();else if(command==='v')y+=number();
  else throw Error('Unexpected command '+command);
  points.push([x,y]);
 }
 return points;
}

test('Compact SVG commands preserve every rounded vertex, including signs and axes',()=>{
 const points=[[0,0],[-.2,.1],[-.2,-.3],[1000,0],[1000.01,0],[.1,.1]];
 for(let i=0;i<1000;i++)points.push([Math.sin(i*.31)*1700,Math.cos(i*.23)*1200]);
 assert.deepEqual(decodeOutline(serializeAtlasOutline(points)),points.map(([x,y])=>[Math.round(x*10)||0,Math.round(y*10)||0]));
 assert.equal(serializeAtlasOutline([]),'');
});

test('Real responsive backgrounds retain the same rounded paths with smaller SVG strings',async()=>{
 const {buildAtlasRelief,positionAtlasProjects,ribbonOutline}=load(resolve(root,'src/features/atlas/atlas-geometry.ts'));
 const {atlasWorlds}=load(resolve(root,'src/features/atlas/atlas-layout.ts'));
 for(const mobile of [false,true]){
  const input=fixture();input.mobile=mobile;const world=atlasWorlds[mobile?'mobile':'desktop'];
  const bounds={left:Math.min(world.terrain.left,-world.width*2),top:Math.min(world.terrain.top,-world.height),right:Math.max(world.terrain.right,world.width*3),bottom:Math.max(world.terrain.bottom,world.height*2)};
  const curves=buildAtlasRelief(world.width,world.height,positionAtlasProjects(input.projects,mobile),mobile,bounds,input.terrain[mobile?'mobile':'desktop'],input.terrain.regions);
  const scene=await getAtlasBackgroundScene(input);let compact=0,legacy=0;
  curves.forEach((curve,i)=>{const points=simplifyAtlasOutline(ribbonOutline(curve,1));const rounded=points.map(([x,y])=>[Math.round(x*10)||0,Math.round(y*10)||0]);assert.deepEqual(decodeOutline(scene.paths[i].d),rounded);let px=0,py=0;const old='M'+rounded.map(([x,y],i)=>{const result=i?((x-px)/10)+','+((y-py)/10):(x/10)+','+(y/10)+'l';px=x;py=y;return result;}).join(' ')+'Z';compact+=scene.paths[i].d.length;legacy+=old.length;});
  assert(compact<legacy*.9);
 }
});
