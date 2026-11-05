import { getImageProps } from "next/image";
import type { ProjectMedia } from "@/content/types/project";

export const galleryPreviewSizes = "(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)";
type Connection = { saveData?: boolean; effectiveType?: string };

/** Per-gallery preparation, using exactly the responsive sources of the visible image. */
export function createGalleryImagePrefetcher() {
    const images = new Map<string, HTMLImageElement>();
    let active = 0;
    let disposed = false;
    let pending: { item: ProjectMedia; expanded: boolean; priority: "low" | "auto" } | undefined;
    function prepare(item: ProjectMedia | undefined, expanded = false, priority: "low" | "auto" = "low") {
        const connection = (navigator as Navigator & { connection?: Connection }).connection;
        if (disposed || document.hidden || connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "") ||
            item?.type !== "image" || !/\.(jpe?g|png|webp|avif)$/i.test(item.src.split(/[?#]/, 1)[0])) return;
        let props: ReturnType<typeof getImageProps>["props"];
        try {
            ({ props } = getImageProps(expanded
                ? { src: item.src, alt: "", width: item.width ?? 1600, height: item.height ?? 900, sizes: "100vw" }
                : { src: item.src, alt: "", fill: true, sizes: galleryPreviewSizes }));
        } catch { return; }
        const key = [props.src, props.srcSet, props.sizes].join("|");
        const existing = images.get(key);
        if (existing) { if (priority === "auto") existing.fetchPriority = "auto"; return; }
        // Keep only the latest intent/next image while both slots are busy.
        if (active >= 2) { pending = { item, expanded, priority }; return; }
        if (images.size >= 6) {
            const oldest = Array.from(images).find(([, image]) => image.complete);
            if (oldest) images.delete(oldest[0]);
            else return;
        }
        const image = new window.Image();
        images.set(key, image);
        active++;
        let finished = false;
        function finish(failed = false) {
            if (finished) return;
            finished = true;
            active--;
            image.onload = null;
            image.onerror = null;
            if (failed) images.delete(key);
            const next = pending;
            pending = undefined;
            if (next && !disposed) prepare(next.item, next.expanded, next.priority);
        }
        image.onload = () => {
            if (image.decode) void image.decode().then(() => finish(), () => finish(true));
            else finish();
        };
        image.onerror = () => finish(true);
        image.decoding = "async";
        image.fetchPriority = priority;
        image.sizes = props.sizes ?? "";
        image.srcset = props.srcSet ?? "";
        image.src = props.src;
    }
    return {
        prepare,
        dispose() {
            disposed = true;
            pending = undefined;
            images.forEach(image => {
                image.onload = null;
                image.onerror = null;
                image.removeAttribute("srcset");
                image.removeAttribute("src");
            });
            images.clear();
        },
    };
}
