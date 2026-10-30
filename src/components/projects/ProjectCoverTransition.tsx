import { ViewTransition, type ReactNode } from "react";
import { getImageProps } from "next/image";

type ProjectCoverTransitionProps = {
    slug: string;
    children: ReactNode;
    enabled?: boolean;
};

/** A shared identity for the Atlas cover and the existing project hero. No extra DOM. */
export function ProjectCoverTransition({ slug, children, enabled = true }: ProjectCoverTransitionProps) {
    const name = "project-cover-" + encodeURIComponent(slug).replaceAll("%", "_");
    return (
        <ViewTransition name={name} share={enabled ? "project-cover-morph" : "none"} default="none">
            {children}
        </ViewTransition>
    );
}

// Keep preload selection identical to the existing responsive project hero.
export const projectHeroSizes = "(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)";

/** Called only after a normal card-link click. Failed/slow images never block navigation indefinitely. */
export async function prepareProjectCover(src: string): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const { props } = getImageProps({ src, alt: "", fill: true, sizes: projectHeroSizes });
        const image = new window.Image();
        image.decoding = "async";
        image.fetchPriority = "high";
        image.sizes = props.sizes ?? "";
        image.srcset = props.srcSet ?? "";
        image.src = props.src;
        return await Promise.race([
            image.decode().then(() => image.naturalWidth > 0).catch(() => false),
            new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), 1800); }),
        ]);
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}
