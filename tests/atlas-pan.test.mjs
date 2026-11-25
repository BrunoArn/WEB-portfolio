import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createTypeScriptLoader } from './helpers/load-typescript.mjs';

function rectangle(left, top, width, height) {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

function fixture(relativeX, markerTop = 220) {
  const controls = new Map(['left', 'right', 'up', 'down'].map(direction => {
    const control = {
      dataset: { panDirection: direction },
      closest: () => control,
      getBoundingClientRect: () => rectangle(0, 0, 0, 0),
      setAttribute() {},
      removeAttribute() {},
    };
    return [`[data-pan-direction="${direction}"]`, control];
  }));
  const root = { dataset: { selection: 'idle' }, querySelector: selector =>
    selector === '[data-pan-description]' ? { id: 'pan-description' } : controls.get(selector) };
  const world = { style: { transform: 'none' } };
  const attributes = new Map(), handlers = new Map(), frames = new Map();
  let frameId = 0;
  const viewport = {
    style: { setProperty() {} },
    getBoundingClientRect: () => frame,
    toggleAttribute: (name, enabled) => enabled ? attributes.set(name, '') : attributes.delete(name),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
    hasAttribute: name => attributes.has(name),
    addEventListener: (name, handler) => handlers.set(name, handler),
    setPointerCapture() {},
    hasPointerCapture: () => false,
  };
  const document = { activeElement: null, querySelectorAll: () => [], querySelector: () => null };
  const { load } = createTypeScriptLoader({
    globals: { document, window: { addEventListener() {} },
      requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
      cancelAnimationFrame: id => frames.delete(id),
    },
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
  function dispatch(type, fields = {}) {
    handlers.get(type)({ type, target: viewport, cancelable: true, preventDefault() {}, ...fields });
    for (const [id, run] of frames) { frames.delete(id); run(); }
  }
  function drag(pointerType, dx) {
    const pointer = { pointerType, pointerId: 1, isPrimary: true, button: 0,
      target: { closest: () => null }, clientX: 200, clientY: 200 };
    dispatch('pointerdown', pointer);
    dispatch('pointermove', { ...pointer, clientX: 200 + dx });
    dispatch('pointerup', { ...pointer, clientX: 200 + dx });
  }
  return { marker, document, focus, resize, world, attributes, pan, dispatch, drag,
    clickArrow: () => dispatch('click', { target: controls.get('[data-pan-direction="left"]') }) };
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

test('the drag hint survives automatic camera movement and ineffective input', () => {
  const atlas = fixture(.11);
  atlas.resize(1024, 768);
  assert.equal(atlas.attributes.get('aria-describedby'), 'pan-description');
  atlas.dispatch('wheel', { deltaX: 100, deltaY: 0, deltaMode: 0 });
  atlas.drag('mouse', 4);
  atlas.drag('mouse', -100);
  assert(!atlas.attributes.has('data-pan-learned'));
  const beforeFocus = atlas.world.style.transform;
  atlas.dispatch('focusin', { target: atlas.marker });
  assert.notEqual(atlas.world.style.transform, beforeFocus);
  const saved = atlas.pan.pause();
  atlas.pan.resume(saved);
  atlas.resize(761, 390);
  assert(!atlas.attributes.has('data-pan-learned'));
});

test('only effective visitor pan dismisses the hint for the lifetime of the viewport', () => {
  for (const move of [
    atlas => atlas.drag('mouse', 75),
    atlas => atlas.drag('touch', 75),
    atlas => atlas.dispatch('wheel', { deltaX: -75, deltaY: 0, deltaMode: 0 }),
    atlas => atlas.dispatch('keydown', { key: 'ArrowLeft' }),
    atlas => atlas.clickArrow(),
  ]) {
    const atlas = fixture(.55);
    atlas.resize(1024, 768);
    assert(!atlas.attributes.has('data-pan-learned'));
    const initial = atlas.world.style.transform;
    move(atlas);
    assert.notEqual(atlas.world.style.transform, initial);
    assert(atlas.attributes.has('data-pan-learned'));
    atlas.pan.resume(atlas.pan.pause());
    atlas.resize(390, 1160, true);
    assert(!atlas.attributes.has('aria-describedby'));
    atlas.resize(1024, 768);
    assert(atlas.attributes.has('data-pan-learned'));
    assert.equal(atlas.attributes.get('aria-describedby'), 'pan-description');
  }
});
