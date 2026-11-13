import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';

const file=path=>fileURLToPath(new URL('../'+path,import.meta.url));
const {load}=createTypeScriptLoader();
const {adaptAbout}=createTypeScriptLoader({overrides:{}}).load(file('src/content/adapters/about.ts'));
const fallback=load(file('src/seo/about.ts'));
const dictionaries=Object.fromEntries(['pt','en'].map(locale=>[locale,load(file('src/i18n/dictionaries/'+locale+'.ts')).default]));
const fixture=()=>({_id:'aboutPage',name:'Bruno Arnaud',email:'qa@example.com',headline:{pt:'Título',en:'Headline'},introduction:{pt:'Introdução visível. '.repeat(20),en:'Visible introduction. '.repeat(20)}});
const expected={
 pt:{title:'Sobre | Bruno Arnaud',description:'Trajetória de Bruno Arnaud: formação em Design de Mídia Digital na PUC-Rio e experiência profissional desde 2020 com Unity, C# e VR/XR.'},
 en:{title:'About | Bruno Arnaud',description:"Bruno Arnaud's background: Digital Media Design at PUC-Rio and professional experience since 2020 with Unity, C# and VR/XR."},
};
function metadata(raw){
 const route='src/app/[lang]/about/page.tsx',overrides={};
 for(const match of readFileSync(file(route),'utf8').matchAll(/from\s*["'](@\/[^"']+)["']/g))overrides[match[1]]={};
 Object.assign(overrides,{
  '@/i18n/config':load(file('src/i18n/config.ts')),
  '@/i18n/get-dictionary':{getDictionary:async locale=>dictionaries[locale]},
  '@/sanity/repositories/about':{getAbout:async locale=>adaptAbout(raw,locale)},
  '@/seo/international':load(file('src/seo/international.ts')),
  '@/seo/social':load(file('src/seo/social.ts')),
  '@/seo/about':fallback,
  'next/navigation':{notFound:()=>{throw Error('NOT_FOUND');}},
 });
 return createTypeScriptLoader({overrides}).load(file(route)).generateMetadata;
}
for(const locale of ['pt','en']){
 test('About CMS SEO preserves existing metadata and social values: '+locale,async()=>{
  const previous=process.env.SEO_CANONICAL_ORIGIN;process.env.SEO_CANONICAL_ORIGIN='https://portfolio.example';
  try{
   const raw=fixture();raw.seo={title:{pt:expected.pt.title,en:expected.en.title},description:{pt:expected.pt.description,en:expected.en.description}};
   const result=await metadata(raw)({params:Promise.resolve({lang:locale})});
   assert.deepEqual(result.title,{absolute:expected[locale].title});assert.equal(result.description,expected[locale].description);
   for(const channel of ['openGraph','twitter']){assert.equal(result[channel].title,expected[locale].title);assert.equal(result[channel].description,expected[locale].description);}
   assert.equal(result.alternates.canonical,'https://portfolio.example/'+locale+'/about');
   assert.deepEqual(result.alternates.languages,{[locale]:'https://portfolio.example/'+locale+'/about',[locale==='pt'?'en':'pt']:'https://portfolio.example/'+(locale==='pt'?'en':'pt')+'/about'});
   const edited=structuredClone(raw);edited.seo.title[locale]='Independent editorial title';edited.seo.description[locale]='Independent editorial description';
   const before=adaptAbout(raw,locale),after=adaptAbout(edited,locale);delete before.seo;delete after.seo;assert.deepEqual(after,before);
   const updated=await metadata(edited)({params:Promise.resolve({lang:locale})});assert.deepEqual(updated.title,{absolute:'Independent editorial title'});assert.equal(updated.twitter.description,'Independent editorial description');
  }finally{if(previous===undefined)delete process.env.SEO_CANONICAL_ORIGIN;else process.env.SEO_CANONICAL_ORIGIN=previous;}
 });
 test('About optional SEO fallback is independent, local and resilient: '+locale,async()=>{
  const other=locale==='pt'?'en':'pt';
  for(const seo of [undefined,null,{},false,42,[],{title:{[other]:'Other language'},description:{[other]:'Other language'}},{title:{[locale]:' \n '},description:{[locale]:42}}]){
   const raw={...fixture(),seo};const result=await metadata(raw)({params:Promise.resolve({lang:locale})});
   assert.equal(result.title,dictionaries[locale].navigation.about);assert.equal(result.description,fallback.summarizeAboutIntroduction(raw.introduction[locale]));
  }
  for(const field of ['title','description']){
   const raw={...fixture(),seo:{[field]:{[locale]:'  Valid override  '}}};const result=await metadata(raw)({params:Promise.resolve({lang:locale})});
   if(field==='title'){assert.deepEqual(result.title,{absolute:'Valid override'});assert.equal(result.description,fallback.summarizeAboutIntroduction(raw.introduction[locale]));}
   else{assert.equal(result.title,dictionaries[locale].navigation.about);assert.equal(result.description,'Valid override');}
  }
  for(const field of ['headline','introduction']){const raw=fixture();raw[field]={[other]:'Other'};assert.throws(()=>adaptAbout(raw,locale),/Missing localized value/);}
  assert.equal(dictionaries[locale].metadata.about,undefined);
 });
}
test('About description fallback collapses whitespace and truncates at a word boundary without splitting Unicode',()=>{
 assert.equal(fallback.summarizeAboutIntroduction('  Short\n\t introduction.  '),'Short introduction.');
 assert.equal(fallback.summarizeAboutIntroduction('x'.repeat(160)),'x'.repeat(160));
 const summary=fallback.summarizeAboutIntroduction('Word '.repeat(50));assert.ok(Array.from(summary).length<=160);assert.ok(summary.endsWith('…'));assert.ok(!summary.endsWith(' …'));
 assert.equal(fallback.summarizeAboutIntroduction('😀'.repeat(170)),'😀'.repeat(159)+'…');
});
