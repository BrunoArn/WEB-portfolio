import type { AtlasContour } from "./atlas-types";

const cachedLimits = new WeakMap<AtlasContour, { scale: number; limits: Float32Array }>();

/** Precomputed room for normal displacement, without changing the resting contour. */
export function atlasBendLimits(contour: AtlasContour, arcs: Float64Array, normals: Float32Array, scale: number) {
  const cached = cachedLimits.get(contour);
  if (cached?.scale === scale) return cached.limits;
  const limits = new Float32Array(contour.path.length);
  // Open strands retain the approved response; tight closed loops need protection.
  if (!contour.closed) {
    limits.fill(1e6 / scale); cachedLimits.set(contour, { scale, limits }); return limits;
  }
  const spacing = Math.min(2, 4 / scale), maxBend = 32 / scale, margin = .35;
  const radius = maxBend / margin, search = radius * 2, cellSize = 64 / scale;
  const samples: number[] = [], grid = new Map<string, number[]>();
  let last = -Infinity;
  for (let i = 0; i < arcs.length; i++) if (arcs[i] - last >= spacing) {
    samples.push(i); last = arcs[i];
    const [x, y] = contour.path[i], key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
    const bucket = grid.get(key) ?? []; bucket.push(i); grid.set(key, bucket);
  }
  const rooms = samples.map(index => {
    const [x, y] = contour.path[index], nx = normals[index * 2], ny = normals[index * 2 + 1];
    let room = radius;
    // A tangent circle meeting another part of the same contour estimates local
    // curvature and the clearance to the opposite side of a thin loop.
    for (let gy = Math.floor((y - search) / cellSize); gy <= Math.floor((y + search) / cellSize); gy++) {
      for (let gx = Math.floor((x - search) / cellSize); gx <= Math.floor((x + search) / cellSize); gx++) {
        for (const other of grid.get(`${gx},${gy}`) ?? []) {
          if (other === index) continue;
          const q = contour.path[other], dx = q[0] - x, dy = q[1] - y;
          const distance2 = dx * dx + dy * dy, projection = Math.abs(dx * nx + dy * ny);
          if (projection > 1e-8 && distance2 > 1e-8 && distance2 < search * search) {
            room = Math.min(room, distance2 / (2 * projection));
          }
        }
      }
    }
    return Math.max(.0001, room * margin);
  });
  // Spread tight spots into their neighbors conservatively, then interpolate by
  // arc length. The allowance stays continuous at the seam of a closed contour.
  const safe = rooms.map((value, i) => Math.min(value, rooms[(i + rooms.length - 1) % rooms.length], rooms[(i + 1) % rooms.length]));
  const first = contour.path[0], end = contour.path.at(-1)!;
  const length = arcs.at(-1)! + Math.hypot(first[0] - end[0], first[1] - end[1]);
  // A tight point should gradually stiffen its surroundings, not create a hinge.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < safe.length; i++) {
      const before = (i + safe.length - 1) % safe.length;
      const distance = i ? arcs[samples[i]] - arcs[samples[before]] : length - arcs[samples[before]];
      safe[i] = Math.min(safe[i], safe[before] + distance * .15);
    }
    for (let i = safe.length - 1; i >= 0; i--) {
      const after = (i + 1) % safe.length;
      const distance = after ? arcs[samples[after]] - arcs[samples[i]] : length - arcs[samples[i]];
      safe[i] = Math.min(safe[i], safe[after] + distance * .15);
    }
  }
  let sample = 0;
  for (let i = 0; i < arcs.length; i++) {
    while (sample + 1 < samples.length && arcs[samples[sample + 1]] <= arcs[i]) sample++;
    const next = (sample + 1) % samples.length, start = arcs[samples[sample]];
    const finish = next ? arcs[samples[next]] : length;
    const t = Math.min(1, (arcs[i] - start) / Math.max(1e-8, finish - start));
    const blend = t * t * (3 - 2 * t);
    limits[i] = safe[sample] * (1 - blend) + safe[next] * blend;
  }
  cachedLimits.set(contour, { scale, limits });
  return limits;
}
