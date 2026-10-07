"use client";

import type { ProjectImage } from "@/content/types/project";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ProjectPlayableProps = {
    source: string;
    projectTitle: string;
    width: number;
    height: number;
    poster: ProjectImage;

    labels: Readonly<{
        title: string;
        frameTitle: string;
        start: string;
        close: string;
    }>;
};

export function ProjectPlayable({
    source,
    projectTitle,
    width,
    height,
    poster,
    labels,
}: ProjectPlayableProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const playButtonRef = useRef<HTMLButtonElement>(null);
    const hasStartedRef = useRef(false);

    // Move focus only after PLAY/CLOSE, leaving the initial page focus alone.
    useEffect(() => {
        if (isPlaying) {
            hasStartedRef.current = true;
            closeButtonRef.current?.focus();
        } else if (hasStartedRef.current) {
            playButtonRef.current?.focus();
        }
    }, [isPlaying]);

    return (
        <section id="playable" className="scroll-mt-(--space-80)">
            <div className="mb-(--space-20) flex items-end justify-between gap-(--space-16)">
                <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
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
                    aspectRatio: `${width} / ${height}`,
                }}
                className="relative overflow-hidden rounded-(--radius-large) border border-app-border bg-black"
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

                        <div className="absolute inset-0 flex items-center justify-center p-(--space-20)">
                            <button
                                ref={playButtonRef}
                                type="button"
                                onClick={() => setIsPlaying(true)}
                                className="rounded-(--radius-control) bg-app-accent px-(--space-24) py-(--space-12) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-background motion-safe:transition-opacity motion-safe:duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                ▶ {labels.start}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}