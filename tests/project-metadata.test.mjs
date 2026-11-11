import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const file=path=>fileURLToPath(new URL('../'+path,import.meta.url));
const {load}=createTypeScriptLoader();
const {adaptProject}=load(file('src/content/adapters/project.ts'));
const dictionaries=Object.fromEntries(['pt','en'].map(locale=>[locale,load(file('src/i18n/dictionaries/'+locale+'.ts')).default]));
const localeConfig=load(file('src/i18n/config.ts'));
const seo=load(file('src/seo/international.ts'));
const fixture=()=>({
 _id:'fixture',title:{pt:'Projeto principal',en:'Main project'},description:{pt:'Descrição principal.',en:'Main description.'},
 slug:{current:'fixture'},year:2026,role:{pt:'Programação',en:'Programming'},status:'released',featured:false,order:0,
 categories:[{_id:'games',name:{pt:'Jogos',en:'Games'},slug:{current:'games'},order:0}],technologies:['Unity'],team:[],media:[],
 cover:{_type:'projectImage',alt:{pt:'Capa principal',en:'Main cover'},image:{asset:{_id:'image-fixture',url:'https://cdn.sanity.io/fixture.png',metadata:{dimensions:{width:1600,height:900}}}}},
});

function pageMetadata(route,project=fixture(),getAbout=async()=>({})){
 const filename=file(route);const overrides={};
 for(const match of readFileSync(filename,'utf8').matchAll(/(?:from\s*|import\s*)["'](@\/[^"']+)["']/g))overrides[match[1]]={};
 Object.assign(overrides,{
  '@/i18n/config':localeConfig,
  '@/i18n/get-dictionary':{getDictionary:async locale=>dictionaries[locale]},
  '@/sanity/repositories/projects':{getProjectBySlug:async(slug,locale)=>slug==='missing'?null:adaptProject(project,locale)},
  '@/seo/international':seo,
  '@/sanity/repositories/about':{getAbout},
  'next/navigation':{notFound:()=>{throw new Error('TEST_NOT_FOUND');}},
  'next/font/google':{Geist:()=>({variable:'geist'}),Inter:()=>({variable:'inter'})},
 });
 return createTypeScriptLoader({overrides}).load(filename).generateMetadata;
}

for(const locale of ['pt','en']){
 const other=locale==='pt'?'en':'pt';
 test('SEO absence, partial objects, blanks and invalid values fall back independently: '+locale,async()=>{
  const params=Promise.resolve({lang:locale,slug:'fixture'});
  for(const seo of [undefined,null,{}]){
   const p={...fixture(),seo};const metadata=await pageMetadata('src/app/[lang]/projects/[slug]/page.tsx',p)({params});
   assert.equal(metadata.title,p.title[locale]);assert.equal(metadata.description,p.description[locale]);
  }
  const invalid=[undefined,null,{},'',42,[],{[other]:'Other language'}, {[locale]:''},{[locale]:' \n\t '},{[locale]:42},{[locale]:false},{[locale]:[]},{[locale]:{}}];
  for(const field of ['title','description'])for(const value of invalid){
   const sibling=field==='title'?'description':'title';
   const p={...fixture(),seo:{[field]:value,[sibling]:{[locale]:'Valid sibling'}}};
   const metadata=await pageMetadata('src/app/[lang]/projects/[slug]/page.tsx',p)({params});
   if(field==='title'){assert.equal(metadata.title,p.title[locale]);assert.equal(metadata.description,'Valid sibling');}
   else{assert.deepEqual(metadata.title,{absolute:'Valid sibling'});assert.equal(metadata.description,p.description[locale]);}
  }
 });

 test('Valid editorial SEO is complete, localized and only trimmed at the edges: '+locale,async()=>{
  const p={...fixture(),seo:{title:{pt:'  Título completo — Bruno Arnaud  ',en:'  Complete title — Bruno Arnaud  '},description:{pt:'  Resumo editorial.  ',en:'  Editorial summary.  '}}};
  const adapted=adaptProject(p,locale);assert.equal(adapted.seo.title,p.seo.title[locale].trim());assert.equal(adapted.seo.description,p.seo.description[locale].trim());
  const body={...adapted},baseline=adaptProject(fixture(),locale);delete body.seo;delete baseline.seo;assert.deepEqual(body,baseline);
  const metadata=await pageMetadata('src/app/[lang]/projects/[slug]/page.tsx',p)({params:Promise.resolve({lang:locale,slug:'fixture'})});
  assert.deepEqual(metadata.title,{absolute:p.seo.title[locale].trim()});assert.equal(metadata.description,p.seo.description[locale].trim());
 });

 test('Custom title without a brand is preserved verbatim rather than rewritten: '+locale,async()=>{
  const p={...fixture(),seo:{title:{[locale]:'Editorial wording | Unity & VR'},description:null}};
  const metadata=await pageMetadata('src/app/[lang]/projects/[slug]/page.tsx',p)({params:Promise.resolve({lang:locale,slug:'fixture'})});
  assert.deepEqual(metadata.title,{absolute:'Editorial wording | Unity & VR'});assert.equal(metadata.description,p.description[locale]);
 });

 test('Required project fields keep rejecting missing translations despite optional SEO: '+locale,()=>{
  for(const field of ['title','description','role']){
   const p=fixture();p[field]={[other]:'Only other language'};assert.throws(()=>adaptProject(p,locale),/Missing localized value/);
  }
  const p=fixture();p.cover.alt={[other]:'Only other language'};assert.throws(()=>adaptProject(p,locale),/Missing localized value/);
 });

 test('Page metadata is localized and does not change visible dictionary copy: '+locale,async()=>{
  const dictionary=dictionaries[locale],params=Promise.resolve({lang:locale});
  const home=await pageMetadata('src/app/[lang]/page.tsx')({params});
  assert.deepEqual({title:home.title,description:home.description},{title:{absolute:dictionary.metadata.home.title},description:dictionary.metadata.home.description});
  const projects=await pageMetadata('src/app/[lang]/projects/page.tsx')({params});
  assert.deepEqual({title:projects.title,description:projects.description},{title:dictionary.navigation.projects,description:dictionary.projects.description});
  const about=await pageMetadata('src/app/[lang]/about/page.tsx')({params});
  assert.deepEqual({title:about.title,description:about.description},{title:dictionary.navigation.about,description:dictionary.metadata.about.description});
  const layout=await pageMetadata('src/app/[lang]/layout.tsx')({params});
  assert.equal(layout.title.template,'%s | Bruno Arnaud');assert.equal(layout.description,dictionary.site.description);
  assert.notEqual(home.description,projects.description);assert.notEqual(about.description,projects.description);
 });

 test('Missing project remains a not-found result for metadata: '+locale,async()=>{
  await assert.rejects(pageMetadata('src/app/[lang]/projects/[slug]/page.tsx')({params:Promise.resolve({lang:locale,slug:'missing'})}),/TEST_NOT_FOUND/);
 });
}

