import type { AtlasAnchor } from "./atlas-types";

function gaussian(x: number, y: number, cx: number, cy: number, sx: number, sy: number, angle = 0) {
  const dx = x - cx, dy = y - cy;
  const u = dx * Math.cos(angle) + dy * Math.sin(angle);
  const v = -dx * Math.sin(angle) + dy * Math.cos(angle);
  return Math.exp(-.5 * ((u / sx) ** 2 + (v / sy) ** 2));
}

/** All elevations and connecting shoulders originate in current projects. */
export function createAtlasField(projects: readonly AtlasAnchor[], mobile: boolean) {
  const ordered = [...projects].sort((a, b) => a.id.localeCompare(b.id));
  const counts = new Map<string, number>();
  for (const p of ordered) counts.set(p.c, (counts.get(p.c) ?? 0) + 1);
  const kernels = ordered.map(p => {
    const solo = counts.get(p.c) === 1;
    return { x: p.x, y: p.y, sx: mobile ? (solo ? .205 : .122) : (solo ? .13 : .14), sy: mobile ? (solo ? .089 : .069) : .115, angle: mobile ? (solo ? -.18 : .20) : (solo ? -.6 : .4), amplitude: .8 * p.influence };
  });
  // Deterministic minimum spanning forest: prefer same-territory neighbors and
  // keep distant formations separate. These bridges disappear with their sources.
  const edges: { a: number; b: number; score: number }[] = [];
  for (let a = 0; a < ordered.length; a++) for (let b = a + 1; b < ordered.length; b++) {
    const dx = ordered[b].x - ordered[a].x, dy = ordered[b].y - ordered[a].y;
    const distance = Math.hypot(dx, dy * (mobile ? 1.3 : 1));
    if (distance <= .65) edges.push({ a, b, score: distance * (ordered[a].c === ordered[b].c ? .55 : 1) });
  }
  edges.sort((a, b) => a.score - b.score || a.a - b.a || a.b - b.b);
  const roots = ordered.map((_, i) => i);
  function root(i: number): number { while (roots[i] !== i) i = roots[i]; return i; }
  for (const edge of edges) {
    const ar = root(edge.a), br = root(edge.b); if (ar === br) continue;
    roots[br] = ar;
    const a = ordered[edge.a], b = ordered[edge.b], dx = b.x - a.x, dy = b.y - a.y;
    kernels.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, sx: Math.max(.08, Math.hypot(dx, dy) * .55), sy: mobile ? .045 : .065, angle: Math.atan2(dy, dx), amplitude: (mobile ? .24 : .26) * Math.min(a.influence, b.influence) });
  }
  return (x: number, y: number) => {
    const u = x + (mobile ? .018 : .028) * Math.sin(y * 12 + x * 3) + (mobile ? .009 : .016) * Math.cos(y * 23 - x * 7);
    const v = y + (mobile ? .012 : .025) * Math.sin(x * 13 - y * 5);
    let z = 0;
    for (const k of kernels) z += k.amplitude * gaussian(u, v, k.x, k.y, k.sx, k.sy, k.angle);
    return z;
  };
}

export function sampleAtlasField(x: number, y: number, projects: readonly AtlasAnchor[], mobile: boolean) {
  return createAtlasField(projects, mobile)(x, y);
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
