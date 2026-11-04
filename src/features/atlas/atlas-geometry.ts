import { createAtlasField } from "./atlas-field";
import type { AtlasCompositionRegion } from "../../../shared/atlas-composition-regions";
import type { AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { AtlasAnchor, AtlasContour, AtlasCurve, AtlasPoint } from "./atlas-types";
import type { AtlasBounds } from "./atlas-layout";

// Shared by server backgrounds and browser scenes. No DOM or renderer imports.
const defaultDensity = 15;
export const atlasFirstContourLevel = .18;
const defaultThickness = 1.1;

export function positionAtlasProjects<T extends AtlasAnchor>(projects: readonly T[], mobile: boolean): T[] {
  return projects.map(project => ({ ...project, x: mobile ? project.mx : project.x, y: mobile ? project.my : project.y }));
}

function extractContours(values: Float32Array, nx: number, ny: number, level: number, w: number, h: number, originX = 0, originY = 0): AtlasPoint[][] {
  const edges: [AtlasPoint, AtlasPoint][] = [];
  const at = (x: number, y: number) => values[y * (nx + 1) + x];
  function triangle(points: [number, number, number][]) {
    const hits: AtlasPoint[] = [];
    for (let i = 0; i < 3; i++) {
      const a = points[i], b = points[(i + 1) % 3];
      if ((a[2] > level) !== (b[2] > level)) {
        const t = (level - a[2]) / (b[2] - a[2]);
        hits.push([originX + (a[0] + t * (b[0] - a[0])) * w / nx, originY + (a[1] + t * (b[1] - a[1])) * h / ny]);
      }
    }
    if (hits.length === 2) edges.push([hits[0], hits[1]]);
  }
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const av = at(x, y), bv = at(x + 1, y), cv = at(x + 1, y + 1), dv = at(x, y + 1);
    const above = av > level;
    // Neither triangle can cross this level if all four corners share a side.
    // Keep mixed cells in the original order and use the same interpolation.
    if (above === (bv > level) && above === (cv > level) && above === (dv > level)) continue;
    const a: [number, number, number] = [x, y, av];
    const b: [number, number, number] = [x + 1, y, bv];
    const c: [number, number, number] = [x + 1, y + 1, cv];
    const d: [number, number, number] = [x, y + 1, dv];
    triangle([a, b, c]); triangle([a, c, d]);
  }
  const key = (point: AtlasPoint) => point.map(value => value.toFixed(3)).join(",");
  // Preserve the approved rounded connections and traversal order; stringify once.
  const edgeKeys = edges.map(edge => [key(edge[0]), key(edge[1])]);
  const links = new Map<string, number[]>();
  edgeKeys.forEach((pair, i) => pair.forEach(id => {
    if (!links.has(id)) links.set(id, []); links.get(id)!.push(i);
  }));
  const used = new Uint8Array(edges.length), paths: AtlasPoint[][] = [];
  function trace(index: number, start: AtlasPoint, startKey: string) {
    const path: AtlasPoint[] = [start]; let currentKey = startKey, id: number | undefined = index;
    while (id !== undefined && !used[id]) {
      used[id] = 1; const edge = edges[id], pair = edgeKeys[id], side = pair[0] === currentKey ? 1 : 0;
      path.push(edge[side]); currentKey = pair[side]; id = links.get(currentKey)?.find(i => !used[i]);
    }
    if (path.length > 10) paths.push(path);
  }
  edges.forEach((edge, i) => { if (!used[i]) { const end = edgeKeys[i].findIndex(id => links.get(id)!.length === 1); if (end >= 0) trace(i, edge[end], edgeKeys[i][end]); } });
  edges.forEach((edge, i) => { if (!used[i]) trace(i, edge[0], edgeKeys[i][0]); });
  return paths;
}

