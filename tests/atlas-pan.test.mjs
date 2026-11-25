import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createTypeScriptLoader } from './helpers/load-typescript.mjs';

function rectangle(left, top, width, height) {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

function fixture(relativeX, markerTop = 220) {
  const root = { dataset: { selection: 'idle' }, querySelector: () => ({
    getBoundingClientRect: () => rectangle(0, 0, 0, 0),
    setAttribute() {},
    removeAttribute() {},
  }) };
  const world = { style: { transform: 'none' } };
  const viewport = {
    style: { setProperty() {} },
    getBoundingClientRect: () => frame,
    toggleAttribute() {},
    removeAttribute() {},
    addEventListener() {},
  };
  const document = { activeElement: null, querySelectorAll: () => [], querySelector: () => null };
  const { load } = createTypeScriptLoader({
    globals: { document, window: { addEventListener() {} }, cancelAnimationFrame() {} },
  });
  const source = name => load(fileURLToPath(new URL('../src/features/atlas/' + name, import.meta.url)));
  const { getAtlasAdaptiveView } = source('atlas-layout.ts');
  let view, frame;
  const getMarkerRect = () => {
    const [x = 0, y = 0] = world.style.transform.match(/-?[0-9.]+(?=px)/g)?.map(Number) ?? [];
    return rectangle(view.offsetX + view.projectedWidth * relativeX + x, markerTop + y, 140, 60);
  };
  const marker = {
    matches: selector => selector === '[data-atlas-trigger]:focus-visible',
    getBoundingClientRect: getMarkerRect,
    parentElement: { querySelector: () => ({ getBoundingClientRect: getMarkerRect }) },
  };
  const plane = { querySelectorAll: () => [marker], contains: target => target === marker };
  const intro = { getBoundingClientRect: () => rectangle(20, 20, 160, 110) };
  const { mountAtlasPan } = source('atlas-pan.ts');
  const pan = mountAtlasPan(root, viewport, world, plane, intro);
  function resize(width, height, mobile = false) {
    frame = rectangle(0, 0, width, height);
    view = getAtlasAdaptiveView(width, height, mobile, height);
    pan.update(view, frame);
  }
  const focus = target => { document.activeElement = target; };
  resize(1440, 900);
  return { marker, document, focus, resize, world };
}

test('resize reveals a marker that retains keyboard focus without another focus event', () => {
  const atlas = fixture(.11);
  atlas.focus(atlas.marker);
  atlas.resize(1024, 768);
  assert(atlas.marker.getBoundingClientRect().left >= 0);
  assert.equal(atlas.document.activeElement, atlas.marker);
});

test('resize keeps the ordinary layout with visible marker focus or focus outside the map', () => {
  for (const [relativeX, inAtlas] of [[.55, true], [.11, false]]) {
    const baseline = fixture(relativeX);
    baseline.resize(1024, 768);
    const atlas = fixture(relativeX);
    atlas.focus(inAtlas ? atlas.marker : { matches: () => true });
    atlas.resize(1024, 768);
    assert.equal(atlas.world.style.transform, baseline.world.style.transform);
  }
});

test('resize reveals a retained marker focus when the updated layout puts it under the introduction', () => {
  const atlas = fixture(.22, 70);
  atlas.focus(atlas.marker);
  atlas.resize(1024, 768);
  assert(atlas.marker.getBoundingClientRect().left >= 180);
  assert.equal(atlas.document.activeElement, atlas.marker);
});

test('resize into mobile keeps the transform neutral and retains marker focus', () => {
  const atlas = fixture(.11);
  atlas.focus(atlas.marker);
  atlas.resize(390, 1160, true);
  assert.equal(atlas.world.style.transform, 'none');
  assert.equal(atlas.document.activeElement, atlas.marker);
});
