import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const cacheFile=fileURLToPath(new URL('../src/sanity/cache.ts',import.meta.url));
const policy=createTypeScriptLoader().load(cacheFile);
function fixture(name,raw){
 const calls=[],configs=[];
 const client={fetch:async(...args)=>{calls.push(args);return raw;},withConfig:config=>{configs.push(config);return client;}};
 const adapt=(value,language)=>({value,language});
 const {load}=createTypeScriptLoader({overrides:{
  '@/sanity/client':{sanityClient:client},'@/sanity/cache':policy,
  '@/sanity/queries/project':{projectProjection:'testProjection'},'@/sanity/queries/about':{aboutQuery:'about query'},
  '@/content/adapters/project':{adaptProject:adapt},'@/content/adapters/category':{adaptCategory:adapt},'@/content/adapters/about':{adaptAbout:adapt},
 }});
 return {...load(fileURLToPath(new URL('../src/sanity/repositories/'+name+'.ts',import.meta.url))),calls,configs};
}

test('Shared recovery window is one hour and each query owns its mutable tag array',()=>{
 const a=policy.sanityCacheOptions('projects','categories','projects');
 assert.equal(a.cache,'force-cache');assert.equal(a.next.revalidate,3600);
 assert.deepEqual(a.next.tags,['sanity:projects','sanity:categories']);
 a.next.tags.push('accidental-change');
 assert.deepEqual(policy.sanityCacheOptions('projects').next.tags,['sanity:projects']);
});

test('Home/background Atlas requests share query, parameters and dependency tags across calls',async()=>{
 const raw={projects:[],territories:[]},f=fixture('atlas',raw);
 assert.equal(await f.getAtlasData(),raw);await f.getAtlasData();
 assert.deepEqual(f.calls[0],f.calls[1]);
 assert.deepEqual(f.calls[0][2],policy.sanityCacheOptions('atlas','projects','categories'));
 assert.deepEqual(f.configs,[{perspective:'published'},{perspective:'published'}]);
});

test('Atlas adjustment preview bypasses persistent cache without a conflicting revalidation interval',async()=>{
 const f=fixture('atlas',{});await f.getAtlasData({fresh:true});
 assert.deepEqual(f.calls[0][2],{cache:'no-store'});
});

for(const name of ['getProjects','getFeaturedProjects'])test(name+' caches referenced categories and shares unlocalized results across PT/EN',async()=>{
 const f=fixture('projects',[{_id:'one'}]);
 assert.equal((await f[name]('pt'))[0].language,'pt');assert.equal((await f[name]('en'))[0].language,'en');
 assert.deepEqual(f.calls[0],f.calls[1]);assert.deepEqual(f.calls[0][2],policy.sanityCacheOptions('projects','categories'));
});

test('Project detail retains slug-specific cache keys, category dependencies and missing-project fallback',async()=>{
 const f=fixture('projects',null);
 assert.equal(await f.getProjectBySlug('first','pt'),null);await f.getProjectBySlug('second','en');
 assert.deepEqual(f.calls.map(call=>call[1]),[{slug:'first'},{slug:'second'}]);
 assert.deepEqual(f.calls[0][2],policy.sanityCacheOptions('projects','categories'));
});

test('Build slug inventory is fresh and still deduplicates published slugs',async()=>{
 const f=fixture('projects',['first','first','second']);assert.deepEqual(await f.getProjectSlugs(),['first','second']);
 assert.deepEqual(f.calls[0][2],{cache:'no-store'});
});

test('Category query has explicit cache policy and language-independent query identity',async()=>{
 const f=fixture('categories',[{_id:'category'}]);
 await f.getCategories('pt');await f.getCategories('en');assert.deepEqual(f.calls[0],f.calls[1]);
 assert.deepEqual(f.calls[0][2],policy.sanityCacheOptions('categories'));
});

test('About uses its own cache group and preserves null fallback',async()=>{
 const f=fixture('about',null);assert.equal(await f.getAbout('pt'),null);await f.getAbout('en');
 assert.deepEqual(f.calls[0],f.calls[1]);assert.deepEqual(f.calls[0][2],policy.sanityCacheOptions('about'));
});