test('Unsupported locale is still rejected by metadata routes',async()=>{
 for(const route of ['src/app/[lang]/page.tsx','src/app/[lang]/projects/page.tsx','src/app/[lang]/about/page.tsx','src/app/[lang]/projects/[slug]/page.tsx'])
  await assert.rejects(pageMetadata(route)({params:Promise.resolve({lang:'fr',slug:'fixture'})}),/TEST_NOT_FOUND/);
});

test('Canonical origin validation and explicit indexing',()=>{
 const origin='https://portfolio.example';
 assert.equal(seo.getCanonicalOrigin(' https://Portfolio.example/// '),origin);
 for(const value of [undefined,'','http://portfolio.example','https://portfolio.example/a','https://portfolio.example?','https://portfolio.example#','https://@portfolio.example','https://localhost.','https://127.0.0.1','https://project.up.railway.app','https://pub-id.r2.dev']){
  assert.equal(seo.getCanonicalOrigin(value),undefined,String(value));
 }
 assert.equal(seo.getIndexingMetadata('', 'true').robots.index,false);
 assert.equal(seo.getIndexingMetadata(origin,'false').robots.index,false);
 assert.equal(seo.getIndexingMetadata(origin,'true').robots.index,true);
 assert.deepEqual(seo.getPublicAlternates('pt',{route:'home'},true,''),{});
});

test('Metadata API emits reciprocal URLs and skips unavailable translations',async()=>{
 const origin='https://portfolio.example';
 const previous=process.env.SEO_CANONICAL_ORIGIN;
 process.env.SEO_CANONICAL_ORIGIN=origin;
 try{
  const routes=[
   ['src/app/[lang]/page.tsx',''],
   ['src/app/[lang]/projects/page.tsx','/projects'],
   ['src/app/[lang]/about/page.tsx','/about'],
   ['src/app/[lang]/projects/[slug]/page.tsx','/projects/caf%C3%A9%20%26%20arte'],
  ];
  const project=fixture();
  project.slug.current='café & arte';
  for(const [route,suffix] of routes){
   const generate=pageMetadata(route,project);
   const languages={pt:origin+'/pt'+suffix,en:origin+'/en'+suffix};
   for(const lang of ['pt','en']){
    const metadata=await generate({params:Promise.resolve({lang,slug:project.slug.current})});
    assert.deepEqual(metadata.alternates,{canonical:languages[lang],languages});
   }
  }
  const generate=pageMetadata('src/app/[lang]/projects/[slug]/page.tsx',{
   ...fixture(),title:{pt:'Sem tradução'},
  });
  const metadata=await generate({params:Promise.resolve({lang:'pt',slug:'fixture'})});
  assert.deepEqual(metadata.alternates.languages,{pt:origin+'/pt/projects/fixture'});
  const about=pageMetadata('src/app/[lang]/about/page.tsx',fixture(),async(lang)=>lang==='pt'?{}:null);
  assert.deepEqual((await about({params:Promise.resolve({lang:'pt'})})).alternates.languages,{pt:origin+'/pt/about'});
  await assert.rejects(about({params:Promise.resolve({lang:'en'})}),/TEST_NOT_FOUND/);
  const preview=await pageMetadata('src/app/[lang]/atlas-preview/page.tsx')({params:Promise.resolve({lang:'pt'})});
  assert.equal(preview.robots.index,false);
  assert.equal(preview.alternates,undefined);
 }finally{
  if(previous===undefined)delete process.env.SEO_CANONICAL_ORIGIN;
  else process.env.SEO_CANONICAL_ORIGIN=previous;
 }
});
