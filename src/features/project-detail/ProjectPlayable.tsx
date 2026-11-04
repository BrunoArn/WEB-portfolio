"use client";

import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./ProjectPlayable.module.css";

import type { ProjectImage } from "@/content/types/project";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";

type ProjectPlayableProps = {
    source: string;
    projectTitle: string;
    width: number;
    height: number;
    poster: ProjectImage;

    labels: Dictionary["projectDetail"]["playable"];
};

// Small screens or a primary touch-only input: keep the game as a desktop experience.
const desktopNoticeQuery = "(max-width: 760px), (hover: none) and (pointer: coarse)";

export function ProjectPlayable({
    source,
    projectTitle,
    width,
    height,
    poster,
    labels,
}: ProjectPlayableProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
    const [manualLink, setManualLink] = useState("");
    const copyButtonRef = useRef<HTMLButtonElement>(null);

    // Match the CSS policy and unload an active game when desktop controls disappear.
    useEffect(() => {
        const query = window.matchMedia(desktopNoticeQuery);
        const stopOnMobile = () => { if (query.matches) setIsPlaying(false); };
        query.addEventListener("change", stopOnMobile);
        return () => query.removeEventListener("change", stopOnMobile);
    }, []);

    function startGame() {
        // Check at the action itself, including clicks replayed after hydration.
        if (!window.matchMedia(desktopNoticeQuery).matches) setIsPlaying(true);
    }

    async function copyProjectLink() {
        const url = new URL(window.location.pathname, window.location.origin).href;
        setCopyState("copying");
        try {
            await navigator.clipboard.writeText(url);
            setManualLink("");
            setCopyState("copied");
        } catch {
            setManualLink(url);
            setCopyState("failed");
        }
    }
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const playButtonRef = useRef<HTMLButtonElement>(null);
    const hasStartedRef = useRef(false);

    // Move focus only after PLAY/CLOSE, leaving the initial page focus alone.
    useEffect(() => {
        if (isPlaying) {
            hasStartedRef.current = true;
            const closeButton = closeButtonRef.current;
            closeButton?.focus({ preventScroll: true });

            if (closeButton) {
                const bounds = closeButton.getBoundingClientRect();
                const navbarBottom = Array.from(document.querySelectorAll("header"))
                    .reduce((bottom, header) => {
                        const headerBounds = header.getBoundingClientRect();
                        return getComputedStyle(header).position === "fixed" && headerBounds.height > 0
                            ? Math.max(bottom, headerBounds.bottom)
                            : bottom;
                    }, 0);
                const gap = parseFloat(getComputedStyle(closeButton).getPropertyValue("--space-8")) || 0;

                // Move only an obscured/offscreen control; leave visible focus in place.
                const scrollOffset = bounds.top < navbarBottom
                    ? bounds.top - navbarBottom - gap
                    : bounds.bottom > window.innerHeight
                        ? bounds.bottom - window.innerHeight + gap
                        : 0;

                if (scrollOffset !== 0) {
                    window.scrollBy({ top: scrollOffset, behavior: "instant" });
                }
            }
        } else if (hasStartedRef.current) {
            const target = window.matchMedia(desktopNoticeQuery).matches ? copyButtonRef : playButtonRef;
            target.current?.focus({ preventScroll: true });
        }
    }, [isPlaying]);

    return (
        <section id="playable" className="scroll-mt-(--space-80)">
            <div className="mb-(--space-20) flex items-end justify-between gap-(--space-16)">
                <h2 className="font-heading text-(length:--font-size-section-mobile) font-black leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                    {labels.title}
                </h2>

                {isPlaying && (
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setIsPlaying(false)}
                        className="-my-(--space-12) -mr-(--space-12) min-h-(--space-48) min-w-(--space-48) shrink-0 px-(--space-12) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                        {labels.close}
                    </button>
                )}
            </div>

            <div
                style={{
                    "--playable-aspect-ratio": `${width} / ${height}`,
                } as CSSProperties}
                className={[styles.frame, "relative overflow-hidden rounded-(--radius-large) border border-app-border bg-black"].join(" ")}
            >
                {isPlaying ? (
                    <iframe
                        src={source}
                        title={`${labels.frameTitle}: ${projectTitle}`}
                        allow="fullscreen; gamepad"
                        allowFullScreen
                        className="block h-full w-full border-0"
                    />
                ) : (
                    <>
                        <Image
                            src={poster.src}
                            alt=""
                            fill
                            sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
                            className="object-cover opacity-60"
                        />

                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-app-background/30"
                        />

                        <div className={`${styles.desktopPlay} absolute inset-0 items-center justify-center p-(--space-20)`}>
                            <button
                                ref={playButtonRef}
                                type="button"
                                onClick={startGame}
                                className="rounded-(--radius-control) bg-app-accent px-(--space-24) py-(--space-12) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-background motion-safe:transition-opacity motion-safe:duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                ▶ {labels.start}
                            </button>
                        </div>

                        <div className={[styles.mobileNotice, "relative flex-col items-center justify-center gap-(--space-12) p-(--space-20) text-center"].join(" ")}>
                            <h3 className="font-heading text-(length:--font-size-body) font-black leading-(--line-height-title) text-app-text-primary">
                                {labels.desktopTitle}
                            </h3>
                            <p className="w-full max-w-md text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                                {labels.desktopDescription}
                            </p>
                            <button
                                ref={copyButtonRef}
                                type="button"
                                onClick={() => { void copyProjectLink(); }}
                                disabled={copyState === "copying"}
                                aria-busy={copyState === "copying"}
                                className="rounded-(--radius-control) bg-app-accent px-(--space-24) py-(--space-12) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-background motion-safe:transition-opacity motion-safe:duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                {labels.copyLink}
                            </button>
                            <p role="status" className="w-full max-w-md text-(length:--font-size-label) leading-(--line-height-label) text-app-text-body">
                                {copyState === "copied" ? labels.linkCopied : copyState === "failed" ? labels.copyFailed : ""}
                            </p>
                            {manualLink && (
                                <input
                                    type="text"
                                    readOnly
                                    value={manualLink}
                                    aria-label={labels.projectLink}
                                    onFocus={(event) => event.currentTarget.select()}
                                    className="w-full max-w-md rounded-(--radius-control) border border-app-border bg-app-surface p-(--space-8) text-(length:--font-size-label) text-app-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}