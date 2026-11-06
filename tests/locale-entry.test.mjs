import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const root=new URL('../',import.meta.url),loader=createTypeScriptLoader();
const configuration=loader.load(fileURLToPath(new URL('src/i18n/config.ts',root)));
const preference=loader.load(fileURLToPath(new URL('src/i18n/preferred-locale.ts',root)));
const {getPreferredLocale}=preference;
const {proxy}=createTypeScriptLoader({overrides:{'@/i18n/config':configuration,'@/i18n/preferred-locale':preference}}).load(fileURLToPath(new URL('src/proxy.ts',root)));
const {NextRequest}=createRequire(import.meta.url)('next/server');

test('Portuguese and English regional browser preferences select supported routes',()=>{
 for(const header of ['pt','pt-BR,pt;q=0.9,en;q=0.8','PT-PT','pt-AO'])assert.equal(getPreferredLocale(header),'pt');
 for(const header of ['en','en-US,en;q=0.9,pt;q=0.8','EN-GB'])assert.equal(getPreferredLocale(header),'en');
});
test('Browser quality weights and header order decide between supported languages',()=>{
 assert.equal(getPreferredLocale('en;q=0.4,pt-BR;q=0.9'),'pt');
 assert.equal(getPreferredLocale('pt;q=0.4,en-GB;q=0.9'),'en');
 assert.equal(getPreferredLocale('fr-FR,pt;q=0.8,en;q=0.7'),'pt');
 assert.equal(getPreferredLocale('pt;q=0.8,en;q=0.8'),'pt');
 assert.equal(getPreferredLocale('en;q=0.8,pt;q=0.8'),'en');
});
test('Missing, unsupported or excluded languages fall back to English',()=>{
 for(const header of [null,'','fr-FR,es;q=0.8','*','pt;q=0','pt;q=0,en;q=0','pt;q=0,*;q=0.5'])assert.equal(getPreferredLocale(header),'en');
});
test('Malformed ranges or quality values cannot override a valid preference',()=>{
 for(const header of ['pt;q=NaN','pt;q=2','pt;q=-1','pt;q=0.1234','pt;q=0.9;other=1','pt--BR','pt;q=','pt;q=.8'])assert.equal(getPreferredLocale(header),'en',header);
 assert.equal(getPreferredLocale('en;q=invalid,pt;q=0.7'),'pt');
});
test('Unlocalized entry redirects once, preserves destination/query and sets no cookie',()=>{
 const request=new NextRequest('https://portfolio.test/projects/vr-quintandinha?from=atlas',{headers:{'accept-language':'pt-BR'}});
 const response=proxy(request);assert.equal(response.status,307);assert.equal(response.headers.get('location'),'https://portfolio.test/pt/projects/vr-quintandinha?from=atlas');
 assert.equal(response.headers.get('vary'),'Accept-Language');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('set-cookie'),null);
 assert.equal(proxy(new NextRequest('https://portfolio.test/')).headers.get('location'),'https://portfolio.test/en');
});
test('Explicit locale wins over browser preference and leaves page caching untouched',()=>{
 for(const [path,language] of [['/en','pt-BR'],['/en/projects/vr-quintandinha','pt'],['/pt','en-US'],['/pt/about?from=menu','en']]){
  const response=proxy(new NextRequest('https://portfolio.test'+path,{headers:{'accept-language':language}}));
  assert.equal(response.headers.get('x-middleware-next'),'1');assert.equal(response.headers.get('location'),null);assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('cache-control'),null);
 }
});
