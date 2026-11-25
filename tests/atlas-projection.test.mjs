import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createTypeScriptLoader } from './helpers/load-typescript.mjs';

const { load } = createTypeScriptLoader();
const { getAtlasView, getAtlasAdaptiveView } = load(fileURLToPath(new URL('../src/features/atlas/atlas-layout.ts', import.meta.url)));

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} differs from ${expected}`);
}

test('desktop keeps the original width fit and bottom alignment', () => {
  const view = getAtlasView(767, 867, false);
  near(view.fitScale, 767 / 1440);
  assert.equal(view.scale, view.fitScale);
  near(view.projectedWidth, 767);
  near(view.projectedHeight, 767 / 1440 * 790);
  near(view.offsetX, 0);
  near(view.offsetY + view.projectedHeight, 867);
});

test('height fit centers the desktop map horizontally', () => {
  const view = getAtlasView(1440, 390, false);
  near(view.fitScale, 390 / 790);
  near(view.projectedHeight, 390);
  near(view.offsetX + view.projectedWidth / 2, 720);
  near(view.offsetY, 0);
  near(view.overflowX, 0);
  near(view.overflowY, 0);
});

test('desktop candidate reports excess only on the necessary axes', () => {
  const horizontal = getAtlasAdaptiveView(767, 867, false, 1024);
  assert.equal(horizontal.scale, .875);
  near(horizontal.overflowX, 493);
  near(horizontal.overflowY, 0);
  const vertical = getAtlasAdaptiveView(1440, 390, false, 390);
  assert.equal(vertical.scale, .70);
  near(vertical.projectedWidth, 1008);
  near(vertical.overflowX, 0);
  near(vertical.overflowY, 163);
  const both = getAtlasAdaptiveView(767, 233, false, 390);
  near(both.overflowX, 241);
  near(both.overflowY, 320);
  const fits = getAtlasAdaptiveView(1280, 768, false, 768);
  assert.equal(fits.scale, fits.fitScale);
  near(fits.overflowX, 0);
  near(fits.overflowY, 0);
});

test('candidate uses the window height breakpoint even when the map viewport is shorter', () => {
  assert.equal(getAtlasAdaptiveView(767, 543, false, 700).scale, .70);
  assert.equal(getAtlasAdaptiveView(767, 544, false, 701).scale, .875);
  assert.equal(getAtlasAdaptiveView(767, 543.5, false, 700.5).scale, .875);
  assert.equal(getAtlasView(767, 544, false).scale, 767 / 1440);
});

test('mobile keeps the width cap and top alignment with or without the candidate floor', () => {
  for (const [width, height] of [[319.5, 1046.31], [390, 1256], [760, 1256]]) {
    const view = getAtlasView(width, height, true);
    const candidate = getAtlasAdaptiveView(width, height, true, 568);
    assert.deepEqual(candidate, view);
    near(view.projectedWidth, Math.min(width, 390));
    near(view.offsetX + view.projectedWidth / 2, width / 2);
    assert.equal(view.offsetY, 0);
  }
});

test('fractional resize preserves anchor alignment and recalculates the projection', () => {
  for (const [width, height] of [[1280.25, 768.5], [1400.5, 710.25], [767.5, 866.75]]) {
    const view = getAtlasView(width, height, false);
    near(view.offsetY + view.projectedHeight, height);
    near(view.offsetX + view.projectedWidth / 2, width / 2);
    for (const [x, y] of [[.73, .65], [.24, .32]]) {
      near(view.offsetX + x * view.projectedWidth, view.offsetX + x * view.world.width * view.scale);
      near(view.offsetY + y * view.projectedHeight, view.offsetY + y * view.world.height * view.scale);
    }
  }
});
