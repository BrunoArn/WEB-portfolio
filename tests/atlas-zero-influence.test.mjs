import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const root=new URL('../',import.meta.url);
const overrides={'server-only':{},'@/sanity/env':{sanityEnv:{projectId:'testproject',dataset:'production'}}};
const {load}=createTypeScriptLoader({overrides});
const source=file=>load(fileURLToPath(new URL(file,root)));
overrides['@/content/adapters/localization']=source('src/content/adapters/localization.ts');
overrides['@/content/adapters/media']=source('src/content/adapters/media.ts');
const {createAtlasField,createAtlasColorField}=source('src/features/atlas/atlas-field.ts');
const {writeAtlasColor}=source('src/features/atlas/atlas-color.ts');
const {buildAtlasRelief,positionAtlasProjects}=source('src/features/atlas/atlas-geometry.ts');
const {adaptAtlasContent}=source('src/features/atlas/atlas-content.ts');
const {validateAtlasProject}=source('studio/schemaTypes/atlas/atlasValidation.ts');
const {getAtlasBackgroundScene}=source('src/features/atlas/atlas-background-scene.ts');
const {resolveAtlasTerrainSettings}=source('shared/atlas-terrain-settings.ts');
const anchor=(id,c,influence=1)=>({id,c,x:.32,y:.43,mx:.65,my:.6,influence});
const projectSettings=influence=>({enabled:true,territory:{_ref:'category'},desktop:{x:30,y:40},mobile:{x:60,y:70},influence});
const context={document:{categories:[{_ref:'category'}]},getClient:()=>({withConfig:()=>({fetch:async()=>({_type:'category',atlas:{isTerritory:true}})})})};
const contentFixture=influence=>({projects:[{_id:'project',title:{pt:'Projeto',en:'Project'},description:{pt:'Descrição',en:'Description'},slug:{current:'project'},year:2026,categories:[{_id:'category',name:{pt:'Categoria',en:'Category'}}],cover:{_type:'projectImage',alt:{pt:'Capa',en:'Cover'},image:{asset:{_id:'cover',url:'https://cdn.sanity.io/cover.png'}}},atlas:projectSettings(influence)}],territories:[{_id:'category',atlas:{isTerritory:true,color:'#91b478',label:{pt:'Categoria',en:'Category'},desktop:{x:30,y:20},mobile:{x:50,y:40}}}]});

test('Studio accepts zero and positive fractions while rejecting invalid influence',async()=>{
 for(const influence of [0,.001,.1,.5,1,2,undefined])assert.equal(await validateAtlasProject(projectSettings(influence),context),true);
 for(const influence of [-.001,-1,2.001,NaN,Infinity,-Infinity,null,'0'])assert.notEqual(await validateAtlasProject(projectSettings(influence),context),true);
});
for(const locale of ['pt','en'])test('Zero influence keeps the marker, category, cover, positions and destination: '+locale,()=>{
 const dictionary=source('src/i18n/dictionaries/'+locale+'.ts').default;
 const zero=adaptAtlasContent(contentFixture(0),locale,dictionary.atlas.content),normal=adaptAtlasContent(contentFixture(1),locale,dictionary.atlas.content);
 assert.equal(zero.projects.length,1);assert.equal(zero.projects[0].influence,0);assert.deepEqual(zero.unplaced,[]);assert.deepEqual(zero.issues,[]);assert.equal(zero.territories.length,1);
 assert.deepEqual({...zero.projects[0],influence:1},normal.projects[0]);
 for(const value of [-.1,2.1,NaN])assert.equal(adaptAtlasContent(contentFixture(value),locale,dictionary.atlas.content).projects.length,0);
 assert.equal(adaptAtlasContent(contentFixture(undefined),locale,dictionary.atlas.content).projects[0].influence,1);
});
for(const mobile of [false,true])test('Zero markers cannot change another source shape, contours or colors: '+mobile,()=>{
 const active=anchor('active','one'),zero={...anchor('zero','one',0),x:.8,y:.2,mx:.2,my:.3};
 const before=positionAtlasProjects([active],mobile),after=positionAtlasProjects([active,zero],mobile);
 const field=createAtlasField(before,mobile,undefined,[]),withZero=createAtlasField(after,mobile,undefined,[]);
 const colors=createAtlasColorField(before,mobile,['one','two']),withZeroColors=createAtlasColorField(after,mobile,['one','two']);
 for(let y=-.25;y<=1.25;y+=.125)for(let x=-.25;x<=1.25;x+=.125){assert.equal(withZero(x,y),field(x,y));assert.deepEqual(withZeroColors(x,y),colors(x,y));}
 assert.deepEqual(buildAtlasRelief(200,140,after,mobile,undefined,undefined,[]),buildAtlasRelief(200,140,before,mobile,undefined,undefined,[]));
 const other=positionAtlasProjects([active,{...zero,c:'two'}],mobile);assert.deepEqual(createAtlasColorField(other,mobile,['one','two'])(.8,.2),colors(.8,.2));
});
test('Changing a cached source between positive and zero never reuses stale terrain',()=>{
 const active=anchor('active','one'),cache={};const build=projects=>buildAtlasRelief(200,140,projects,false,undefined,undefined,[],cache);
 const initial=build([active]);assert(initial.length>0);const key=cache.grid.key;
 assert.deepEqual(build([{...active,influence:0}]),[]);assert.notEqual(cache.grid.key,key);assert.deepEqual(build([active]),initial);
});
test('All-zero color sources remain finite and use the existing neutral palette fallback',()=>{
 const weights=createAtlasColorField([anchor('zero','one',0)],false,['one','two'])(.32,.43);assert.deepEqual(weights,[0,0]);
 const pixels=new Uint8ClampedArray([1,2,3,99,4,5,6,88]);writeAtlasColor(weights,[[145,180,120],[100,150,170]],pixels,0);assert.deepEqual([...pixels],[149,163,155,99,4,5,6,88]);
 writeAtlasColor([],[],pixels,4);assert.deepEqual([...pixels].slice(4),[149,163,155,88]);
 writeAtlasColor([.25,.75],[[100,150,200],[200,50,100]],pixels,0);assert.deepEqual([...pixels].slice(0,4),[175,75,125,99]);
});
for(const mobile of [false,true])test('Support-only backgrounds are neutral and retain terrain when all markers have zero: '+mobile,async()=>{
 const profile={enabled:true,shape:'custom',x:50,y:50,width:25,height:12,intensity:.8,rotation:0};
 const terrain=resolveAtlasTerrainSettings({regions:[{_key:'support',kind:'elevation',desktop:profile,mobile:profile}]});
 const zero=await getAtlasBackgroundScene({mobile,terrain,projects:[anchor('zero','one',0)],territories:[{id:'one',name:'One',color:'#91b478',x:.3,y:.2,mx:.5,my:.4}]});
 const absent=await getAtlasBackgroundScene({mobile,terrain,projects:[],territories:[]});
 assert(zero.paths.length>0);assert.equal(zero.geometryHash,absent.geometryHash);assert.equal(zero.palette,absent.palette);
});