function smoothContour(input: AtlasPoint[], mobile: boolean): AtlasContour {
  let path = input;
  const closed = Math.hypot(path[0][0] - path.at(-1)![0], path[0][1] - path.at(-1)![1]) < .1;
  if (closed) path = path.slice(0, -1);
  if (mobile) {
    const source = closed ? path.concat([path[0]]) : path;
    const resampled: AtlasPoint[] = [source[0]]; let remaining = 3;
    for (let i = 1; i < source.length; i++) {
      let start = source[i - 1]; const end = source[i]; let length = Math.hypot(end[0] - start[0], end[1] - start[1]);
      while (length >= remaining) {
        const t = remaining / length; start = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
        resampled.push(start); length -= remaining; remaining = 3;
      }
      remaining -= length;
    }
    if (!closed) resampled.push(source.at(-1)!);
    path = resampled;
    for (let pass = 0; pass < 5; pass++) path = path.map((p, i, points): AtlasPoint => {
      if (!closed && (i === 0 || i === points.length - 1)) return p;
      const a = points[(i - 1 + points.length) % points.length], b = points[(i + 1) % points.length];
      const ux = p[0] - a[0], uy = p[1] - a[1], vx = b[0] - p[0], vy = b[1] - p[1];
      const cosine = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
      return cosine < .96 ? [p[0] * .5 + (a[0] + b[0]) * .25, p[1] * .5 + (a[1] + b[1]) * .25] : p;
    });
  }
  for (let pass = 0; pass < 2; pass++) {
    const smooth: AtlasPoint[] = []; if (!closed) smooth.push(path[0]);
    for (let i = 0; i < (closed ? path.length : path.length - 1); i++) {
      const a = path[i], b = path[(i + 1) % path.length];
      smooth.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
    }
    if (!closed) smooth.push(path.at(-1)!); path = smooth;
  }
  return { path, closed };
}

function atlasFieldGrid(w: number, h: number, bounds: AtlasBounds) {
  const stepX = w / Math.max(2, Math.round(w / 5)), stepY = h / Math.max(2, Math.round(h / 5));
  const x0 = Math.floor(bounds.left / stepX), y0 = Math.floor(bounds.top / stepY);
  const nx = Math.ceil(bounds.right / stepX) - x0, ny = Math.ceil(bounds.bottom / stepY) - y0;
  return { stepX, stepY, x0, y0, nx, ny };
}

export function atlasGeometryConfigKey(w: number, h: number, projects: readonly AtlasAnchor[], mobile: boolean, settings?: AtlasTerrainControls, regions?: readonly AtlasCompositionRegion[]) {
  return JSON.stringify([w, h, mobile, projects.map(p => [p.id, p.c, p.x, p.y, p.influence]), settings, regions]);
}

/** A single sampled field, owned by one mounted scene rather than a global cache. */
export type AtlasReliefCache = {
  grid?: { key: string; x0: number; y0: number; nx: number; ny: number; values: Float32Array };
};

export function buildAtlasRelief(w: number, h: number, projects: readonly AtlasAnchor[], mobile: boolean, bounds: AtlasBounds = { left: 0, top: 0, right: w, bottom: h }, settings?: AtlasTerrainControls, regions?: readonly AtlasCompositionRegion[], cache?: AtlasReliefCache): AtlasCurve[] {
  const { stepX, stepY, x0, y0, nx, ny } = atlasFieldGrid(w, h, bounds);
  const field = createAtlasField(projects, mobile, settings, regions);
  const values = new Float32Array((nx + 1) * (ny + 1));
  const fieldKey = cache ? atlasGeometryConfigKey(w, h, projects, mobile, settings, regions) : "";
  const prior = cache?.grid?.key === fieldKey ? cache.grid : undefined;
  const priorX = x0 - (prior?.x0 ?? 0), priorY = y0 - (prior?.y0 ?? 0);
  for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++) {
    const px = x + priorX, py = y + priorY;
    values[y * (nx + 1) + x] = prior && px >= 0 && px <= prior.nx && py >= 0 && py <= prior.ny
      ? prior.values[py * (prior.nx + 1) + px] : field((x0 + x) * stepX / w, (y0 + y) * stepY / h);
  }
  if (cache) cache.grid = { key: fieldKey, x0, y0, nx, ny, values };
  const result: AtlasCurve[] = [];
  for (let i = 0; i < defaultDensity; i++) for (const path of extractContours(values, nx, ny, atlasFirstContourLevel + i * (1.05 / defaultDensity), nx * stepX, ny * stepY, x0 * stepX, y0 * stepY)) {
    const contour = smoothContour(path, mobile);
    if (mobile && contour.closed) {
      const area = Math.abs(contour.path.reduce((sum, p, j, points) => { const next = points[(j + 1) % points.length]; return sum + p[0] * next[1] - next[0] * p[1]; }, 0)) / 2;
      if (area < 150 || area / (w * h) < .00023) continue;
    }
    result.push({ index: i, contour });
  }
  return result;
}

