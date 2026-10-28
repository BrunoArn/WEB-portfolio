import { atlasCategories, atlasMobileQuery, atlasProjects } from "./atlas-fixtures";
import type { Locale } from "@/i18n/config";
import type { mountAtlasTerrain } from "./atlas-engine";

type Elements = {
  root: HTMLElement; viewport: HTMLElement; world: HTMLElement;
  dialog: HTMLDialogElement; panel: HTMLElement; media: HTMLElement; morph: HTMLElement;
};

/** The approved camera/morph rhythm, scoped to a single mounted preview. */
export function mountAtlasInteraction(elements: Elements, terrain: ReturnType<typeof mountAtlasTerrain>, locale: Locale) {
  const { root, viewport, world, dialog, panel, media, morph } = elements;
  const closeButton = dialog.querySelector<HTMLButtonElement>("[data-atlas-close]")!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const layout = matchMedia(atlasMobileQuery);
  let epoch = 0, disposed = false;
  let animations: Animation[] = [];
  let selection: { item: HTMLElement; trigger: HTMLButtonElement; thumb: HTMLElement; slot: HTMLElement; overflow: string; padding: string; scroll: number } | undefined;
  const stop = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  function animate(node: HTMLElement, frames: Keyframe[], duration = 720, delay = 0) {
    const animation = node.animate(frames, { duration: reduced.matches ? 0 : duration, delay: reduced.matches ? 0 : delay, easing: "cubic-bezier(.22,.72,.18,1)", fill: "both" });
    animations.push(animation);
    return animation.finished.catch(() => {});
  }
  function rectangle(rect: DOMRect) { return { left: rect.left + "px", top: rect.top + "px", width: rect.width + "px", height: rect.height + "px" }; }
  function move(thumb: HTMLElement, from: DOMRect, to: DOMRect, radius: number, endRadius: number) {
    morph.append(thumb);
    Object.assign(thumb.style, rectangle(to), { borderRadius: endRadius + "px" });
    return animate(thumb, [{ ...rectangle(from), borderRadius: radius + "px" }, { ...rectangle(to), borderRadius: endRadius + "px" }]);
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
    const project = atlasProjects.find(project => project.id === item.dataset.atlasProject); if (!project) return;
    const thumb = item.querySelector<HTMLElement>("[role=img]")!, slot = thumb.parentElement!;
    const from = thumb.getBoundingClientRect(), id = ++epoch;
    selection = { item, trigger, thumb, slot, overflow: document.body.style.overflow, padding: document.body.style.paddingRight, scroll: window.scrollY };
    dialog.querySelector("[data-atlas-title]")!.textContent = project.title[locale];
    dialog.querySelector("[data-atlas-category]")!.textContent = atlasCategories[project.c].name;
    dialog.style.setProperty("--atlas-tone", `var(${atlasCategories[project.c].token})`);
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
    terrain.extend({ left: Math.floor(Math.min(0, -tx / zoom) - 24), top: Math.floor(Math.min(0, -ty / zoom) - 24), right: Math.ceil(Math.max(frame.width, (frame.width - tx) / zoom) + 24), bottom: Math.ceil(Math.max(frame.height, (frame.height - ty) / zoom) + 24) });
    root.dataset.selection = "opening";
    item.dataset.selected = "true"; trigger.setAttribute("aria-expanded", "true");
    const camera = `translate(${tx}px,${ty}px) scale(${zoom})`;
    world.style.transform = camera;
    closeButton.focus({ preventScroll: true });
    await Promise.all([move(thumb, from, target, from.width / 2, 15), animate(world, [{ transform: "none" }, { transform: camera }])]);
    if (id !== epoch || !selection || disposed) return;
    stop();
    root.dataset.selection = "revealing";
    await animate(panel, [{ opacity: 0 }, { opacity: 1 }], 220);
    if (id !== epoch || !selection || disposed) return;
    stop(); media.append(thumb); thumb.removeAttribute("style"); root.dataset.selection = "selected";
  }
  async function close() {
    const state = selection;
    if (!state || root.dataset.selection === "closing") return;
    const id = ++epoch, from = state.thumb.getBoundingClientRect();
    const radius = parseFloat(getComputedStyle(state.thumb).borderTopLeftRadius), camera = getComputedStyle(world).transform;
    const panelOpacity = getComputedStyle(panel).opacity;
    stop(); world.style.transform = "none";
    const target = state.slot.getBoundingClientRect();
    world.style.transform = camera; root.dataset.selection = "closing";
    const motion = move(state.thumb, from, target, radius, target.width / 2);
    world.style.transform = "none";
    await Promise.all([motion, animate(world, [{ transform: camera }, { transform: "none" }]), animate(panel, [{ opacity: panelOpacity }, { opacity: 0 }], 180)]);
    if (id === epoch && !disposed) restore();
  }
  function onClick(event: MouseEvent) {
    const trigger = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-atlas-trigger]");
    if (trigger && root.contains(trigger)) void open(trigger);
  }
  function dismiss(event: MouseEvent) { if (event.target === dialog || (event.target as HTMLElement).closest("[data-atlas-close]")) void close(); }
  function trapFocus(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const targets = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'));
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
