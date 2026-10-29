import { resolveAtlasRegions, type AtlasCompositionRegion } from "../../../shared/atlas-composition-regions";
import { resolveAtlasTerrainControls, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { AtlasAnchor } from "./atlas-types";

function gaussian(x: number, y: number, cx: number, cy: number, sx: number, sy: number, angle = 0) {
  const dx = x - cx, dy = y - cy;
  const u = dx * Math.cos(angle) + dy * Math.sin(angle);
  const v = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.exp(-.5 * ((u / sx) ** 2 + (v / sy) ** 2));
}

/** Project elevations plus editable, independent composition regions. */
export function createAtlasField(projects: readonly AtlasAnchor[], mobile: boolean, settings?: Partial<AtlasTerrainControls>, regions?: readonly AtlasCompositionRegion[]) {
  const controls = resolveAtlasTerrainControls(settings);
  const footprint = .7 + controls.amplitude * .006;
  const stretch = Math.exp((controls.elongation - 50) * .012);
  const direction = controls.direction * Math.PI / 180;
  const connection = controls.connection / 50;
  const clearing = controls.negativeSpace / 50;
  const ordered = [...projects].sort((a, b) => a.id.localeCompare(b.id));
  const counts = new Map<string, number>();
  for (const p of ordered) counts.set(p.c, (counts.get(p.c) ?? 0) + 1);
  const kernels = ordered.map(p => {
    const solo = counts.get(p.c) === 1;
    // The tall mobile world needs wide, shallow sources to read as lateral arcs.
    // Small normalized rotations avoid turning those arcs into vertical columns.
    const kernel = { x: p.x, y: p.y, sx: mobile ? (solo ? .43 : .36) : (solo ? .13 : .14), sy: mobile ? (solo ? .047 : .043) : .115, angle: mobile ? (solo ? -.025 : .035) : (solo ? -.6 : .4), amplitude: .8 * p.influence };
    return { ...kernel, sx: kernel.sx * footprint * stretch, sy: kernel.sy * footprint / stretch, angle: kernel.angle + direction };
  });
  // Additive art direction: auxiliaries are independent, explicit sources.
  for (const region of resolveAtlasRegions(regions)) {
    const profile = mobile ? region.mobile : region.desktop;
    if (!profile.enabled) continue;
    const strength = profile.intensity * (region.kind === "valley" ? -clearing : connection);
    kernels.push({x: profile.x / 100, y: profile.y / 100, sx: profile.width / 100 * footprint * stretch, sy: profile.height / 100 * footprint / stretch, angle: profile.rotation * Math.PI / 180 + direction, amplitude: strength});
  }
  return (x: number, y: number) => {
    const u = x + (mobile ? .018 : .028) * Math.sin(y * 12 + x * 3) + (mobile ? .009 : .016) * Math.cos(y * 23 - x * 7);
    const v = y + (mobile ? .012 : .025) * Math.sin(x * 13 - y * 5);
    let z = 0;
    for (const k of kernels) z += k.amplitude * gaussian(u, v, k.x, k.y, k.sx, k.sy, k.angle);
    return z;
  };
}

export function sampleAtlasField(x: number, y: number, projects: readonly AtlasAnchor[], mobile: boolean, settings?: Partial<AtlasTerrainControls>, regions?: readonly AtlasCompositionRegion[]) {
  return createAtlasField(projects, mobile, settings, regions)(x, y);
}

export function createAtlasColorField(projects: readonly AtlasAnchor[], mobile: boolean, categoryIds: readonly string[]) {
  const indices = new Map(categoryIds.map((id, i) => [id, i]));
  const sources = projects.map(p => ({ ...p, index: indices.get(p.c) })).filter(p => p.index !== undefined);
  return (x: number, y: number) => {
    const weights = Array<number>(categoryIds.length).fill(0);
    for (const p of sources) weights[p.index!] += p.influence * gaussian(x, y, p.x, p.y, mobile ? .25 : .22, mobile ? .13 : .22);
    const powered = weights.map(value => value ** 5);
    const sum = powered.reduce((a, b) => a + b, 0) || 1;
    return powered.map(value => value / sum);
  };
}

export function atlasCategoryWeights(x: number, y: number, projects: readonly AtlasAnchor[], mobile: boolean, categoryIds: readonly string[]) {
  return createAtlasColorField(projects, mobile, categoryIds)(x, y);
}
