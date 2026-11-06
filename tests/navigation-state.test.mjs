import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createTypeScriptLoader} from './helpers/load-typescript.mjs';
const {getNavigationState}=createTypeScriptLoader().load(fileURLToPath(new URL('../src/components/navigation/navigation-state.ts',import.meta.url)));
for(const locale of ['pt','en']) {
    test('Home and Atlas preview use the Atlas shell, with only Home active: '+locale,()=>{
        const home=getNavigationState('/'+locale,locale),preview=getNavigationState('/'+locale+'/atlas-preview',locale);
        assert.equal(home.isHomeActive,true);assert.equal(home.isAtlasPage,true);assert.equal(preview.isHomeActive,false);assert.equal(preview.isAtlasPage,true);assert.equal(preview.isProjectsActive,false);
    });
    test('Project and About descendants stay active without matching similarly named routes: '+locale,()=>{
        for(const path of ['projects','projects/vr-quintandinha']){const state=getNavigationState('/'+locale+'/'+path,locale);assert.equal(state.isProjectsActive,true);assert.equal(state.isAtlasPage,false);assert.equal(state.isAboutActive,false);}
        assert.equal(getNavigationState('/'+locale+'/projects-other',locale).isProjectsActive,false);
        assert.equal(getNavigationState('/'+locale+'/about',locale).isAboutActive,true);
        assert.equal(getNavigationState('/'+locale+'/about/team',locale).isAboutActive,true);
        assert.equal(getNavigationState('/'+locale+'/about-other',locale).isAboutActive,false);
    });
    test('Destinations stay in the current locale: '+locale,()=>{
        const state=getNavigationState('/'+locale+'/projects/one',locale);
        assert.equal(state.homePath,'/'+locale);assert.equal(state.projectsPath,'/'+locale+'/projects');assert.equal(state.aboutPath,'/'+locale+'/about');
    });
}
