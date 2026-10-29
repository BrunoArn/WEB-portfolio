import { resolveAtlasTerrainSettings, type AtlasTerrainSettings, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { AtlasContour, AtlasCurve, AtlasPoint, AtlasAnchor, AtlasTerritory } from "./atlas-types";

import { getAtlasView, type AtlasBounds } from "./atlas-layout";

import { createAtlasField, createAtlasColorField } from "./atlas-field";
export { sampleAtlasField, atlasCategoryWeights } from "./atlas-field";

const defaultDensity = 15;
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
    const a: [number, number, number] = [x, y, at(x, y)];
    const b: [number, number, number] = [x + 1, y, at(x + 1, y)];
    const c: [number, number, number] = [x + 1, y + 1, at(x + 1, y + 1)];
    const d: [number, number, number] = [x, y + 1, at(x, y + 1)];
    triangle([a, b, c]); triangle([a, c, d]);
  }
  const key = (point: AtlasPoint) => point.map(value => value.toFixed(3)).join(",");
  const links = new Map<string, number[]>();
  edges.forEach((edge, i) => edge.forEach(point => {
    const id = key(point); if (!links.has(id)) links.set(id, []); links.get(id)!.push(i);
  }));
  const used = new Set<number>(), paths: AtlasPoint[][] = [];
  function trace(index: number, start: AtlasPoint) {
    const path: AtlasPoint[] = [start]; let current = start, id: number | undefined = index;
    while (id !== undefined && !used.has(id)) {
      used.add(id); const edge: [AtlasPoint, AtlasPoint] = edges[id]; const next: AtlasPoint = key(edge[0]) === key(current) ? edge[1] : edge[0];
      path.push(next); current = next; id = links.get(key(next))?.find(i => !used.has(i));
    }
    if (path.length > 10) paths.push(path);
  }
  edges.forEach((edge, i) => { if (!used.has(i)) { const end = edge.find(point => links.get(key(point))!.length === 1); if (end) trace(i, end); } });
  edges.forEach((edge, i) => { if (!used.has(i)) trace(i, edge[0]); });
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

export function buildAtlasRelief(w: number, h: number, projects: readonly AtlasAnchor[], mobile: boolean, bounds: AtlasBounds = { left: 0, top: 0, right: w, bottom: h }, settings?: AtlasTerrainControls): AtlasCurve[] {
  const stepX = w / Math.max(2, Math.round(w / 5)), stepY = h / Math.max(2, Math.round(h / 5));
  const x0 = Math.floor(bounds.left / stepX), y0 = Math.floor(bounds.top / stepY);
  const nx = Math.ceil(bounds.right / stepX) - x0, ny = Math.ceil(bounds.bottom / stepY) - y0;
  const field = createAtlasField(projects, mobile, settings);
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++) values[y * (nx + 1) + x] = field((x0 + x) * stepX / w, (y0 + y) * stepY / h);
  const result: AtlasCurve[] = [];
  for (let i = 0; i < defaultDensity; i++) for (const path of extractContours(values, nx, ny, .18 + i * (1.05 / defaultDensity), nx * stepX, ny * stepY, x0 * stepX, y0 * stepY)) {
    const contour = smoothContour(path, mobile);
    if (mobile && contour.closed) {
      const area = Math.abs(contour.path.reduce((sum, p, j, points) => { const next = points[(j + 1) % points.length]; return sum + p[0] * next[1] - next[0] * p[1]; }, 0)) / 2;
      if (area < 150 || area / (w * h) < .00023) continue;
    }
    result.push({ index: i, contour });
  }
  return result;
}

function paintRibbon(ctx: CanvasRenderingContext2D, { contour, index }: AtlasCurve, scale: number) {
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
  const outline = a.concat(b.reverse()); ctx.beginPath(); ctx.moveTo(...outline[0]);
  for (let i = 1; i < outline.length; i++) ctx.lineTo(...outline[i]); ctx.closePath(); ctx.fill();
}

