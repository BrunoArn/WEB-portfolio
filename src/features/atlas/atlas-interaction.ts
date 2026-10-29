import { atlasMobileQuery } from "./atlas-composition";
import type { AtlasProject } from "./atlas-types";
import type { mountAtlasTerrain } from "./atlas-engine";

type Elements = {
  root: HTMLElement; viewport: HTMLElement; world: HTMLElement;
  dialog: HTMLDialogElement; panel: HTMLElement; media: HTMLElement; morph: HTMLElement;
};

/** The approved camera/morph rhythm, scoped to a single mounted preview. */
export function mountAtlasInteraction(elements: Elements, terrain: ReturnType<typeof mountAtlasTerrain>, projects: readonly AtlasProject[], missingDescription: string) {
  const { root, viewport, world, dialog, panel, media, morph } = elements;
  const closeButton = dialog.querySelector<HTMLButtonElement>("[data-atlas-close]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const layout = matchMedia(atlasMobileQuery);
  let epoch = 0, disposed = false;
  let animations: Animation[] = [];
  let selection: { item: HTMLElement; trigger: HTMLButtonElement; thumb: HTMLElement; slot: HTMLElement; overflow: string; padding: string; scroll: number } | undefined;
  const stop = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  function animate(node: HTMLElement, frames: Keyframe[], duration = 400, delay = 0) {
    const animation = node.animate(frames, { duration: reduced.matches ? 0 : duration, delay: reduced.matches ? 0 : delay, easing: "cubic-bezier(.22,.72,.18,1)", fill: "both" });
    animations.push(animation);
    return animation.finished.catch(() => {});
  }
  function rectangle(rect: DOMRect) { return { left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" }; }
  function move(thumb: HTMLElement, from: DOMRect, to: DOMRect, radius: number | string, endRadius: number) {
    morph.append(thumb);
    Object.assign(thumb.style, rectangle(to), { borderRadius: endRadius + "px" });
    return animate(thumb, [{ ...rectangle(from), borderRadius: typeof radius === "number" ? radius + "px" : radius }, { ...rectangle(to), borderRadius: endRadius + "px" }]);
  }
  function restore(focus = true) {
    const state = selection; if (!state) return;
    stop(); world.style.transform = "";
    state.slot.append(state.thumb); state.thumb.removeAttribute("style");
    state.item.removeAttribute("data-selected"); state.trigger.setAttribute("aria-expanded", "false");
    root.dataset.selection = "idle";
    dialog.close();
    document.body.style.overflow = state.overflow; document.body.style.paddingRight = state.padding;
    selection = undefined;
    terrain.extend();
    window.scrollTo({ top: state.scroll, behavior: "instant" });
    if (focus && state.trigger.isConnected) state.trigger.focus({ preventScroll: true });
  }
  async function open(trigger: HTMLButtonElement) {
    if (selection || disposed) return;
    const item = trigger.closest<HTMLElement>("[data-atlas-project]")!;
    const project = projects.find(project => project.id === item.dataset.atlasProject); if (!project) return;
    const thumb = item.querySelector<HTMLElement>("[role=img]")!, slot = thumb.parentElement!;
    const from = thumb.getBoundingClientRect(), id = ++epoch;
    selection = { item, trigger, thumb, slot, overflow: document.body.style.overflow, padding: document.body.style.paddingRight, scroll: window.scrollY };
    dialog.querySelector("[data-atlas-title]")!.textContent = project.title;
    dialog.querySelector("[data-atlas-category]")!.textContent = project.categoryLabel;
    dialog.querySelector("[data-atlas-description]")!.textContent = project.description ?? missingDescription;
    const detail = dialog.querySelector<HTMLAnchorElement>("[data-atlas-detail]")!;
    detail.hidden = !project.href;
    dialog.querySelectorAll<HTMLAnchorElement>("[data-atlas-project-link]").forEach(link => {
      if (project.href) link.setAttribute("href", project.href); else link.removeAttribute("href");
    });
    media.setAttribute("aria-label", project.title);
    dialog.querySelector<HTMLElement>("[data-atlas-media-note]")!.hidden = thumb.dataset.atlasMissing !== "true";
    dialog.style.setProperty("--atlas-tone", project.color);
    // Compensate only the removed scrollbar, keeping the approved map width intact.
    const scrollbar = innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = (parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar) + "px";
    document.body.style.overflow = "hidden";
    dialog.showModal();
    panel.scrollTop = 0;
    window.scrollTo({ top: selection.scroll, behavior: "instant" });
    const target = media.getBoundingClientRect(), frame = viewport.getBoundingClientRect();
    const zoom = layout.matches ? 1.65 : 1.85;
    const point = { x: from.left + from.width / 2 - frame.left, y: from.top + from.height / 2 - frame.top };
    const cx = target.left + target.width / 2 - frame.left, cy = target.top + target.height / 2 - frame.top;
    const tx = cx - zoom * point.x, ty = cy - zoom * point.y;
    // Inverse-camera corner extrema occur at the transition endpoints because scale
    // and translation share the same interpolation. Include both plus a guard.
    terrain.extend({ left: Math.floor(Math.min(0, -tx / zoom) - 24), top: Math.floor(Math.min(0, -ty / zoom) - 24), right: Math.ceil(Math.max(frame.width, (frame.width - tx) / zoom) + 24), bottom: Math.ceil(Math.max(frame.height, (frame.height - ty) / zoom) + 24) }, zoom);
    terrain.pulse(project.id);
    root.dataset.selection = "opening";
    item.dataset.selected = "true"; trigger.setAttribute("aria-expanded", "true");
    const camera = `translate(${tx}px,${ty}px) scale(${zoom})`;
    world.style.transform = camera;
    closeButton.focus({ preventScroll: true });
    // Keep the full terrain domain, but stop repainting pixels outside the remaining
    // camera path. Requested density stays fixed; only the backing surface is cropped.
    function cropRemaining(includeCurrent: boolean) {
      const current = includeCurrent ? new DOMMatrixReadOnly(getComputedStyle(world).transform) : new DOMMatrixReadOnly(camera);
      terrain.crop({
        left: Math.floor(Math.min(-current.e/current.a,-tx/zoom)-24),
        top: Math.floor(Math.min(-current.f/current.d,-ty/zoom)-24),
        right: Math.ceil(Math.max((frame.width-current.e)/current.a,(frame.width-tx)/zoom)+24),
        bottom: Math.ceil(Math.max((frame.height-current.f)/current.d,(frame.height-ty)/zoom)+24),
      });
    }
    const cropTimer = window.setTimeout(() => {
      if (id === epoch && selection && !disposed) cropRemaining(true);
    },120);
    await Promise.all([move(thumb, from, target, from.width / 2, 15), animate(world, [{ transform: "none" }, { transform: camera }])]);
    clearTimeout(cropTimer);
    if (id !== epoch || !selection || disposed) return;
    stop();
    cropRemaining(false);
    root.dataset.selection = "revealing";
    // The image has arrived. Reveal the body downward from its lower edge,
    // keeping the image and the final card position fixed throughout.
    const bodyHeight = Math.max(0, panel.getBoundingClientRect().height - media.getBoundingClientRect().height);
    await Promise.all([animate(thumb, [
      { borderRadius: "15px" },
      { borderRadius: "15px 15px 0 0" },
    ], 220), animate(panel, [
      { clipPath: `inset(0 0 ${bodyHeight}px 0 round 16px)` },
      { clipPath: "inset(0 0 0 0 round 16px)" },
    ], 220)]);
    if (id !== epoch || !selection || disposed) return;
    stop(); media.append(thumb); thumb.removeAttribute("style"); root.dataset.selection = "selected";
  }
  async function close() {
    const state = selection;
    if (!state || root.dataset.selection === "closing") return;
    const id = ++epoch, from = state.thumb.getBoundingClientRect();
    const radius = getComputedStyle(state.thumb).borderRadius, camera = getComputedStyle(world).transform;
    const panelStyle = getComputedStyle(panel);
    const panelOpacity = panelStyle.opacity, panelClip = panelStyle.clipPath;
    stop(); terrain.crop(); world.style.transform = "none";
    const target = state.slot.getBoundingClientRect();
    world.style.transform = camera; root.dataset.selection = "closing";
    const motion = move(state.thumb, from, target, radius, target.width / 2);
    world.style.transform = "none";
    await Promise.all([motion, animate(world, [{ transform: camera }, { transform: "none" }]), animate(panel, [{ opacity: panelOpacity, clipPath: panelClip }, { opacity: 0, clipPath: panelClip }], 140)]);
    if (id === epoch && !disposed) restore();
  }
  function onClick(event: MouseEvent) {
    const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-atlas-trigger]");
    if (trigger && root.contains(trigger)) void open(trigger);
  }
  function dismiss(event: MouseEvent) { if (!panel.contains(event.target as Node) || (event.target as HTMLElement).closest("[data-atlas-close]")) void close(); }
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const targets = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')).filter(node => !node.hidden && getComputedStyle(node).visibility !== "hidden");
    const first = targets[0], last = targets.at(-1);
    if (!first || !last) return;
    if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
      event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  }
  function cancel(event: Event) { event.preventDefault(); void close(); }
  function resize() { if (selection) { ++epoch; restore(); } }
  root.dataset.selection = "idle";
  root.addEventListener("click", onClick); dialog.addEventListener("click", dismiss); dialog.addEventListener("cancel", cancel); dialog.addEventListener("keydown", trapFocus);
  window.addEventListener("resize", resize); reduced.addEventListener("change", resize);
  return () => {
    disposed = true; ++epoch; restore(false); stop();
    root.removeEventListener("click", onClick); dialog.removeEventListener("click", dismiss); dialog.removeEventListener("cancel", cancel); dialog.removeEventListener("keydown", trapFocus);
    window.removeEventListener("resize", resize); reduced.removeEventListener("change", resize);
  };
}
