import { atlasMotionReference, atlasSelectionDuration, type AtlasMotionSettings } from "./atlas-motion-settings";
import { createAtlasString, advanceAtlasString, strikeAtlasString, type AtlasString } from "./atlas-string-response";
import type { AtlasAnchor, AtlasPoint, AtlasContour } from "./atlas-types";
import type { AtlasBounds } from "./atlas-layout";

export const atlasRibbonStride = 7;

type World = { width: number; height: number };
type Clearing = { cx: number; cy: number; sx: number; sy: number };

/** Shared ambient breathing, independent pointer response per contour, and a fast selection impulse. */
export function mountAtlasMotion(canvas: HTMLCanvasElement, viewport: HTMLElement, repaint: () => void) {
  let settings = { ...atlasMotionReference, enabled: false }, disposed = false, visible = true;
  let frame = 0, previous = 0, lastPaint = 0, time = 0, frames = 0;
  let bounds: AtlasBounds = { left: 0, top: 0, right: 1, bottom: 1 }, nx = 1, ny = 1, stepX = 1, stepY = 1;
  let protection = new Float32Array(4);
  let world: World = { width: 1, height: 1 }, scale = 1, screenLeft = 0, screenTop = 0, offsetX = 0, offsetY = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, pressure = 0, over = false;
  let lines: AtlasString[] = [];
  let anchors: readonly AtlasAnchor[] = [], pulse: { x: number; y: number; age: number } | undefined;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const active = () => settings.enabled && !reduced.matches;
  const running = () => active() && (settings.breath > 0 || (over && settings.pressure > 0) || pressure > .001 || !!pulse) && !document.hidden && visible && !disposed;
  function schedule() { canvas.dataset.motionActive = String(running()); if (running() && !frame) frame = requestAnimationFrame(tick); }
  function clear() { pressure = 0; over = false; pulse = undefined; lines.forEach(line => { line.value = 0; line.strike = undefined; }); }
  function policy() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    canvas.dataset.motionActive = String(running());
    if (!active()) { clear(); repaint(); }
    schedule();
  }
  function tick(now: number) {
    frame = 0;
    // A queued frame may observe that motion is no longer allowed.
    // Apply the stop policy as well, so reduced motion restores the static raster.
    if (!running()) { policy(); return; }
    // Target 60 redraws/sec while integrating the response with elapsed time.
    if (now - lastPaint >= 15) {
      const dt = previous ? Math.min(.07, (now - previous) / 1000) : 0;
      previous = now; lastPaint = now; time += dt;
      const start = performance.now();
      advance(dt);
      repaint(); frames++;
      canvas.dataset.motionFrames = String(frames);
      canvas.dataset.motionCost = (performance.now() - start).toFixed(2);
    }
    schedule();
  }
  function advance(dt: number) {
    const follow = 1 - Math.exp(-dt / .09), release = .12 + settings.returnTime / 100 * 1.2;
    pointerX += (targetX - pointerX) * follow; pointerY += (targetY - pointerY) * follow;
    pressure += ((over ? 1 : 0) - pressure) * (1 - Math.exp(-dt / (over ? .13 : release)));
    if (pulse) { pulse.age += dt; if (pulse.age > atlasSelectionDuration) { pulse = undefined; lines.forEach(line => { line.strike = undefined; }); } }
    const unit = 1 / scale;
    for (const line of lines) advanceAtlasString(line, pointerX, pointerY, over, settings.pressure, settings.returnTime, dt, unit, settings.mouseRadius);
    if (!over && pressure < .001) { pressure = 0; lines.forEach(line => { line.value = 0; }); }
  }
  function pointer(event: PointerEvent) {
    if (!active() || event.pointerType === "touch" || canvas.closest<HTMLElement>("[data-atlas-preview]")?.dataset.selection !== "idle") return;
    const rect = canvas.getBoundingClientRect(), width = parseFloat(canvas.style.width);
    if (!rect.width || !width) return;
    const factor = rect.width / width;
    targetX = ((event.clientX - rect.left) / factor + screenLeft - offsetX) / scale;
    targetY = ((event.clientY - rect.top) / factor + screenTop - offsetY) / scale;
    if (!over && pressure < .01) { pointerX = targetX; pointerY = targetY; }
    over = true; schedule();
  }
  const leave = () => { over = false; };
  viewport.addEventListener("pointermove", pointer); viewport.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave); window.addEventListener("scroll", leave, { passive: true });
  document.addEventListener("visibilitychange", policy); reduced.addEventListener("change", policy);
  const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; policy(); }); observer.observe(viewport);
  return {
    state: () => ({ settings, time, scale, bounds, nx, ny, stepX, stepY, protection, active: active(), pulseAge: pulse?.age ?? -1 }),
    configure(area: AtlasBounds, dimensions: World, zoom: number, left: number, top: number, ox: number, oy: number, projects: readonly AtlasAnchor[], intro: Clearing) {
      lines = [];
      bounds = area; world = dimensions; scale = zoom; screenLeft = left; screenTop = top; offsetX = ox; offsetY = oy; anchors = projects;
      nx = Math.max(1, Math.ceil((area.right - area.left) / 12)); ny = Math.max(1, Math.ceil((area.bottom - area.top) / 12));
      stepX = (area.right - area.left) / nx; stepY = (area.bottom - area.top) / ny;
      protection = new Float32Array((nx + 1) * (ny + 1));
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const x = area.left + i * stepX, y = area.top + j * stepY;
        let keep = 1 - Math.exp(-.5 * (((x / world.width - intro.cx) / intro.sx) ** 4 + ((y / world.height - intro.cy) / intro.sy) ** 4));
        for (const p of anchors) keep *= 1 - .94 * Math.exp(-.5 * (((x - p.x * world.width) / (56 / scale)) ** 2 + ((y - p.y * world.height) / (45 / scale)) ** 2));
        protection[j * (nx + 1) + i] = keep;
      }
      if (active()) advance(0);
      previous = 0; schedule();
    },
    prepare(points: AtlasPoint[], contour: AtlasContour) {
      const line = createAtlasString(contour, scale); lines.push(line);
      if (pulse) strikeAtlasString(line,pulse.x,pulse.y,1/scale,settings.mouseRadius);
      const mesh = new Float32Array(points.length * atlasRibbonStride);
      points.forEach(([x,y], i) => {
        const gx = Math.max(0, Math.min(nx - .00001, (x - bounds.left) / stepX));
        const gy = Math.max(0, Math.min(ny - .00001, (y - bounds.top) / stepY));
        const cell = Math.floor(gy) * (nx + 1) + Math.floor(gx), a = gx % 1, b = gy % 1, below = cell+nx+1;
        const keep = (protection[cell]*(1-a)+protection[cell+1]*a)*(1-b)+(protection[below]*(1-a)+protection[below+1]*a)*b;
        const index = i < contour.path.length ? i : points.length-1-i;
        mesh.set([x,y,cell,line.normals[index*2],line.normals[index*2+1],line.arcs[index],keep],i*atlasRibbonStride);
      });
      return { mesh, line };
    },
    set(value: AtlasMotionSettings) {
      settings = { selectionStrength: Number.isFinite(value.selectionStrength) ? Math.max(0,Math.min(100,value.selectionStrength)) : atlasMotionReference.selectionStrength, mouseRadius: Number.isFinite(value.mouseRadius) ? Math.max(15, Math.min(80, value.mouseRadius)) : atlasMotionReference.mouseRadius, enabled: !!value.enabled, breath: Math.max(0,Math.min(100,value.breath)), pressure: Math.max(0,Math.min(100,value.pressure)), returnTime: Math.max(0,Math.min(100,value.returnTime)) };
      if (!settings.breath && !settings.pressure && !pulse) { clear(); }
      if (active()) { advance(0); repaint(); }
      policy();
    },
    pulse(id: string) { if (!active() || !settings.selectionStrength) return; const p = anchors.find(p => p.id === id); if (p) pulse = { x: p.x * world.width, y: p.y * world.height, age: .035 }; over = false; lines.forEach(line => { if (pulse) strikeAtlasString(line,pulse.x,pulse.y,1/scale,settings.mouseRadius); }); advance(0); repaint(); schedule(); },
    dispose() { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); viewport.removeEventListener("pointermove", pointer); viewport.removeEventListener("pointerleave", leave); window.removeEventListener("blur", leave); window.removeEventListener("scroll", leave); document.removeEventListener("visibilitychange", policy); reduced.removeEventListener("change", policy); },
  };
}
