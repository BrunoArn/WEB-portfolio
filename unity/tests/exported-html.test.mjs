import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const template = await readFile(new URL('../WebGLTemplates/PortfolioResponsive/index.html', import.meta.url), 'utf8');
const listenerBlock = html => [...html.matchAll(/  <script>\n([\s\S]*?)  <\/script>\n/g)]
  .find(match => match[1].includes('function allowNativeTab'));
const code = script => script.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
const standard = listenerBlock(template.replace(/\r\n/g, '\n'));
assert(standard, 'Shared template must define the approved inline listener');

const exports = [
  {file: 'bloomancer.html', height: 600, build: '8-bitty', hash: 'd1bebd41889fa5e1b5cbb96cb8b63f884a4018834d26f22111560117b20d1f1e'},
  {file: 'hungry-worm.html', height: 640, build: 'Hungry-Worm', hash: '7db9efff22b44f71533d98ff66f948a0756a39dc1717dcb496f072495c0579d2'},
  {file: '2d-rpg.html', height: 600, build: '2D-RPG', hash: 'fa74a74d4d35582fc56ee9200807f1586578ab4055f6755c7720383d088d823a'},
];

for (const candidate of exports) test(`${candidate.file}: standard listener and only the approved export diff`, async () => {
  const html = (await readFile(new URL('../../poc/webgl-keyboard-html/' + candidate.file, import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
  const block = listenerBlock(html);
  assert(block, 'Candidate must define the approved listener');
  assert.equal(code(block[1]), code(standard[1]));
  assert.equal((html.match(/function allowNativeTab/g) || []).length, 1);
  assert(block.index < html.indexOf(`<script src="Build/${candidate.build}.loader.js">`));
  assert(html.includes(`width=960 height=${candidate.height} tabindex="0" aria-label="`));
  for (const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);

  // Verify the complete remaining export against its inspected baseline without requiring binaries.
  const restored = html.replace(block[0], '').replace(/tabindex="0" aria-label="[^"]*"/, 'tabindex="-1"');
  assert.equal(createHash('sha256').update(restored).digest('hex'), candidate.hash,
    'CSS, dimensions, initialization or resource paths changed beyond the approved diff');
});
