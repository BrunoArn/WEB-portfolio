"use client";

import { useEffect, useRef } from "react";
import { mountAtlasTerrain } from "@/features/atlas/atlas-engine";
import { getAtlasView } from "@/features/atlas/atlas-layout";
import { atlasMobileQuery } from "@/features/atlas/atlas-composition";
import type { AtlasAnchor, AtlasContent, AtlasTerritory } from "@/features/atlas/atlas-types";
import styles from "./ProjectAtlasBackground.module.css";

type ProjectAtlasBackdropProps = {
    slug: string;
    projectId: string;
    projects: AtlasAnchor[];
    territories: AtlasTerritory[];
    terrain: AtlasContent["terrain"];
};

export function ProjectAtlasBackdrop({ slug, projectId, projects, territories, terrain }: ProjectAtlasBackdropProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const clearingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const viewport = viewportRef.current;
        const world = worldRef.current;
        const canvas = canvasRef.current;
        const clearing = clearingRef.current;
        const project = projects.find(anchor => anchor.id === projectId);
        if (!viewport || !world || !canvas || !clearing || !project) return;

        // Reuse the resting Atlas renderer: no WebGL context, animation or pointer listeners.
        const controller = mountAtlasTerrain(canvas, viewport, clearing, projects, territories, atlasMobileQuery, terrain, {
            staticFallback: true,
            onFallback: () => {},
        });
        const media = window.matchMedia(atlasMobileQuery);
        let frame = 0;

        const updateCamera = () => {
            const width = viewport.clientWidth;
            const height = viewport.clientHeight;
            if (!width || !height) return;

            const mobile = media.matches;
            const view = getAtlasView(width, height, mobile);
            const zoom = mobile ? 1.65 : 1.85;
            const x = view.offsetX + (mobile ? project.mx : project.x) * view.world.width * view.scale;
            const y = view.offsetY + (mobile ? project.my : project.y) * view.world.height * view.scale;
            const tx = width / 2 - x * zoom;
            const ty = height / 2 - y * zoom;
            world.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;

            // Rasterize only the visible region at resting density; the faded background
            // does not need the extra pixel budget used by the interactive zoom transition.
            controller.extend({
                left: Math.floor(-tx / zoom - 24),
                top: Math.floor(-ty / zoom - 24),
                right: Math.ceil((width - tx) / zoom + 24),
                bottom: Math.ceil((height - ty) / zoom + 24),
            });
        };

        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(() => {
                frame = 0;
                updateCamera();
            });
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(viewport);
        media.addEventListener("change", schedule);
        updateCamera();

        return () => {
            observer.disconnect();
            media.removeEventListener("change", schedule);
            cancelAnimationFrame(frame);
            controller.dispose();
        };
    }, [projectId, projects, territories, terrain]);

    return (
        <div ref={viewportRef} className={styles.backdrop} data-project-atlas-background={slug} aria-hidden="true">
            <div ref={worldRef} className={styles.world}>
                <canvas ref={canvasRef} className={styles.canvas} />
            </div>
            <div ref={clearingRef} className={styles.clearing} />
        </div>
    );
}
