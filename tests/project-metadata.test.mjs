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
const social=load(file('src/seo/social.ts'));
const fixture=()=>({
 _id:'fixture',title:{pt:'Projeto principal',en:'Main project'},description:{pt:'Descrição principal.',en:'Main description.'},
 slug:{current:'fixture'},year:2026,role:{pt:'Programação',en:'Programming'},status:'released',featured:false,order:0,
 categories:[{_id:'games',name:{pt:'Jogos',en:'Games'},slug:{current:'games'},order:0}],technologies:['Unity'],team:[],media:[],
 cover:{_type:'projectImage',alt:{pt:'Capa principal',en:'Main cover'},image:{asset:{_id:'image-fixture',url:'https://cdn.sanity.io/fixture.png',metadata:{dimensions:{width:1600,height:900}}}}},
});

function pageMetadata(route,project=fixture(),getAbout=async()=>({introduction:'About introduction.'}),repositories={}){
 const filename=file(route);const overrides={};
 for(const match of readFileSync(filename,'utf8').matchAll(/(?:from\s*|import\s*)["'](@\/[^"']+)["']/g))overrides[match[1]]={};
 Object.assign(overrides,{
  '@/i18n/config':localeConfig,
  '@/i18n/get-dictionary':{getDictionary:async locale=>dictionaries[locale]},
  '@/sanity/repositories/categories':{hasRenderableCategories:async()=>true},
  '@/sanity/repositories/projects':{
   getProjectBySlug:async(slug,locale)=>slug==='missing'?null:adaptProject(project,locale),
   hasRenderableProjectCards:async()=>true,
   hasRenderableProjectAlternate:async(slug,locale)=>{
    if(slug==='missing')return false;
    try{adaptProject(project,locale);return true;}catch{return false;}
   },
  },
  ...repositories,
  '@/seo/international':seo,
  '@/seo/social':social,
  '@/seo/about':load(file('src/seo/about.ts')),
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
  assert.deepEqual({title:about.title,description:about.description},{title:dictionary.navigation.about,description:'About introduction.'});
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
  const about=pageMetadata('src/app/[lang]/about/page.tsx',fixture(),async(lang)=>lang==='pt'?{introduction:'About introduction.'}:null);
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

test('Social metadata uses canonical URLs and prefers the original localized cover',()=>{
 const page={
  alternates:{canonical:'https://portfolio.example/pt/projects/fixture'},
  title:{absolute:'Título editorial'},
  description:'Resumo editorial.',
 };
 const cover={
  id:'fixture',type:'image',
  src:'https://cdn.sanity.io/images/project/production/fixture-1600x900.png',
  width:1600,height:900,alt:'Capa do projeto',
 };
 const metadata=social.getSocialMetadata(page,'pt','projects','Bruno Arnaud',cover);
 assert.equal(metadata.openGraph.locale,'pt_BR');
 assert.equal(metadata.openGraph.type,'website');
 assert.equal(metadata.openGraph.url,page.alternates.canonical);
 assert.equal(metadata.openGraph.title,page.title.absolute);
 assert.equal(metadata.openGraph.description,page.description);
 assert.deepEqual(metadata.openGraph.images,[{url:cover.src,alt:cover.alt,width:1600,height:900}]);
 assert.equal(metadata.twitter.card,'summary_large_image');
 assert.equal(metadata.twitter.title,page.title.absolute);
 assert.deepEqual(metadata.twitter.images,metadata.openGraph.images);

 for(const src of ['', 'http://cdn.sanity.io/images/example.png', 'https:cdn.sanity.io/images/example.png',
  'https://cdn.sanity.io.example/images/example.png',cover.src+'?w=1200',
  'https://user@cdn.sanity.io/images/example.png','/cover.png']){
  const {openGraph,twitter}=social.getSocialMetadata(page,'pt','projects','Bruno Arnaud',{...cover,src});
  assert.equal(openGraph.images[0].url,'https://portfolio.example/api/og/institutional/pt/projects');
  assert.equal(openGraph.images[0].width,1200);
  assert.equal(openGraph.images[0].height,630);
  assert.deepEqual(twitter.images,openGraph.images);
 }
 assert.deepEqual(social.getSocialMetadata({...page,alternates:undefined},'pt','projects','Bruno Arnaud',cover),{});
});

test('Public metadata maps every institutional page and locale to its own social image',async()=>{
 const origin='https://portfolio.example';
 const previous=process.env.SEO_CANONICAL_ORIGIN;
 process.env.SEO_CANONICAL_ORIGIN=origin;
 try{
  for(const [page,route] of [['home','src/app/[lang]/page.tsx'],['projects','src/app/[lang]/projects/page.tsx'],['about','src/app/[lang]/about/page.tsx']]){
   for(const lang of ['pt','en']){
    const metadata=await pageMetadata(route)({params:Promise.resolve({lang})});
    const {openGraph,twitter}=metadata;
    assert.equal(openGraph.url,metadata.alternates.canonical);
    assert.equal(openGraph.locale,lang==='pt'?'pt_BR':'en_US');
    assert.equal(openGraph.title,typeof metadata.title==='string'?metadata.title+' | Bruno Arnaud':metadata.title.absolute);
    assert.equal(openGraph.description,metadata.description);
    assert.equal(openGraph.images[0].url,origin+'/api/og/institutional/'+lang+'/'+page);
    assert.equal(twitter.card,'summary_large_image');
    assert.deepEqual(twitter.images,openGraph.images);
   }
  }
 }finally{
  if(previous===undefined)delete process.env.SEO_CANONICAL_ORIGIN;
  else process.env.SEO_CANONICAL_ORIGIN=previous;
 }
});

test('Projects hreflang agrees with the sitemap for missing translations and shared dependencies',async(t)=>{
 const origin='https://portfolio.example';
 const previous=process.env.SEO_CANONICAL_ORIGIN;
 t.after(()=>{if(previous===undefined)delete process.env.SEO_CANONICAL_ORIGIN;else process.env.SEO_CANONICAL_ORIGIN=previous;});
 process.env.SEO_CANONICAL_ORIGIN=origin;
 const listingRoute='src/app/[lang]/projects/page.tsx';
 const detailRoute='src/app/[lang]/projects/[slug]/page.tsx';
 const project=fixture();
 const category=project.categories[0];
 const badCategory={...category,name:{pt:'Jogos'}};
 const related={...fixture(),slug:{current:'related'},title:{pt:'Relacionado'}};
 const cacheOptions=load(file('src/sanity/cache.ts'));
 const {createSitemap}=load(file('src/seo/sitemap.ts'));

 for(const {items,categories,listingEn,detailEn,ptSlug} of [
  {items:[project],categories:[category],listingEn:true,detailEn:true,ptSlug:'fixture'},
  {items:[{...project,description:{pt:'Descricao'}}],categories:[category],listingEn:true,detailEn:false,ptSlug:'fixture'},
  {items:[project],categories:[category,badCategory],listingEn:false,detailEn:true,ptSlug:'fixture'},
  {items:[project,related],categories:[category],listingEn:false,detailEn:false,ptSlug:'fixture'},
  {items:[{...project,slug:{current:'renamed'}}],categories:[category],listingEn:true,detailEn:true,ptSlug:'renamed'},
 ]){
  const {load:loadRepo}=createTypeScriptLoader({overrides:{
   '@/content/adapters/project':load(file('src/content/adapters/project.ts')),
   '@/content/adapters/category':load(file('src/content/adapters/category.ts')),
   '@/content/adapters/about':load(file('src/content/adapters/about.ts')),
   '@/i18n/config':localeConfig,
   '@/sanity/cache':cacheOptions,
   '@/sanity/queries/project':load(file('src/sanity/queries/project.ts')),
   '@/sanity/queries/about':load(file('src/sanity/queries/about.ts')),
   '@/sanity/repositories/categories':{categoriesQuery:'[]'},
   '@/sanity/client':{sanityClient:{fetch:async(query,params)=>{
    if(params.slug)return items.find((item)=>item.slug.current===params.slug)??null;
    return query.includes('summary')?items:categories;
   }}},
  }});
  const projects=loadRepo(file('src/sanity/repositories/projects.ts'));
  const categoryRepo=loadRepo(file('src/sanity/repositories/categories.ts'));
  const {getSitemapAvailability}=loadRepo(file('src/sanity/repositories/sitemap.ts'));
  const repos={'@/sanity/repositories/projects':projects,'@/sanity/repositories/categories':categoryRepo};
  const listing=pageMetadata(listingRoute,project,undefined,repos);
  const detail=pageMetadata(detailRoute,project,undefined,repos);
  const xml=createSitemap(origin,getSitemapAvailability({sitemapProjects:items,categories,about:null}));
  for(const [generate,suffix,alternate] of [[listing,'/projects',listingEn],[detail,'/projects/'+ptSlug,detailEn]]){
   const args=(lang)=>({params:Promise.resolve({lang,slug:ptSlug})});
   const {alternates}=await generate(args('pt'));
   assert.equal(alternates.canonical,origin+'/pt'+suffix);
   assert.equal(alternates.languages.en,alternate?origin+'/en'+suffix:undefined);
   assert.deepEqual(alternates.languages,xml.find((entry)=>entry.url===alternates.canonical).alternates.languages);
   if(alternate){
    const en=await generate(args('en'));
    assert.equal(en.alternates.canonical,origin+'/en'+suffix);
    assert.deepEqual(en.alternates.languages,alternates.languages);
   }
  }
  if(!listingEn){
   const render=categories.includes(badCategory)?categoryRepo.getCategories:projects.getProjectCards;
   await assert.rejects(render('en'),/Missing localized value/);
  }
  if(ptSlug==='renamed'){
   assert.ok(!xml.some(({url})=>url.endsWith('/fixture')));
   await assert.rejects(detail({params:Promise.resolve({lang:'pt',slug:'fixture'})}),/TEST_NOT_FOUND/);
  }
 }
});

test('Metadata propagates Sanity read errors while a missing origin skips alternate reads',async(t)=>{
 const error=new Error('Sanity unavailable');
 const {load:loadRepo}=createTypeScriptLoader({overrides:{
  '@/content/adapters/category':load(file('src/content/adapters/category.ts')),
  '@/sanity/cache':load(file('src/sanity/cache.ts')),
  '@/sanity/client':{sanityClient:{fetch:async()=>{throw error;}}},
 }});
 const categories=loadRepo(file('src/sanity/repositories/categories.ts'));
 const listing=pageMetadata('src/app/[lang]/projects/page.tsx',fixture(),undefined,{
  '@/sanity/repositories/categories':categories,
 });
 const input={params:Promise.resolve({lang:'pt'})};
 const previous=process.env.SEO_CANONICAL_ORIGIN;
 t.after(()=>{if(previous===undefined)delete process.env.SEO_CANONICAL_ORIGIN;else process.env.SEO_CANONICAL_ORIGIN=previous;});
 process.env.SEO_CANONICAL_ORIGIN='https://portfolio.example';
 await assert.rejects(listing(input),error);
 process.env.SEO_CANONICAL_ORIGIN='';
 assert.equal((await listing(input)).alternates,undefined);
});