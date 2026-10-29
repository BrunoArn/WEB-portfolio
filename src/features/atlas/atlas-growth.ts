import type { AtlasString } from "./atlas-string-response";

export const atlasEntranceDuration = 2200;
export const atlasGrowthBand = 14;
type View = { scale: number; x: number; y: number; width: number; height: number };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** Spatial order chooses the source; actual growth follows each contour's arc. */
export function createAtlasGrowth(line: AtlasString, view: View) {
  let seed = 0, first = Infinity, last = -Infinity;
  line.path.forEach(([x, y], i) => {
    const u = (x * view.scale + view.x) / view.width, v = (y * view.scale + view.y) / view.height;
    const order = u * .86 + v * .14 + Math.sin(v * 6) * .035;
    if (order < first) { first = order; seed = i; }
    last = Math.max(last, order);
  });
  const arc = line.arcs[seed];
  return {
    line, arc, band: atlasGrowthBand / view.scale,
    forward: line.closed ? line.length / 2 : line.length - arc,
    backward: line.closed ? line.length / 2 : arc,
    delay: clamp(first) * .32,
    duration: .52 + .1 * clamp(last - first),
    amplitude: 7 / view.scale,
  };
}
export type AtlasGrowth = ReturnType<typeof createAtlasGrowth>;

export function atlasGrowthAt(plan: AtlasGrowth, progress: number) {
  const local = clamp((progress - plan.delay) / plan.duration), growth = smooth(local);
  const finish = plan.band * smooth((growth - .85) / .15);
  return {
    forward: plan.forward * growth + finish,
    backward: plan.backward * growth + finish,
    curl: local <= 0 || local >= 1 ? 0 : plan.amplitude * Math.sin(Math.PI * local) ** 2,
  };
}

/** Sample the existing smooth path; only two moving tips are needed per contour. */
export function atlasGrowthTip(line: AtlasString, arc: number, result: Float32Array, offset: number) {
  const target = line.closed ? ((arc % line.length) + line.length) % line.length : Math.max(0, Math.min(line.length, arc));
  let low = 0, high = line.arcs.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (line.arcs[mid] <= target) low = mid; else high = mid - 1;
  }
  const next = low + 1 < line.path.length ? low + 1 : line.closed ? 0 : low;
  const end = next ? line.arcs[next] : line.length;
  const t = clamp((target - line.arcs[low]) / Math.max(1e-8, end - line.arcs[low]));
  const a = line.path[low], b = line.path[next];
  const nx = line.normals[low * 2] * (1 - t) + line.normals[next * 2] * t;
  const ny = line.normals[low * 2 + 1] * (1 - t) + line.normals[next * 2 + 1] * t;
  const length = Math.hypot(nx, ny) || 1;
  result[offset] = a[0] * (1 - t) + b[0] * t;
  result[offset + 1] = a[1] * (1 - t) + b[1] * t;
  result[offset + 2] = nx / length; result[offset + 3] = ny / length;
}

export function atlasGrowthArrival(plan: AtlasGrowth, arc: number) {
  let distance = arc - plan.arc;
  if (plan.line.closed) {
    if (distance > plan.line.length / 2) distance -= plan.line.length;
    if (distance < -plan.line.length / 2) distance += plan.line.length;
  }
  let low = 0, high = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2, state = atlasGrowthAt(plan, mid);
    const reach = distance >= 0 ? state.forward : state.backward;
    if (reach < Math.abs(distance) + plan.band * .4) low = mid; else high = mid;
  }
  return high;
}