/** Render a fixed world through a uniform camera; labels stay at readable CSS sizes. */
export function mountAtlasTerrain(canvas: HTMLCanvasElement, viewport: HTMLElement, intro: HTMLElement, projects: readonly AtlasAnchor[], territories: readonly AtlasTerritory[], mobileQuery: string, initialSettings: AtlasTerrainSettings) {
  const ctx = canvas.getContext("2d"); if (!ctx) return { dispose() {}, extend(_bounds?: AtlasBounds) { void _bounds; }, setSettings(_settings: AtlasTerrainSettings) { void _settings; } };
  const media = window.matchMedia(mobileQuery);
  let disposed = false, frame = 0, geometryKey = "", curves: AtlasCurve[] = [], builds = 0;
  let extension: AtlasBounds | undefined;
  let settings = resolveAtlasTerrainSettings(initialSettings);
  function draw() {
    frame = 0; if (disposed) return;
    const rectangle = viewport.getBoundingClientRect(), w = rectangle.width, h = rectangle.height; if (!w || !h) return;
    const mobile = media.matches, positioned = positionAtlasProjects(projects, mobile);
    const view = getAtlasView(w, h, mobile), { world, scale, offsetX, offsetY } = view;
    const screen = extension ?? { left: 0, top: 0, right: w, bottom: h };
    const width = screen.right - screen.left, height = screen.bottom - screen.top;
    const bounds = { left: Math.min(view.bounds.left, (screen.left - offsetX) / scale - 48 / scale), top: Math.min(view.bounds.top, (screen.top - offsetY) / scale - 48 / scale), right: Math.max(view.bounds.right, (screen.right - offsetX) / scale + 48 / scale), bottom: Math.max(view.bounds.bottom, (screen.bottom - offsetY) / scale + 48 / scale) };
    const controls = settings[mobile ? "mobile" : "desktop"];
    const key = JSON.stringify([mobile, bounds, controls]);
    if (key !== geometryKey) { curves = buildAtlasRelief(world.width, world.height, positioned, mobile, bounds, controls); geometryKey = key; builds++; }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
    // The raster itself is never squeezed to a fractional CSS aspect ratio.
    canvas.style.width = canvas.width / dpr + "px"; canvas.style.height = canvas.height / dpr + "px";
    canvas.style.left = screen.left + "px"; canvas.style.top = screen.top + "px";
    ctx!.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offsetX - screen.left), dpr * (offsetY - screen.top)); ctx!.fillStyle = "#fff";
    for (const curve of curves) { ctx!.globalAlpha = curve.index % 4 === 0 ? .77 : .42; paintRibbon(ctx!, curve, scale); }
    ctx!.globalAlpha = 1;
    const colors = document.createElement("canvas"); colors.width = Math.max(2, Math.ceil(width / 5)); colors.height = Math.max(2, Math.ceil(height / 5));
    const paint = colors.getContext("2d")!; const pixels = paint.createImageData(colors.width, colors.height);
    const palette = territories.map(territory => [1, 3, 5].map(offset => parseInt(territory.color.slice(offset, offset + 2), 16)));
    const weightsAt = createAtlasColorField(positioned, mobile, territories.map(territory => territory.id));
    const text = intro.getBoundingClientRect();
    const cx = (text.left - rectangle.left + text.width / 2 - offsetX) / scale / world.width;
    const cy = (text.top - rectangle.top + text.height / 2 - offsetY) / scale / world.height;
    const sx = (text.width / 2 + 28) / scale / world.width, sy = (text.height / 2 + 26) / scale / world.height;
    for (let y = 0; y < colors.height; y++) for (let x = 0; x < colors.width; x++) {
      const u = (screen.left + x / (colors.width - 1) * width - offsetX) / scale / world.width;
      const v = (screen.top + y / (colors.height - 1) * height - offsetY) / scale / world.height;
      const weights = weightsAt(u, v), i = (y * colors.width + x) * 4;
      for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] = Math.round(weights.reduce((sum, value, category) => sum + value * palette[category][channel], 0));
      pixels.data[i + 3] = Math.round(255 * (1 - .98 * Math.exp(-.5 * (((u - cx) / sx) ** 4 + ((v - cy) / sy) ** 4))));
    }
    paint.putImageData(pixels, 0, 0); ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.globalCompositeOperation = "source-in"; ctx!.drawImage(colors, 0, 0, width, height); ctx!.globalCompositeOperation = "source-over";
    canvas.dataset.terrainControls = JSON.stringify(controls);
    canvas.dataset.projectSources = String(projects.length); canvas.dataset.territories = String(territories.length);
    canvas.dataset.contours = String(curves.length); canvas.dataset.geometryBuilds = String(builds);
    canvas.dataset.worldWidth = String(world.width); canvas.dataset.worldHeight = String(world.height);
    canvas.dataset.worldScale = String(scale); canvas.dataset.worldOffsetX = String(offsetX); canvas.dataset.worldOffsetY = String(offsetY);
  }
  function schedule() { if (!disposed && !frame) frame = requestAnimationFrame(draw); }
  const observer = new ResizeObserver(schedule); observer.observe(viewport); observer.observe(intro);
  window.addEventListener("resize", schedule); media.addEventListener("change", schedule); document.fonts.ready.then(schedule); schedule();
  return { setSettings(value: AtlasTerrainSettings) { settings = resolveAtlasTerrainSettings(value); schedule(); }, extend(bounds?: AtlasBounds) { extension = bounds; cancelAnimationFrame(frame); draw(); }, dispose() { disposed = true; observer.disconnect(); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); cancelAnimationFrame(frame); } };
}

