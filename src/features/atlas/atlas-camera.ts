import type { AtlasBounds, getAtlasAdaptiveView } from "./atlas-layout";

export type AtlasPoint2D = { x: number; y: number };
export type AtlasPanDirection = "left" | "right" | "up" | "down";
export type AtlasPanLimits = { minX: number; maxX: number; minY: number; maxY: number };
type AtlasView = ReturnType<typeof getAtlasAdaptiveView>;
export const atlasPanDirections = ["left", "right", "up", "down"] as const;
export const neutralAtlasPan = { x: 0, y: 0 };

export function atlasPanLimits(view: AtlasView, frame: AtlasBounds, safe: AtlasBounds, content: AtlasBounds): AtlasPanLimits {
  if (view.scale === view.fitScale) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  function axis(start: number, end: number, origin: number, span: number, low: number, high: number, first: number, last: number) {
    const from = low - first, to = high - last;
    if (span <= end - start && from <= to) {
      // A single position can fit all controls on this axis without opening a small pan range.
      const position = Math.min(to, Math.max(from, 0));
      return [position, position];
    }
    return [Math.min(0, end - origin - span, to), Math.max(0, start - origin, from)];
  }
  const [minX, maxX] = axis(frame.left, frame.right, view.offsetX, view.projectedWidth, safe.left, safe.right, content.left, content.right);
  const [minY, maxY] = axis(frame.top, frame.bottom, view.offsetY, view.projectedHeight, safe.top, safe.bottom, content.top, content.bottom);
  return { minX, maxX, minY, maxY };
}

export function clampAtlasPan({ x, y }: AtlasPoint2D, limits: AtlasPanLimits): AtlasPoint2D {
  return { x: Math.min(limits.maxX, Math.max(limits.minX, x)), y: Math.min(limits.maxY, Math.max(limits.minY, y)) };
}

export function atlasPanDomain(width: number, height: number, limits: AtlasPanLimits): AtlasBounds {
  return {
    left: Math.floor(-limits.maxX) + 0,
    top: Math.floor(-limits.maxY) + 0,
    right: Math.ceil(width - limits.minX),
    bottom: Math.ceil(height - limits.minY),
  };
}

export function atlasCameraTransform(position: AtlasPoint2D, zoom = 1) {
  if (position.x === 0 && position.y === 0 && zoom === 1) return "none";
  return `translate(${position.x}px,${position.y}px) scale(${zoom})`;
}

/** The measured marker already includes the exploration translation. */
export function atlasSelectionPosition(marker: AtlasPoint2D, destination: AtlasPoint2D, pan: AtlasPoint2D, zoom: number): AtlasPoint2D {
  return { x: destination.x - zoom * (marker.x - pan.x), y: destination.y - zoom * (marker.y - pan.y) };
}

export function atlasSelectionDomain(width: number, height: number, pan: AtlasPoint2D, target: AtlasPoint2D, zoom: number): AtlasBounds {
  return {
    left: Math.floor(Math.min(-pan.x, -target.x / zoom) - 24),
    top: Math.floor(Math.min(-pan.y, -target.y / zoom) - 24),
    right: Math.ceil(Math.max(width - pan.x, (width - target.x) / zoom) + 24),
    bottom: Math.ceil(Math.max(height - pan.y, (height - target.y) / zoom) + 24),
  };
}

function intersectionArea(a: AtlasBounds, b: AtlasBounds) {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

export function isAtlasMarkerVisible(marker: AtlasBounds, area: AtlasBounds, obstacles: readonly AtlasBounds[]) {
  return marker.left >= area.left && marker.right <= area.right &&
    marker.top >= area.top && marker.bottom <= area.bottom &&
    obstacles.every(obstacle => intersectionArea(marker, obstacle) === 0);
}

export function revealAtlasMarker(position: AtlasPoint2D, marker: AtlasBounds, thumb: AtlasBounds, safe: AtlasBounds, obstacles: readonly AtlasBounds[], limits: AtlasPanLimits) {
  const fit = (start: number, end: number, low: number, high: number) => {
    if (start < low) return low - start;
    return Math.min(0, high - end);
  };
  const base = clampAtlasPan({
    x: position.x + fit(marker.left, marker.right, safe.left, safe.right),
    y: position.y + fit(marker.top, marker.bottom, safe.top, safe.bottom),
  }, limits);
  const xs = [base.x], ys = [base.y];
  for (const obstacle of obstacles) {
    for (const item of [marker, thumb]) {
      xs.push(position.x + obstacle.right - item.left, position.x + obstacle.left - item.right);
      ys.push(position.y + obstacle.bottom - item.top, position.y + obstacle.top - item.bottom);
    }
  }
  const candidates = xs.flatMap(x => ys.map(y => clampAtlasPan({ x, y }, limits)));
  const score = ({ x, y }: AtlasPoint2D) => {
    const dx = x - position.x, dy = y - position.y;
    const visible = (item: AtlasBounds) => {
      const moved = { left: item.left + dx, right: item.right + dx, top: item.top + dy, bottom: item.bottom + dy };
      const covered = obstacles.reduce((sum, obstacle) => sum + intersectionArea(moved, obstacle), 0);
      return Math.max(0, intersectionArea(moved, safe) - covered) / intersectionArea(item, item);
    };
    return 2 * visible(thumb) + visible(marker);
  };
  return candidates.reduce((best, next) => score(next) > score(best) ? next : best, base);
}
