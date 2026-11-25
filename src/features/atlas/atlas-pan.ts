import { atlasCameraTransform, atlasPanDirections, atlasPanDomain, atlasPanLimits, clampAtlasPan, isAtlasMarkerVisible, neutralAtlasPan, revealAtlasMarker, type AtlasPanDirection, type AtlasPoint2D } from "./atlas-camera";
import type { AtlasBounds, getAtlasAdaptiveView } from "./atlas-layout";

const threshold = 7;
const clearance = 12;
type AtlasView = ReturnType<typeof getAtlasAdaptiveView>;
type Point = AtlasPoint2D;

function bounds(rect: DOMRect, frame: DOMRect, position = neutralAtlasPan, pad = 0): AtlasBounds {
  return {
    left: rect.left - frame.left - position.x - pad,
    top: rect.top - frame.top - position.y - pad,
    right: rect.right - frame.left - position.x + pad,
    bottom: rect.bottom - frame.top - position.y + pad,
  };
}

export function mountAtlasPan(root: HTMLElement, viewport: HTMLElement, world: HTMLElement, plane: HTMLElement, intro: HTMLElement) {
  const controls = new Map(atlasPanDirections.map(direction => [
    direction, root.querySelector<HTMLButtonElement>(`[data-pan-direction="${direction}"]`)!,
  ]));
  let position = neutralAtlasPan;
  let limits = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let metrics: { view: AtlasView; frame: DOMRect; safe: AtlasBounds } | undefined;
  let suspended = false, frameId = 0;
  let pending: Point | undefined;
  let gesture: { id: number; start: Point; origin: Point; dragging: boolean } | undefined;
  let blockedClick: { id: number; x: number; y: number } | undefined;
  const horizontal = () => limits.maxX - limits.minX > .5;
  const vertical = () => limits.maxY - limits.minY > .5;
  const active = () => horizontal() || vertical();
  const available = () => active() && !suspended && root.dataset.selection === "idle";
  const possible = (direction: AtlasPanDirection) => {
    switch (direction) {
      case "left": return position.x < limits.maxX - .5;
      case "right": return position.x > limits.minX + .5;
      case "up": return position.y < limits.maxY - .5;
      case "down": return position.y > limits.minY + .5;
    }
  };
  function syncControls() {
    viewport.toggleAttribute("data-pan-x", horizontal());
    viewport.toggleAttribute("data-pan-y", vertical());
    if (active()) viewport.tabIndex = 0;
    else viewport.removeAttribute("tabindex");
    for (const [direction, button] of controls) {
      const enabled = available() && possible(direction);
      button.hidden = !enabled && button !== document.activeElement;
      if (enabled) button.removeAttribute("aria-disabled");
      else button.setAttribute("aria-disabled", "true");
    }
  }
  function apply(next: Point) {
    position = clampAtlasPan(next, limits);
    if (!suspended) world.style.transform = atlasCameraTransform(position);
    syncControls();
  }
  function flush() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (pending) apply(pending);
    pending = undefined;
  }
  function queue(next: Point) {
    pending = next;
    if (!frameId) frameId = requestAnimationFrame(flush);
  }
  function cancelGesture() {
    const current = gesture;
    gesture = undefined;
    flush();
    viewport.removeAttribute("data-pan-dragging");
    if (current && viewport.hasPointerCapture(current.id)) viewport.releasePointerCapture(current.id);
  }
  function down(event: PointerEvent) {
    if (event.pointerType === "touch" && !event.isPrimary) {
      cancelGesture();
      return;
    }
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    blockedClick = undefined;
    if (!available() || (event.target as Element).closest("a, [data-pan-direction]")) return;
    flush();
    gesture = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: position, dragging: false };
  }
  function move(event: PointerEvent) {
    if (gesture?.id !== event.pointerId || !available()) return;
    const dx = horizontal() ? event.clientX - gesture.start.x : 0;
    const dy = vertical() ? event.clientY - gesture.start.y : 0;
    if (!gesture.dragging && Math.hypot(dx, dy) < threshold) return;
    if (!gesture.dragging) {
      gesture.dragging = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.setAttribute("data-pan-dragging", "");
    }
    blockedClick = { id: event.pointerId, x: event.clientX, y: event.clientY };
    if (event.pointerType !== "touch" && event.cancelable) event.preventDefault();
    queue({ x: gesture.origin.x + dx, y: gesture.origin.y + dy });
  }
  function end(event: PointerEvent) {
    if (event.type === "pointerup" && blockedClick?.id === event.pointerId) {
      blockedClick = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
    if (gesture?.id === event.pointerId) cancelGesture();
  }
  function lostCapture(event: PointerEvent) {
    // A touch begins with implicit capture on the marker before transferring to the viewport.
    if (event.target === viewport) end(event);
  }
  function leave(event: PointerEvent) {
    if (!gesture?.dragging) end(event);
  }
  function click(event: MouseEvent) {
    const block = blockedClick;
    if (block && event.detail > 0) {
      blockedClick = undefined;
      if (("pointerId" in event && event.pointerId === block.id) || Math.hypot(event.clientX - block.x, event.clientY - block.y) <= 2) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-pan-direction]");
    if (button) step(button.dataset.panDirection as AtlasPanDirection);
  }
  function step(direction: AtlasPanDirection) {
    if (!available() || !metrics) return;
    flush();
    if (!possible(direction)) return;
    const x = metrics.frame.width * .33, y = metrics.frame.height * .33;
    const dx = direction === "left" ? x : direction === "right" ? -x : 0;
    const dy = direction === "up" ? y : direction === "down" ? -y : 0;
    apply({ x: position.x + dx, y: position.y + dy });
  }
  function wheel(event: WheelEvent) {
    if (!available() || gesture || !metrics || !event.cancelable || event.ctrlKey || event.metaKey) return;
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.frame.height : 1;
    const current = pending ?? position;
    const next = clampAtlasPan({ x: current.x - event.deltaX * factor, y: current.y - event.deltaY * factor }, limits);
    if (next.x === current.x && next.y === current.y) return;
    event.preventDefault();
    queue(next);
  }
  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && gesture) cancelGesture();
  }
  function key(event: KeyboardEvent) {
    if (event.target !== viewport || !available() || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const direction = atlasPanDirections.find(dir => event.key.toLowerCase() === "arrow" + dir);
    if (direction && possible(direction)) { event.preventDefault(); step(direction); }
  }
  function revealMarker(target: Element | null, visibleArea?: AtlasBounds) {
    if (!available() || !metrics || !target?.matches("[data-atlas-trigger]:focus-visible") || !plane.contains(target)) return;
    flush();
    const frame = viewport.getBoundingClientRect();
    const thumb = target.parentElement?.querySelector("[data-atlas-thumb-slot]")?.getBoundingClientRect();
    if (!thumb) return;
    const marker = bounds(target.getBoundingClientRect(), frame, neutralAtlasPan, 8);
    const title = intro.getBoundingClientRect();
    const arrows = Array.from(controls.values(), button => button.getBoundingClientRect())
      .filter(rect => rect.width && rect.height);
    if (visibleArea && isAtlasMarkerVisible(marker, visibleArea, [title, ...arrows].map(rect => bounds(rect, frame)))) return;

    const obstacles = [bounds(title, frame, neutralAtlasPan, 8),
      ...arrows.map(rect => bounds(rect, frame, neutralAtlasPan, 4))];
    const next = revealAtlasMarker(position, marker, bounds(thumb, frame, neutralAtlasPan, 5), metrics.safe, obstacles, limits);
    if (next.x !== position.x || next.y !== position.y) apply(next);
  }
  const reveal = (event: FocusEvent) => revealMarker(event.target as Element);
  const focusOut = () => queueMicrotask(syncControls);

  viewport.addEventListener("pointerdown", down);
  viewport.addEventListener("pointermove", move, { capture: true });
  viewport.addEventListener("pointerup", end);
  viewport.addEventListener("pointercancel", end);
  viewport.addEventListener("lostpointercapture", lostCapture);
  viewport.addEventListener("pointerleave", leave);
  viewport.addEventListener("click", click, true);
  viewport.addEventListener("wheel", wheel, { passive: false });
  viewport.addEventListener("keydown", key);
  viewport.addEventListener("focusin", reveal);
  viewport.addEventListener("focusout", focusOut);
  window.addEventListener("keydown", cancelOnEscape);
  window.addEventListener("blur", cancelGesture);
  window.addEventListener("resize", cancelGesture);

  return {
    update(view: AtlasView, frame: DOMRect) {
      cancelGesture();
      const area = { left: 0, top: 0, right: frame.width, bottom: frame.height };
      const headerBottom = Math.max(0, ...Array.from(document.querySelectorAll("header"), el => el.getBoundingClientRect().bottom - frame.top));
      const footer = document.querySelector("footer")?.getBoundingClientRect();
      const footerHeight = footer && footer.top < frame.bottom ? frame.bottom - footer.top : 0;
      const safe = {
        left: clearance, top: headerBottom + clearance,
        right: frame.width - clearance, bottom: frame.height - footerHeight - clearance,
      };
      let content = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      if (view.fitScale !== view.scale) {
        // At layout time the controller is at rest, or resize already closed the preview.
        for (const node of plane.querySelectorAll("[data-atlas-trigger], [data-atlas-territory]")) {
          const rect = node.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          const item = bounds(rect, frame, position, 8);
          content = { left: Math.min(content.left, item.left), top: Math.min(content.top, item.top),
            right: Math.max(content.right, item.right), bottom: Math.max(content.bottom, item.bottom) };
        }
      }
      const wasActive = active();
      limits = atlasPanLimits(view, area, safe, content);
      const old = metrics;
      metrics = { view, frame, safe };
      const next = !active() ? neutralAtlasPan : !wasActive || !old
        // Favor the right-hand group away from the fixed heading and start at the top.
        ? { x: limits.minX, y: limits.maxY }
        : {
          x: frame.width / 2 - view.offsetX - (old.frame.width / 2 - old.view.offsetX - position.x) / old.view.scale * view.scale,
          y: frame.height / 2 - view.offsetY - (old.frame.height / 2 - old.view.offsetY - position.y) / old.view.scale * view.scale,
        };
      viewport.style.setProperty("--atlas-pan-top", Math.max(headerBottom + clearance, clearance) + "px");
      viewport.style.setProperty("--atlas-pan-bottom", footerHeight + clearance + "px");
      apply(next);
      // Keep the terrain's clearing anchored to the viewport layout, as with focus-driven pan.
      const layoutPosition = position;
      if (old) revealMarker(document.activeElement, { ...area, top: headerBottom, bottom: area.bottom - footerHeight });
      return { position: layoutPosition, domain: atlasPanDomain(frame.width, frame.height, limits) };
    },
    pause() {
      cancelGesture();
      suspended = true;
      syncControls();
      return position;
    },
    resume(saved: Point) {
      suspended = false;
      apply(saved);
    },
    dispose() {
      cancelGesture();
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move, true);
      viewport.removeEventListener("pointerup", end);
      viewport.removeEventListener("pointercancel", end);
      viewport.removeEventListener("lostpointercapture", lostCapture);
      viewport.removeEventListener("pointerleave", leave);
      viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("wheel", wheel);
      viewport.removeEventListener("keydown", key);
      viewport.removeEventListener("focusin", reveal);
      viewport.removeEventListener("focusout", focusOut);
      window.removeEventListener("keydown", cancelOnEscape);
      window.removeEventListener("blur", cancelGesture);
      window.removeEventListener("resize", cancelGesture);
    },
  };
}
