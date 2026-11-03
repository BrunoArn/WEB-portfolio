"use client";

import type { Project } from "@/content/types/project";
import { accentStyle } from "@/styles/accent";

import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent, type MouseEvent } from "react";
import styles from "./RelatedProjects.module.css";

type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    dragging: boolean;
};

type RelatedProjectsProps = {
    projects: Project[];
    title: string;
    locale: string;
};

export function RelatedProjects({
    projects,
    title,
    locale,
}: RelatedProjectsProps) {
    const dragRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);

    const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;

        dragRef.current = null;
        delete event.currentTarget.dataset.dragging;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const startDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !event.isPrimary) return;

        suppressClickRef.current = false;
        if (event.pointerType === "touch") return;

        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: event.currentTarget.scrollLeft,
            dragging: false,
        };
        // Keep mouse focus from scrolling a partially visible link before the drag starts.
        event.preventDefault();
    };

    const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        if (event.buttons !== 1) {
            finishDrag(event);
            return;
        }

        const deltaX = event.clientX - drag.startX;
        if (!drag.dragging) {
            if (Math.abs(deltaX) < 6) return;
            if (Math.abs(event.clientY - drag.startY) > Math.abs(deltaX)) {
                finishDrag(event);
                return;
            }
            drag.dragging = true;
            suppressClickRef.current = true;
            event.currentTarget.dataset.dragging = "true";
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        event.preventDefault();
        event.currentTarget.scrollLeft = drag.scrollLeft - deltaX;
    };

    const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
        if (suppressClickRef.current && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
        }
    };

    if (projects.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="font-heading text-(length:--font-size-section-mobile) font-black leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                {title}
            </h2>

            <div
                className={styles.rail}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onLostPointerCapture={finishDrag}
                onPointerLeave={(event) => {
                    if (!dragRef.current?.dragging) finishDrag(event);
                }}
                onClickCapture={handleClickCapture}
                onDragStart={(event) => event.preventDefault()}
            >
                {projects.map((project) => (
                    <Link
                        key={project.slug}
                        style={accentStyle(project.accentColor)}
                        href={`/${locale}/projects/${project.slug}`}
                        onFocus={(event) => {
                            const card = event.currentTarget;
                            const rail = card.parentElement;

                            if (!rail) {
                                return;
                            }

                            const cardBounds = card.getBoundingClientRect();
                            const railBounds = rail.getBoundingClientRect();

                            if (cardBounds.left < railBounds.left || cardBounds.right > railBounds.right) {
                                rail.scrollTo({
                                    left: rail.scrollLeft + cardBounds.left - railBounds.left,
                                    behavior: "instant",
                                });
                            }
                        }}
                        draggable={false}
                        className={`${styles.card} group shrink-0 overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface motion-safe:transition-colors motion-safe:duration-(--motion-ui) hover:border-app-accent focus-visible:border-app-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-accent`}
                    >
                        <div className="relative aspect-video overflow-hidden bg-app-surface-elevated">
                            <Image
                                src={project.cover.src}
                                alt={project.cover.alt}
                                fill
                                sizes="(min-width: 1280px) 464px, (min-width: 1024px) 40vw, (min-width: 640px) 67vw, 85vw"
                                draggable={false}
                                className="object-cover motion-safe:transition-transform motion-safe:duration-(--motion-ui) motion-safe:group-hover:scale-[1.03]"
                            />
                        </div>

                        <div className="p-(--card-padding)">
                            <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
                                {project.categories[0]?.name}
                            </p>

                            <h3 className="font-heading mt-(--space-8) text-(length:--font-size-card-mobile) font-black leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                                {project.title}
                            </h3>

                            <p className="mt-(--space-8) text-(length:--font-size-label) leading-(--line-height-label) text-app-text-secondary">
                                {project.role} · {project.year}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}