import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createTypeScriptLoader } from './helpers/load-typescript.mjs';

const { load } = createTypeScriptLoader();
const source = file => load(fileURLToPath(new URL('../src/features/atlas/' + file, import.meta.url)));
const { getAtlasAdaptiveView } = source('atlas-layout.ts');
const { atlasPanDomain, atlasPanLimits, clampAtlasPan, atlasSelectionPosition, atlasSelectionDomain, atlasCameraTransform, revealAtlasMarker } = source('atlas-camera.ts');
const frame = { left: 0, top: 0, right: 1024, bottom: 768 };
const safe = { left: 12, top: 73, right: 1012, bottom: 700 };
const content = { left: 50, top: 200, right: 1100, bottom: 655 };

test('horizontal runway includes marker overflow and holds the vertical position', () => {
  const limits = atlasPanLimits(getAtlasAdaptiveView(1024, 768, false, 768), frame, safe, content);
  assert.deepEqual(limits, { minX: -118, maxX: 118, minY: 0, maxY: 0 });
  assert.deepEqual(clampAtlasPan({ x: -900, y: 150 }, limits), { x: -118, y: 0 });
  assert.deepEqual(atlasPanDomain(1024, 768, limits), { left: -118, top: 0, right: 1142, bottom: 768 });
});

test('extends the pan surface to reveal content at an edge while respecting shell clearance', () => {
  const small = { left: 0, top: 0, right: 761, bottom: 233 };
  const view = getAtlasAdaptiveView(761, 233, false, 390);
  const safeArea = { left: 12, top: 12, right: 749, bottom: 221 };
  const items = { left: 0, top: 60, right: 920, bottom: 569 };
  const limits = atlasPanLimits(view, small, safeArea, items);
  assert.equal(limits.minY, -348);
  assert.equal(clampAtlasPan({ x: 0, y: -999 }, limits).y + items.bottom, safeArea.bottom);
  assert(atlasPanDomain(761, 233, limits).bottom >= items.bottom);
});

test('ample desktops and mobile have neutral limits', () => {
  for (const [width, height, mobile] of [[1440, 900, false], [390, 1256, true]]) {
    assert.deepEqual(atlasPanLimits(getAtlasAdaptiveView(width, height, mobile, height), frame, safe, content),
      { minX: 0, maxX: 0, minY: 0, maxY: 0 });
  }
});

test('preview positions the same anchor after non-zero pan and restores the saved translation', () => {
  const saved = { x: -113, y: -64 };
  const localMarker = { x: 480, y: 215 }, target = { x: 700, y: 110 }, zoom = 1.85;
  const translatedMarker = { x: localMarker.x + saved.x, y: localMarker.y + saved.y };
  const preview = atlasSelectionPosition(translatedMarker, target, saved, zoom);
  assert.deepEqual({ x: preview.x + zoom * localMarker.x, y: preview.y + zoom * localMarker.y }, target);
  const domain = atlasSelectionDomain(1024, 400, saved, preview, zoom);
  assert(domain.left <= -saved.x && domain.right >= 1024 - saved.x);
  assert(domain.top <= -preview.y / zoom && domain.bottom >= (400 - preview.y) / zoom);
  assert.equal(atlasCameraTransform(saved), 'translate(-113px,-64px) scale(1)');
});

test('keyboard focus reveals an offscreen marker and avoids the fixed heading when possible', () => {
  const limits = { minX: -420, maxX: 260, minY: -100, maxY: 100 };
  const obstacle = { left: 0, top: 73, right: 180, bottom: 220 };
  const marker = { left: -30, top: 130, right: 70, bottom: 180 };
  const next = revealAtlasMarker({ x: 0, y: 0 }, marker, marker, safe, [obstacle], limits);
  assert(next.x + marker.left >= safe.left);
  assert(next.x + marker.left >= obstacle.right || next.y + marker.top >= obstacle.bottom || next.y + marker.bottom <= obstacle.top);
});
