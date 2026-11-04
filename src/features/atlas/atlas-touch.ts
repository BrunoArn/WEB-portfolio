import { atlasTouchReference as config } from "./atlas-motion-settings";

type Point = { clientX: number; clientY: number };
type Response = {
    allowed: () => boolean;
    begin: (point: Point) => void;
    move: (point: Point, speed: number) => void;
    end: () => void;
    tap: (point: Point) => void;
};
/** Passive touch and scroll share one sampled input, including after pointercancel. */
export function mountAtlasTouch(viewport: HTMLElement, response: Response) {
    let gesture: {
        id: number; x: number; y: number; started: number; sampled: number;
        scrollX: number; scrollY: number; moved: boolean; tapAllowed: boolean;
        point: Point; lastX: number; lastY: number; lastScrollX: number; lastScrollY: number;
    } | undefined;
    function reset() {
        gesture = undefined;
        response.end();
    }
    function start(event: TouchEvent) {
        reset();
        const target = event.target as Element;
        const project = target.closest("[data-atlas-project]");
        if (event.touches.length !== 1 || !response.allowed() ||
            (!project && target.closest("a, button, input, select, textarea, [role=button]"))) return;
        const point = event.touches[0];
        gesture = { id: point.identifier, x: point.clientX, y: point.clientY,
            started: event.timeStamp, sampled: performance.now(),
            scrollX: window.scrollX, scrollY: window.scrollY, moved: false, tapAllowed: !project,
            point: { clientX: point.clientX, clientY: point.clientY },
            lastX: point.clientX, lastY: point.clientY, lastScrollX: window.scrollX, lastScrollY: window.scrollY };
        response.begin(point);
    }
    function sample() {
        if (!gesture) return;
        if (!response.allowed()) { reset(); return; }
        const scrolled = Math.hypot(window.scrollX - gesture.scrollX, window.scrollY - gesture.scrollY) > 1;
        gesture.moved ||= scrolled;
        const now = performance.now(), elapsed = now - gesture.sampled;
        if (!gesture.moved || elapsed < config.sampleInterval) return;
        // Scroll may cancel finger/world displacement. Keep the contact at the
        // actual finger and use screen/scroll velocity only for impulse energy.
        const distance = Math.max(
            Math.hypot(gesture.point.clientX - gesture.lastX, gesture.point.clientY - gesture.lastY),
            Math.hypot(window.scrollX - gesture.lastScrollX, window.scrollY - gesture.lastScrollY),
        );
        const speed = Math.min(config.maximumSpeed, distance * 1000 / elapsed);
        gesture.sampled = now;
        gesture.lastX = gesture.point.clientX;
        gesture.lastY = gesture.point.clientY;
        gesture.lastScrollX = window.scrollX;
        gesture.lastScrollY = window.scrollY;
        response.move(gesture.point, speed);
    }
    function move(event: TouchEvent) {
        if (!gesture) return;
        if (event.touches.length !== 1) { reset(); return; }
        const point = Array.from(event.touches).find(item => item.identifier === gesture!.id);
        if (!point) { reset(); return; }
        gesture.point = { clientX: point.clientX, clientY: point.clientY };
        gesture.moved ||= Math.hypot(point.clientX - gesture.x, point.clientY - gesture.y) > config.tapSlop;
        sample();
    }
    function end(event: TouchEvent) {
        const state = gesture;
        const point = state && Array.from(event.changedTouches).find(item => item.identifier === state.id);
        const tap = state && point && state.tapAllowed && !state.moved && event.touches.length === 0 &&
            event.timeStamp - state.started <= config.tapDuration &&
            Math.hypot(point.clientX - state.x, point.clientY - state.y) <= config.tapSlop &&
            Math.hypot(window.scrollX - state.scrollX, window.scrollY - state.scrollY) <= 1 && response.allowed();
        reset();
        if (tap) response.tap(point);
    }
    viewport.addEventListener("touchstart", start, { passive: true });
    viewport.addEventListener("touchmove", move, { passive: true });
    viewport.addEventListener("touchend", end, { passive: true });
    viewport.addEventListener("touchcancel", reset, { passive: true });
    window.addEventListener("scroll", sample, { passive: true });
    window.addEventListener("blur", reset);
    return {
        reset,
        dispose() {
            reset();
            viewport.removeEventListener("touchstart", start);
            viewport.removeEventListener("touchmove", move);
            viewport.removeEventListener("touchend", end);
            viewport.removeEventListener("touchcancel", reset);
            window.removeEventListener("scroll", sample);
            window.removeEventListener("blur", reset);
        },
    };
}
