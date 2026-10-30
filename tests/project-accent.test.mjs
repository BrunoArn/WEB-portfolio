import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function load(relativePath, imports = {}) {
  const filename = new URL('../' + relativePath, import.meta.url);
  const source = ts.transpileModule(readFileSync(filename,'utf8'), {
    compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
  }).outputText;
  const loaded = {exports:{}};
  vm.runInThisContext('(function(require,module,exports){'+source+'\n})', {filename:filename.pathname})((id)=>{
    if (!(id in imports)) throw new Error('Unexpected test import: '+id);
    return imports[id];
  },loaded,loaded.exports);
  return loaded.exports;
}
const localization = load('src/content/adapters/localization.ts');
const categoryAdapter = load('src/content/adapters/category.ts',{'./localization':localization});
const media = load('src/content/adapters/media.ts',{'./localization':localization});
const {adaptProject} = load('src/content/adapters/project.ts',{'./category':categoryAdapter,'./localization':localization,'./media':media});

const category = (id,color) => ({_id:id,name:{pt:id,en:id},slug:{current:id},order:0,atlas:{isTerritory:true,color}});
const fixture = () => ({
  _id:'project',title:{pt:'Projeto',en:'Project'},slug:{current:'project'},year:2026,
  description:{pt:'Descrição',en:'Description'},context:null,role:{pt:'Função',en:'Role'},
  status:'released',organization:null,categories:[category('games','#91b478'),category('web','#699caa')],
  technologies:[],team:[],cover:{_type:'projectImage',alt:{pt:'Capa',en:'Cover'},image:{asset:{_id:'image-cover',url:'https://cdn.sanity.io/cover.jpg'}}},
  media:[],github:null,liveSite:null,playable:null,featured:false,order:0,seo:null,
  atlas:{territory:{_ref:'web'}},
});

for (const locale of ['pt','en']) {
  test('Uses the configured Atlas territory even when it is not the first category: '+locale,()=>{
    const project=fixture(), adapted=adaptProject(project,locale);
    assert.equal(adapted.accentColor,'#699caa');
    assert.deepEqual(adapted.categories.map(c=>c.slug),['games','web']);
  });
}
test('Recognizes canonical draft/published category reference IDs',()=>{
  const project=fixture();project.atlas.territory._ref='drafts.web';
  assert.equal(adaptProject(project,'pt').accentColor,'#699caa');
  project.categories[1]._id='drafts.web';project.atlas.territory._ref='web';
  assert.equal(adaptProject(project,'pt').accentColor,'#699caa');
});
test('A project without an Atlas territory uses its first category with a valid color',()=>{
  const project=fixture();delete project.atlas;project.categories[0].atlas.isTerritory=false;
  assert.equal(adaptProject(project,'pt').accentColor,'#699caa');
});
test('An invalid explicit territory falls back to neutral instead of another category',()=>{
  const project=fixture();project.atlas.territory._ref='unknown';
  assert.equal(adaptProject(project,'pt').accentColor,undefined);
  project.atlas.territory._ref='web';project.categories[1].atlas.color='invalid';
  assert.equal(adaptProject(project,'pt').accentColor,undefined);
});
for (const color of [undefined,null,'','#abc','red','url(https://example.com)','var(--other)','#123456; color:red']) {
  test('Ignores invalid optional category color: '+String(color),()=>{
    assert.equal(categoryAdapter.adaptCategory(category('web',color),'pt').accentColor,undefined);
  });
}
test('Colors on categories not enabled as Atlas territories remain neutral',()=>{
  const source=category('web','#699caa');source.atlas.isTerritory=false;
  assert.equal(categoryAdapter.adaptCategory(source,'pt').accentColor,undefined);
});
test('Legacy category and project data without Atlas configuration still adapt',()=>{
  const source=category('web','#699caa');delete source.atlas;
  assert.deepEqual(categoryAdapter.adaptCategory(source,'pt'),{name:'web',slug:'web',order:0});
  const project=fixture();delete project.atlas;for(const c of project.categories)delete c.atlas;
  assert.equal(adaptProject(project,'pt').accentColor,undefined);
});