export function ribbonOutline({ contour, index }: AtlasCurve, scale: number): AtlasPoint[] {
  const { path, closed } = contour, a: AtlasPoint[] = [], b: AtlasPoint[] = [];
  path.forEach((p, i) => {
    const prev = path[closed ? (i - 1 + path.length) % path.length : Math.max(0, i - 1)];
    const next = path[closed ? (i + 1) % path.length : Math.min(path.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], length = Math.hypot(dx, dy) || 1;
    const swell = (.5 + .5 * Math.sin(p[0] * .007 + p[1] * .011 + index * .67)) ** 2;
    const half = (.85 / Math.min(1, scale) + defaultThickness * (index % 4 === 0 ? 1.8 : .65) * (.35 + swell)) / 2;
    a.push([p[0] - dy / length * half, p[1] + dx / length * half]);
    b.push([p[0] + dy / length * half, p[1] - dx / length * half]);
  });
  return a.concat(b.reverse());
}

export function containsAtlasBounds(outer: AtlasBounds, inner: AtlasBounds) {
  return outer.left <= inner.left && outer.top <= inner.top && outer.right >= inner.right && outer.bottom >= inner.bottom;
}

/** Prove the added marching-triangle cells are below every contour level.
 * Include the shared boundary so an existing strand cannot be cut short.
 * False means the normal generator must decide; it does not assert visibility.
 */
export function atlasExtensionHasNoContours(w: number, h: number, projects: readonly AtlasAnchor[], mobile: boolean, before: AtlasBounds, after: AtlasBounds, settings?: AtlasTerrainControls, regions?: readonly AtlasCompositionRegion[], cache?: AtlasReliefCache) {
  if (!(Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) ||
      !Object.values(before).every(Number.isFinite) || !Object.values(after).every(Number.isFinite) ||
      before.right <= before.left || before.bottom <= before.top || !containsAtlasBounds(after, before)) return false;
  const old = atlasFieldGrid(w, h, before), next = atlasFieldGrid(w, h, after);
  if (!(Number.isFinite(next.stepX) && next.stepX > 0 && Number.isFinite(next.stepY) && next.stepY > 0) ||
      ![old.x0, old.y0, old.nx, old.ny, next.x0, next.y0, next.nx, next.ny].every(Number.isSafeInteger)) return false;
  const left = old.x0, right = left + old.nx, top = old.y0, bottom = top + old.ny;
  const nl = next.x0, nr = nl + next.nx, nt = next.y0, nb = nt + next.ny;
  const strips: [number, number, number, number][] = [];
  if (nt < top) strips.push([nl, nt, nr, top]);
  if (nb > bottom) strips.push([nl, bottom, nr, nb]);
  if (nl < left) strips.push([nl, top, left, bottom]);
  if (nr > right) strips.push([right, top, nr, bottom]);
  if (!strips.length) return true;
  // Bound the speculative check; a very large extension uses the normal path.
  if (strips.reduce((sum, [l, t, r, b]) => sum + (r - l + 1) * (b - t + 1), 0) > 50_000) return false;
  const prior = cache?.grid?.key === atlasGeometryConfigKey(w, h, projects, mobile, settings, regions) ? cache.grid : undefined;
  const field = createAtlasField(projects, mobile, settings, regions);
  for (const [l, t, r, b] of strips) for (let y = t; y <= b; y++) for (let x = l; x <= r; x++) {
    const px = x - (prior?.x0 ?? 0), py = y - (prior?.y0 ?? 0);
    const value = prior && px >= 0 && px <= prior.nx && py >= 0 && py <= prior.ny
      ? prior.values[py * (prior.nx + 1) + px] : Math.fround(field(x * next.stepX / w, y * next.stepY / h));
    if (!Number.isFinite(value) || value > atlasFirstContourLevel) return false;
  }
  return true;
}

