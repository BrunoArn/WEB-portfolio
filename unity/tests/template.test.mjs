import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile, writeFile} from 'node:fs/promises';

const source = await readFile(new URL('../WebGLTemplates/PortfolioResponsive/index.html', import.meta.url), 'utf8');
const profile = {
  PRODUCT_NAME: 'Example Game', COMPANY_NAME: 'Example Studio', PRODUCT_VERSION: '1.0',
  WIDTH: 960, HEIGHT: 600, BACKGROUND_FILENAME: '', BACKGROUND_COLOR: '#231F20',
  LOADER_FILENAME: 'example.loader.js', DATA_FILENAME: 'example.data.br',
  FRAMEWORK_FILENAME: 'example.framework.js.br', CODE_FILENAME: 'example.wasm.br',
  WORKER_FILENAME: 'example.worker.js', SYMBOLS_FILENAME: '',
  SHOW_DIAGNOSTICS: false, USE_THREADS: false, USE_WASM: true,
};

// QA materialization of this template's directives, NOT Unity's exporter.
function render(values) {
  const stack = [];
  const lines = source.split(/\r?\n/).filter(line => {
    const directive = line.trim().match(/^#(if|endif)\b\s*(.*)$/);
    if (directive) {
      if (directive[1] === 'if') stack.push(Boolean(vm.runInNewContext(directive[2], values)));
      else { assert(stack.length, 'Unbalanced #endif'); stack.pop(); }
      return false;
    }
    return stack.every(Boolean);
  });
  assert.equal(stack.length, 0);
  return lines.join('\n').replace(/\{\{\{([\s\S]*?)\}\}\}/g, (_, expression) => String(vm.runInNewContext(expression, values)));
}

test('preserves generic Unity placeholders, relative paths and listener-before-loader order', () => {
  for (const value of ['PRODUCT_NAME', 'WIDTH', 'HEIGHT', 'LOADER_FILENAME', 'DATA_FILENAME', 'FRAMEWORK_FILENAME', 'CODE_FILENAME', 'WORKER_FILENAME', 'SYMBOLS_FILENAME', 'BACKGROUND_FILENAME', 'COMPANY_NAME', 'PRODUCT_VERSION']) assert(source.includes(value), value);
  assert(source.indexOf('window.addEventListener("keydown"') < source.indexOf('<script src="Build/'));
  assert(!/Bloomancer|8-bitty|postMessage|preventDefault|https?:/.test(source));
  const html = render(profile);
  assert(!/\{\{\{|#if|#endif|<<<|>>>/.test(html));
  assert(html.includes('src="Build/example.loader.js"'));
  for (const name of ['example.data.br', 'example.framework.js.br', 'example.wasm.br']) assert(html.includes('"Build/' + name + '"'));
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
});

test('conditional variants remain balanced without changing Unity initialization options', () => {
  for (const SHOW_DIAGNOSTICS of [false, true]) for (const USE_THREADS of [false, true]) for (const USE_WASM of [false, true]) {
    const html = render({...profile, SHOW_DIAGNOSTICS, USE_THREADS, USE_WASM, SYMBOLS_FILENAME: 'example.symbols.json'});
    assert.equal(html.includes('workerUrl:'), USE_THREADS);
    assert.equal(html.includes('codeUrl:'), USE_WASM);
    assert.equal(html.includes('unityDiagnostics.openDiagnosticsDiv'), SHOW_DIAGNOSTICS);
    assert(html.includes('symbolsUrl: "Build/example.symbols.json"'));
  }
});

test('canvas is focusable and its name is product-specific with safe HTML attribute escaping', () => {
  const html = render({...profile, PRODUCT_NAME: 'Jogo "A&B" <Teste>'});
  assert(html.includes('tabindex="0" aria-label="Jogo &quot;A&amp;B&quot; &lt;Teste&gt;"'));
  assert(!html.includes('Shift+Tab return'));
});

test('only ordinary Tab on canvas/body/root is intercepted; browser default is never canceled', () => {
  const html = render(profile);
  const listener = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const canvas = {}, body = {}, root = {}, input = {};
  const document = {activeElement: canvas, body, documentElement: root, getElementById: id => id === 'unity-canvas' ? canvas : null};
  let handler;
  vm.runInNewContext(listener, {document, window: {addEventListener(type, callback, capture) { assert.equal(type, 'keydown'); assert.equal(capture, true); handler = callback; }}});
  for (const active of [canvas, body, root, input]) for (const event of [
    {key: 'Tab'}, {key: 'Tab', shiftKey: true}, {key: 'Tab', ctrlKey: true},
    {key: 'Tab', altKey: true}, {key: 'Tab', metaKey: true}, {key: 'Tab', isComposing: true},
    ...['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', ' ', 'Enter', 'Shift'].map(key => ({key})),
  ]) {
    document.activeElement = active;
    let stopped = false;
    handler({...event, stopImmediatePropagation() { stopped = true; }, preventDefault() { assert.fail('Must preserve native browser default'); }});
    const expected = active !== input && event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.isComposing;
    assert.equal(stopped, expected, JSON.stringify(event));
  }
});

// Optional local fixture for browser QA; no build binaries are copied or changed.
if (process.env.UNITY_TEMPLATE_QA_PROFILE && process.env.UNITY_TEMPLATE_QA_HTML) {
  const values = JSON.parse(await readFile(process.env.UNITY_TEMPLATE_QA_PROFILE, 'utf8'));
  await writeFile(process.env.UNITY_TEMPLATE_QA_HTML, render({...profile, ...values}));
}
