import { atlasEntranceDuration } from "./atlas-growth";

type RevealTarget = { setReveal: (progress: number) => void; entranceAt: (x: number, y: number) => number };

/** A finite entrance. Continuous terrain motion remains owned by atlas-motion. */
export function mountAtlasEntrance(root: HTMLElement, viewport: HTMLElement, terrain: RevealTarget, options: { skip: boolean; onComplete: () => void }) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-atlas-project], [data-atlas-territory]"));
  let frame = 0, started = false, complete = false, disposed = false, startTime = 0, lastUpdate = 0;
  let points: { node: HTMLElement; arrival: number }[] = [];
  function finish(repaint = true) {
    if (complete) return;
    complete = true; cancelAnimationFrame(frame); frame = 0;
    unbind();
    for (const node of nodes) {
      for (const name of ["opacity", "scale", "y", "visibility"]) node.style.removeProperty(`--atlas-entry-${name}`);
    }
    root.dataset.entry = "complete";
    if (repaint) terrain.setReveal(1);
    options.onComplete();
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || complete) return;
    const progress = Math.min(1, (now - startTime) / atlasEntranceDuration);
    if (now - lastUpdate < 15 && progress < 1) { frame = requestAnimationFrame(tick); return; }
    lastUpdate = now;
    for (const { node, arrival } of points) {
      const t = Math.max(0, Math.min(1, (progress - arrival + .025) / .13));
      const opacity = t * t * (3 - 2 * t);
      node.style.setProperty("--atlas-entry-opacity", opacity.toFixed(4));
      node.style.setProperty("--atlas-entry-scale", (.82 + .18 * opacity).toFixed(4));
      node.style.setProperty("--atlas-entry-y", `${(7 * (1 - opacity)).toFixed(2)}px`);
      node.style.setProperty("--atlas-entry-visibility", opacity > .01 ? "visible" : "hidden");
    }
    terrain.setReveal(progress);
    if (progress >= 1) finish();
    else frame = requestAnimationFrame(tick);
  }
  const skip = () => finish();
  function keyboard(event: KeyboardEvent) { if (event.key === "Tab") finish(); }
  function select(event: Event) {
    if ((event.target as Element).closest("[data-atlas-trigger]")) finish();
  }
  function visibility() { if (document.hidden) finish(); }
  function preference() { if (reduced.matches) finish(); }
  function unbind() {
    window.removeEventListener("keydown", keyboard, true);
    window.removeEventListener("resize", skip); window.removeEventListener("scroll", skip);
    root.removeEventListener("click", select, true); root.removeEventListener("focusin", select, true);
    document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", preference);
  }
  window.addEventListener("keydown", keyboard, true);
  window.addEventListener("resize", skip);
  window.addEventListener("scroll", skip, { passive: true });
  root.addEventListener("click", select, true); root.addEventListener("focusin", select, true);
  document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", preference);
  return {
    start() {
      if (started || disposed || complete) return;
      started = true;
      if (options.skip || reduced.matches || document.hidden || window.scrollY > 0) { finish(); return; }
      const area = viewport.getBoundingClientRect();
      if (!area.width || !area.height) { finish(); return; }
      points = nodes.map(node => {
        const anchor = node.querySelector<HTMLElement>("[data-atlas-thumb-slot]") ?? node;
        const rect = anchor.getBoundingClientRect();
        const x = (rect.left + rect.width / 2 - area.left) / area.width, y = (rect.top + rect.height / 2 - area.top) / area.height;
        return { node, arrival: terrain.entranceAt(x, y) };
      });
      root.dataset.entry = "running";
      startTime = performance.now();
      frame = requestAnimationFrame(tick);
    },
    dispose() {
      disposed = true;
      if (started || complete) finish(false);
      else { cancelAnimationFrame(frame); frame = 0; }
      unbind();
    },
  };
}
