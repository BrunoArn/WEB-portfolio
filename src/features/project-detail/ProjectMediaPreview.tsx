"use client";

import type { ProjectMedia } from "@/content/types/project";

import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import Image from "next/image";
import { flushSync } from "react-dom";
import { createGalleryImagePrefetcher, galleryPreviewSizes } from "./gallery-image-prefetch";

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

type VideoPosition = { source: string; time: number };

function pauseVideo(video: HTMLVideoElement | null): VideoPosition | null {
    if (!video) return null;

    const position = {
        source: video.getAttribute("src") ?? "",
        time: Number.isFinite(video.currentTime) ? Math.max(0, video.currentTime) : 0,
    };
    video.pause();
    return position;
}

function restoreVideoPosition(
    video: HTMLVideoElement | null,
    pending: { current: VideoPosition | null },
) {
    const position = pending.current;
    if (!video || !position || video.getAttribute("src") !== position.source || video.readyState === 0) {
        return;
    }

    try {
        video.currentTime = Number.isFinite(video.duration)
            ? Math.min(position.time, Math.max(0, video.duration))
            : position.time;
        pending.current = null;
    } catch {
        // Some media cannot seek yet; retry on canplay without a timer.
    }
}

export function ProjectMediaPreview({
    media,
    labels,
}: ProjectMediaPreviewProps) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const galleryRef = useRef<HTMLElement>(null);
    const imagePrefetch = useRef<ReturnType<typeof createGalleryImagePrefetcher> | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const backdropPointerDown = useRef(false);
    const openerRef = useRef<HTMLButtonElement>(null);
    const inlineVideoRef = useRef<HTMLVideoElement>(null);
    const expandedVideoRef = useRef<HTMLVideoElement>(null);
    const modalStartRef = useRef<VideoPosition | null>(null);
    const inlineReturnRef = useRef<VideoPosition | null>(null);
    const activeMedia = media[activeIndex] ?? media[0];

    useEffect(() => {
        const prefetch = createGalleryImagePrefetcher();
        imagePrefetch.current = prefetch;
        return () => { prefetch.dispose(); imagePrefetch.current = null; };
    }, []);

    useEffect(() => {
        const gallery = galleryRef.current;
        if (!gallery || typeof IntersectionObserver === "undefined") return;
        const observer = new IntersectionObserver(entries => setGalleryVisible(entries.some(entry => entry.isIntersecting)));
        observer.observe(gallery);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if ((galleryVisible || isExpanded) && media.length > 1) {
            imagePrefetch.current?.prepare(media[(activeIndex + 1) % media.length], isExpanded);
        }
    }, [activeIndex, galleryVisible, isExpanded, media]);

    function prepareMedia(index: number) {
        if (index !== activeIndex) imagePrefetch.current?.prepare(media[index], isExpanded, "auto");
    }


    function playVideo(video: HTMLVideoElement | null) {
        // Selection is a user gesture. If playback is denied, native controls remain usable.
        if (video) void video.play().catch(() => { /* No unhandled rejection on denial or rapid switching. */ });
    }

    const selectMedia = useCallback((index: number) => {
        pauseVideo(inlineVideoRef.current);
        pauseVideo(expandedVideoRef.current);
        modalStartRef.current = null;
        inlineReturnRef.current = null;
        // Mount the selected player before play(), within the original click/key gesture.
        flushSync(() => setActiveIndex(index));
        if (media[index]?.type === "video") {
            playVideo(isExpanded ? expandedVideoRef.current : inlineVideoRef.current);
        }
    }, [isExpanded, media]);

    const closeLightbox = useCallback(() => {
        inlineReturnRef.current = pauseVideo(expandedVideoRef.current);
        pauseVideo(inlineVideoRef.current);
        restoreVideoPosition(inlineVideoRef.current, inlineReturnRef);
        modalStartRef.current = null;
        setIsExpanded(false);
    }, []);

    const showPreviousMedia = () => selectMedia((activeIndex - 1 + media.length) % media.length);
    const showNextMedia = () => selectMedia((activeIndex + 1) % media.length);

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

            // Switching media types can unmount the original opener.
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
                closeLightbox();
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

            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                return;
            }

            const target = event.target;

            // Native media controls retarget keyboard events to the video/audio element.
            if (event.defaultPrevented ||
                !(target instanceof Element) ||
                !dialogRef.current?.contains(target) ||
                target.closest(
                    'video, audio, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="combobox"], [role="listbox"], [role="textbox"]',
                )) {
                return;
            }

            if (media.length < 2) {
                return;
            }

            event.preventDefault();

            selectMedia(event.key === "ArrowLeft"
                ? (activeIndex - 1 + media.length) % media.length
                : (activeIndex + 1) % media.length);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeIndex, isExpanded, media.length, closeLightbox, selectMedia]);

    if (!activeMedia) {
        return null;
    }

    return (
        <section ref={galleryRef}>
            <div>

                <h2 className="font-heading text-(length:--font-size-section-mobile) font-black leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
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
                                sizes={galleryPreviewSizes}
                                className="object-contain"
                            />
                        </button>
                    ) : (
                        <video
                            ref={inlineVideoRef}
                            key={activeMedia.src}
                            onLoadedMetadata={(event) => restoreVideoPosition(event.currentTarget, inlineReturnRef)}
                            onCanPlay={(event) => restoreVideoPosition(event.currentTarget, inlineReturnRef)}
                            src={activeMedia.src}
                            poster={activeMedia.thumbnail}
                            controls
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full bg-black object-contain"
                        />
                    )}
                </div>

                {activeMedia.type === "video" && (
                    <button
                        type="button"
                        onClick={(event) => {
                            openerRef.current = event.currentTarget;
                            inlineReturnRef.current = null;
                            modalStartRef.current = pauseVideo(inlineVideoRef.current);
                            flushSync(() => setIsExpanded(true));
                            playVideo(expandedVideoRef.current);
                        }}
                        className="mt-(--space-12) rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                        {labels.expand}
                    </button>
                )}

                {media.length > 1 && (
                    <div className="mt-(--space-12) flex gap-(--space-8) overflow-x-auto pb-(--space-4)">
                        {media.map((item, index) => {
                            const isActive = index === activeIndex;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectMedia(index)}
                                    onPointerEnter={() => prepareMedia(index)}
                                    onFocus={() => prepareMedia(index)}
                                    onPointerDown={event => { if (event.isPrimary && event.button === 0) prepareMedia(index); }}
                                    aria-label={`${labels.select} ${index + 1}`}
                                    aria-pressed={isActive}
                                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-(--radius-control) border bg-app-surface-elevated motion-safe:transition-colors motion-safe:duration-(--motion-fast) focus-visible:border-app-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent ${isActive
                                        ? "border-app-accent outline-2 -outline-offset-2 outline-app-accent"
                                        : "border-app-border hover:border-app-accent/60"
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
                                        <>
                                            {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="96px" className="object-cover" />}
                                            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/20 text-(length:--font-size-card-mobile) text-white [text-shadow:0_1px_4px_#000]">▶</span>
                                        </>
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
                    onPointerDown={(event) => { backdropPointerDown.current = event.target === event.currentTarget; }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget && backdropPointerDown.current) closeLightbox();
                        backdropPointerDown.current = false;
                    }}
                    className="fixed inset-0 z-50 grid grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-(--space-16) bg-app-background/95 p-(--space-20) md:grid-cols-[auto_minmax(0,1fr)_auto] md:grid-rows-[auto_minmax(0,1fr)] md:p-(--space-40)"
                >
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={closeLightbox}
                        className="col-span-2 col-start-1 row-start-1 justify-self-end md:col-span-3 rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                        {labels.close} ×
                    </button>

                    {media.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={showPreviousMedia}
                                onPointerEnter={() => prepareMedia((activeIndex - 1 + media.length) % media.length)}
                                onFocus={() => prepareMedia((activeIndex - 1 + media.length) % media.length)}
                                aria-label={labels.previous}
                                className="col-start-1 row-start-3 justify-self-end md:row-start-2 md:justify-self-center rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-12) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                ←
                            </button>

                            <button
                                type="button"
                                onClick={showNextMedia}
                                onPointerEnter={() => prepareMedia((activeIndex + 1) % media.length)}
                                onFocus={() => prepareMedia((activeIndex + 1) % media.length)}
                                aria-label={labels.next}
                                className="col-start-2 row-start-3 justify-self-start md:col-start-3 md:row-start-2 md:justify-self-center rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-12) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                →
                            </button>
                        </>
                    )}

                    <div className="pointer-events-none col-span-2 col-start-1 row-start-2 flex h-full w-full max-w-7xl min-h-0 min-w-0 items-center justify-self-center justify-center md:col-span-1 md:col-start-2">
                        {activeMedia.type === "image" ? (
                            <Image
                                src={activeMedia.src}
                                alt={activeMedia.alt}
                                width={activeMedia.width ?? 1600}
                                height={activeMedia.height ?? 900}
                                sizes="100vw"
                                className="pointer-events-auto max-h-full w-auto max-w-full object-contain"
                            />
                        ) : (
                            <video
                                ref={expandedVideoRef}
                                key={activeMedia.src}
                                onLoadedMetadata={(event) => restoreVideoPosition(event.currentTarget, modalStartRef)}
                                onCanPlay={(event) => restoreVideoPosition(event.currentTarget, modalStartRef)}
                                src={activeMedia.src}
                                poster={activeMedia.thumbnail}
                                controls
                                playsInline
                                className="pointer-events-auto max-h-full max-w-full"
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
