import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const {load}=createTypeScriptLoader();
const file=path=>fileURLToPath(new URL('../'+path,import.meta.url));
const {adaptProjectCard,adaptProject}=load(file('src/content/adapters/project.ts'));
const {projectProjection,projectCardProjection}=load(file('src/sanity/queries/project.ts'));
const {sanityCacheOptions}=load(file('src/sanity/cache.ts'));
const category=(id,color)=>({_id:id,name:{pt:id,en:id},slug:{current:id},order:0,atlas:{isTerritory:true,color}});
const fixture=()=>({title:{pt:'Projeto',en:'Project'},slug:{current:'project'},year:2026,role:{pt:'Função',en:'Role'},categories:[null,category('games','#91b478'),category('web','#699caa')],atlas:{territory:{_ref:'web'}},cover:{_type:'projectImage',alt:{pt:'Capa',en:'Cover'},image:{asset:{_id:'cover',url:'https://cdn.sanity.io/cover.png',metadata:{dimensions:{width:1600,height:900}}}}}});
for(const locale of ['pt','en'])test('Card model preserves localized fields, cover, categories and selected territory: '+locale,()=>{
 const p=fixture(),card=adaptProjectCard(p,locale);assert.deepEqual(Object.keys(card).sort(),['accentColor','categories','cover','role','slug','title','year']);assert.equal(card.title,p.title[locale]);assert.equal(card.role,p.role[locale]);assert.equal(card.accentColor,'#699caa');assert.deepEqual(card.categories.map(c=>c.slug),['games','web']);assert.equal(card.cover.alt,p.cover.alt[locale]);assert.equal(card.cover.width,1600);assert.equal(card.cover.height,900);
});
test('Cards do not read or validate unrelated detail data',()=>{
 const p=fixture();for(const field of ['description','context','status','featured','order','media','team','technologies','playable','seo'])Object.defineProperty(p,field,{get(){throw Error('Detail-only field accessed: '+field);}});assert.equal(adaptProjectCard(p,'pt').slug,'project');
});
test('Card and detail share category fallbacks, including canonical draft IDs',()=>{
 const p=fixture();p.atlas.territory._ref='drafts.web';assert.equal(adaptProjectCard(p,'pt').accentColor,'#699caa');p.atlas.territory._ref='missing';assert.equal(adaptProjectCard(p,'pt').accentColor,undefined);delete p.atlas;assert.equal(adaptProjectCard(p,'pt').accentColor,'#91b478');
});
test('Full detail retains gallery, game, context and other detail data',()=>{
 const p={...fixture(),description:{pt:'Descrição',en:'Description'},context:{pt:'Contexto',en:'Context'},status:'released',featured:true,order:0,technologies:['Unity'],team:[{name:'Person',role:{pt:'Arte',en:'Art'}}],media:[{_type:'projectVideo',video:{asset:{_id:'video',url:'https://cdn.sanity.io/video.mp4'}}}],playable:{type:'unity-webgl',source:'https://game.test',width:960,height:600},github:'https://github.com/test',liveSite:'https://test.test',seo:{title:{pt:'SEO',en:'SEO'},description:null}};
 const detail=adaptProject(p,'pt');assert.equal(detail.media[0].src,'https://cdn.sanity.io/video.mp4');assert.deepEqual(detail.playable,p.playable);assert.equal(detail.context,'Contexto');assert.equal(detail.team[0].role,'Arte');assert.deepEqual(detail.technologies,['Unity']);assert.equal(detail.seo.title,'SEO');assert.equal(detail.featured,true);
});
test('Invalid shared card fields are still rejected',()=>{
 for(const patch of [{slug:null},{cover:null},{categories:[]},{year:1990},{role:{pt:'',en:'Role'}}])assert.throws(()=>adaptProjectCard({...fixture(),...patch},'pt'));
});
test('Card query excludes detail fields while the full query retains them',()=>{
 for(const field of ['description','context','media','team','technologies','playable','seo']){assert(!new RegExp('\\b'+field+'\\b').test(projectCardProjection),field);assert(new RegExp('\\b'+field+'\\b').test(projectProjection),field);}
});
test('Card repository fetches its lightweight projection with the same webhook dependencies',async()=>{
 const calls=[];const fixtureLoader=createTypeScriptLoader({overrides:{'@/sanity/client':{sanityClient:{fetch:async(...args)=>{calls.push(args);return[];}}},'@/sanity/cache':{sanityCacheOptions},'@/sanity/queries/project':{projectProjection,projectCardProjection},'@/content/adapters/project':{adaptProject,adaptProjectCard}}});
 const {getProjectCards}=fixtureLoader.load(file('src/sanity/repositories/projects.ts'));assert.deepEqual(await getProjectCards('pt'),[]);await getProjectCards('en');assert.deepEqual(calls[0],calls[1]);assert(calls[0][0].includes(projectCardProjection));assert(!calls[0][0].includes('description'));assert.deepEqual(calls[0][2],sanityCacheOptions('projects','categories'));
});
