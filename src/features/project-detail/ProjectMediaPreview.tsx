"use client";

import type { ProjectMedia } from "@/content/types/project";

import { useEffect, useRef } from "react";
import { useState } from "react";
import Image from "next/image";

type ProjectMediaPreviewProps = {
    media: ProjectMedia[];

    labels: Readonly<{
        title: string;
        select: string;
        expand: string;
        close: string;
        previous: string;
        next: string;
    }>;
};

export function ProjectMediaPreview({
    media,
    labels,
}: ProjectMediaPreviewProps) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const openerRef = useRef<HTMLButtonElement>(null);
    const activeMedia = media[activeIndex] ?? media[0];

    const showPreviousMedia = () => {
        setActiveIndex((currentIndex) =>
            currentIndex === 0
                ? media.length - 1
                : currentIndex - 1,
        );
    };

    const showNextMedia = () => {
        setActiveIndex((currentIndex) =>
            currentIndex === media.length - 1
                ? 0
                : currentIndex + 1,
        );
    };

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        const preview = dialog.previousElementSibling;
        const opener = openerRef.current;
        const previousOverflow = document.body.style.overflow;
        const background: { element: HTMLElement; wasInert: boolean }[] = [];

        // Isolate sibling branches without making the nested dialog itself inert.
        let branch: HTMLElement = dialog;

        while (branch.parentElement) {
            for (const sibling of branch.parentElement.children) {
                if (sibling !== branch && sibling instanceof HTMLElement) {
                    background.push({ element: sibling, wasInert: sibling.inert });
                    sibling.inert = true;
                }
            }

            branch = branch.parentElement;

            if (branch === document.body) {
                break;
            }
        }

        const handleFocusIn = (event: FocusEvent) => {
            if (event.target instanceof Node && !dialog.contains(event.target)) {
                closeButtonRef.current?.focus({ preventScroll: true });
            }
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("focusin", handleFocusIn);
        closeButtonRef.current?.focus({ preventScroll: true });

        return () => {
            document.removeEventListener("focusin", handleFocusIn);
            document.body.style.overflow = previousOverflow;

            for (const { element, wasInert } of background) {
                element.inert = wasInert;
            }

            // Switching to video can unmount the original image button.
            const focusTarget = opener?.isConnected
                ? opener
                : preview?.querySelector<HTMLButtonElement>(
                    'button:not([aria-pressed]), button[aria-pressed="true"]',
                );

            focusTarget?.focus({ preventScroll: true });
        };
    }, [isExpanded]);

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                setIsExpanded(false);
                return;
            }

            if (event.key === "Tab") {
                const dialog = dialogRef.current;
                const focusableElements = Array.from(
                    dialog?.querySelectorAll<HTMLElement>(
                        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], audio[controls], [tabindex]:not([tabindex="-1"])',
                    ) ?? [],
                ).filter((element) =>
                    element.tabIndex >= 0 &&
                    !element.hasAttribute("data-lightbox-focus-guard") &&
                    element.getClientRects().length > 0 &&
                    !element.closest("[inert]") &&
                    getComputedStyle(element).visibility !== "hidden",
                );
                const first = focusableElements[0];
                const last = focusableElements[focusableElements.length - 1];
                const active = document.activeElement;

                // Native media controls retarget focus to the media element.
                // Let them complete their tab sequence before the trailing guard.
                if (active instanceof HTMLMediaElement) {
                    return;
                }

                if (!first || !last) {
                    event.preventDefault();
                    closeButtonRef.current?.focus({ preventScroll: true });
                } else if (event.shiftKey && (active === first || !dialog?.contains(active))) {
                    event.preventDefault();
                    last.focus({ preventScroll: true });
                } else if (!event.shiftKey && (active === last || !dialog?.contains(active))) {
                    event.preventDefault();
                    first.focus({ preventScroll: true });
                }

                return;
            }

            if (event.key === "ArrowLeft") {
                setActiveIndex((currentIndex) =>
                    currentIndex === 0
                        ? media.length - 1
                        : currentIndex - 1,
                );
            }

            if (event.key === "ArrowRight") {
                setActiveIndex((currentIndex) =>
                    currentIndex === media.length - 1
                        ? 0
                        : currentIndex + 1,
                );
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isExpanded, media.length]);

    if (!activeMedia) {
        return null;
    }

    return (
        <section>
            <div>

                <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                    {labels.title}
                </h2>

                <div className="relative mt-(--space-20) overflow-hidden rounded-(--radius-large) border border-app-border bg-app-surface-elevated">

                    {activeMedia.type === "image" ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                openerRef.current = event.currentTarget;
                                setIsExpanded(true);
                            }}
                            aria-label={labels.expand}
                            className="relative block aspect-video w-full cursor-zoom-in overflow-hidden"
                        >
                            <Image
                                src={activeMedia.src}
                                alt={activeMedia.alt}
                                fill
                                sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
                                className="object-cover"
                            />
                        </button>
                    ) : (
                        <video
                            src={activeMedia.src}
                            controls
                            preload="metadata"
                            className="aspect-video w-full bg-black object-contain"
                        />
                    )}
                </div>

                {media.length > 1 && (
                    <div className="mt-(--space-12) flex gap-(--space-8) overflow-x-auto pb-(--space-4)">
                        {media.map((item, index) => {
                            const isActive = index === activeIndex;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveIndex(index)}
                                    aria-label={`${labels.select} ${index + 1}`}
                                    aria-pressed={isActive}
                                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-(--radius-control) border bg-app-surface-elevated motion-safe:transition-colors motion-safe:duration-(--motion-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent ${isActive
                                        ? "border-app-accent"
                                        : "border-app-border hover:border-app-text-secondary"
                                        }`}
                                >
                                    {item.type === "image" ? (
                                        <Image
                                            src={item.src}
                                            alt=""
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex h-full items-center justify-center text-(length:--font-size-card-mobile) text-app-text-primary"
                                        >
                                            ▶
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {isExpanded && (
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={labels.expand}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-app-background/95 p-(--space-20) md:p-(--space-40)"
                >
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="absolute right-(--space-20) top-(--space-20) rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                        {labels.close} ×
                    </button>

                    {media.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={showPreviousMedia}
                                aria-label={labels.previous}
                                className="absolute left-(--space-20) top-1/2 z-10 -translate-y-1/2 rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-12) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                ←
                            </button>

                            <button
                                type="button"
                                onClick={showNextMedia}
                                aria-label={labels.next}
                                className="absolute right-(--space-20) top-1/2 z-10 -translate-y-1/2 rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-12) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                →
                            </button>
                        </>
                    )}

                    <div className="flex max-h-full max-w-7xl items-center justify-center">
                        {activeMedia.type === "image" ? (
                            <Image
                                src={activeMedia.src}
                                alt={activeMedia.alt}
                                width={activeMedia.width ?? 1600}
                                height={activeMedia.height ?? 900}
                                sizes="100vw"
                                className="max-h-[90vh] w-auto max-w-full object-contain"
                            />
                        ) : (
                            <video
                                src={activeMedia.src}
                                controls
                                autoPlay
                                className="max-h-[90vh] max-w-full"
                            />
                        )}
                    </div>
                    <span
                        data-lightbox-focus-guard
                        tabIndex={0}
                        onFocus={() => closeButtonRef.current?.focus({ preventScroll: true })}
                        className="sr-only"
                    />
                </div>
            )}
        </section>
    );
}
