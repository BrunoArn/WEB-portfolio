import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const overrides={'@/sanity/env':{sanityEnv:{projectId:'testproject',dataset:'production'}}};
const {load}=createTypeScriptLoader({overrides});
overrides['@/content/adapters/localization']=load(resolve(root,'src/content/adapters/localization.ts'));
overrides['@/content/adapters/media']=load(resolve(root,'src/content/adapters/media.ts'));
const {adaptAtlasContent}=load(resolve(root,'src/features/atlas/atlas-content.ts'));
const dictionaries=Object.fromEntries(['pt','en'].map(locale=>[locale,load(resolve(root,'src/i18n/dictionaries/'+locale+'.ts')).default]));
const hash='0123456789abcdef0123456789abcdef01234567';
const icon=()=>({asset:{_id:'image-'+hash+'-800x600-png',url:'https://cdn.sanity.io/images/testproject/production/'+hash+'-800x600.png'}});
const fixture=()=>({projects:[{_id:'project-a',title:{pt:'Projeto A',en:'Project A'},description:{pt:'Descrição',en:'Description'},slug:{current:'project-a'},year:2026,categories:[{_id:'category-a',name:{pt:'Categoria',en:'Category'}}],cover:{_type:'projectImage',alt:{pt:'Capa A',en:'Cover A'},image:{asset:{_id:'cover-a',url:'https://cdn.sanity.io/images/testproject/production/cover.png',metadata:{dimensions:{width:800,height:600}}}}},atlas:{enabled:true,territory:{_ref:'category-a'},desktop:{x:40,y:30},mobile:{x:60,y:20},influence:1}}],territories:[{_id:'category-a',atlas:{isTerritory:true,color:'#123456',label:{pt:'Categoria',en:'Category'},desktop:{x:40,y:20},mobile:{x:50,y:40}}}]});
const adapt=(data,locale)=>adaptAtlasContent(data,locale,dictionaries[locale].atlas.content);
for(const locale of ['pt','en']){
 test('Legacy projects use the cover for their marker without new warnings: '+locale,()=>{
  const result=adapt(fixture(),locale),project=result.projects[0];assert.equal(result.projects.length,1);assert.equal(project.markerImage,project.image);assert.equal(project.markerImage.alt,locale==='pt'?'Capa A':'Cover A');assert.deepEqual(result.issues,[]);
 });
 test('Dedicated icon gets a bounded square URL and preserves the cover/geometry: '+locale,()=>{
  const data=fixture(),before=adapt(data,locale).projects[0];data.projects[0].atlas.icon=icon();const after=adapt(data,locale).projects[0],url=new URL(after.markerImage.src);assert.equal(url.searchParams.get('w'),'256');assert.equal(url.searchParams.get('h'),'256');assert.equal(url.searchParams.get('fit'),'crop');assert.equal(url.searchParams.get('auto'),'format');assert.equal(after.markerImage.alt,data.projects[0].title[locale]);assert.deepEqual(after.image,before.image);const oldRest={...before},newRest={...after};delete oldRest.markerImage;delete newRest.markerImage;assert.deepEqual(newRest,oldRest);
 });
 test('Missing, deleted and malformed icon assets safely use the cover: '+locale,()=>{
  for(const value of [null,{}, {asset:null},{asset:{_id:'',url:'image.png'}},{asset:{_id:'bad-id',url:'image.png'}},{asset:{_id:icon().asset._id,url:''}}]){
   const data=fixture();data.projects[0].atlas.icon=value;const result=adapt(data,locale);assert.equal(result.projects.length,1);assert.equal(result.projects[0].markerImage,result.projects[0].image);assert.deepEqual(result.issues,[]);
  }
 });
 test('An icon is independent from cover availability; both missing retain the placeholder: '+locale,()=>{
  const data=fixture();data.projects[0].cover=null;const empty=adapt(data,locale);assert.equal(empty.projects.length,1);assert.equal(empty.projects[0].image,undefined);assert.equal(empty.projects[0].markerImage,undefined);assert(empty.issues.length>0);data.projects[0].atlas.icon=icon();const result=adapt(data,locale);assert(result.projects[0].markerImage);assert.equal(result.projects[0].image,undefined);assert.deepEqual(result.issues,empty.issues);
 });
 test('Editor crop and hotspot are applied to the marker URL: '+locale,()=>{
  const data=fixture();data.projects[0].atlas.icon=icon();const original=adapt(data,locale).projects[0].markerImage.src;data.projects[0].atlas.icon.crop={left:.25,right:0,top:0,bottom:0};data.projects[0].atlas.icon.hotspot={x:.75,y:.5,width:.1,height:.1};const result=adapt(data,locale).projects[0].markerImage.src;assert.notEqual(result,original);assert.equal(new URL(result).searchParams.get('rect'),'200,0,600,600');
 });
 test('Removing a previously configured icon restores the cover fallback: '+locale,()=>{
  const data=fixture();data.projects[0].atlas.icon=icon();assert.notEqual(adapt(data,locale).projects[0].markerImage.src,data.projects[0].cover.image.asset.url);delete data.projects[0].atlas.icon;const result=adapt(data,locale).projects[0];assert.equal(result.markerImage,result.image);
 });
}
test('Studio icon is optional, supports crop/focus and is shown only for Atlas projects',()=>{
 const {load}=createTypeScriptLoader({overrides:{sanity:{defineField:value=>value,defineType:value=>value},'@sanity/icons/Pin':{PinIcon:()=>null}}});
 const {atlasProjectSettings}=load(resolve(root,'studio/schemaTypes/objects/atlasProjectSettings.ts'));
 const field=atlasProjectSettings.fields.find(field=>field.name==='icon');assert(field);assert.equal(field.type,'image');assert.equal(field.validation,undefined);assert.equal(field.options.hotspot,true);assert.equal(field.options.accept,'image/png,image/webp');assert.equal(field.hidden({parent:{enabled:false}}),true);assert.equal(field.hidden({parent:{enabled:true}}),false);
});
