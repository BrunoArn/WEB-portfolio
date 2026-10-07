"use client";

import type { ProjectMedia } from "@/content/types/project";

import { useState } from "react";
import Image from "next/image";

type ProjectMediaPreviewProps = {
    media: ProjectMedia[];
    selectMediaLabel: string;
};

export function ProjectMediaPreview({
    media,
    selectMediaLabel,
}: ProjectMediaPreviewProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const activeMedia = media[activeIndex] ?? media[0];

    if (!activeMedia) {
        return null;
    }

    return (
        <section>
            <div className="overflow-hidden rounded-(--radius-large) border border-app-border bg-app-surface-elevated">
                {activeMedia.type === "image" ? (
                    <div className="relative aspect-video">
                        <Image
                            src={activeMedia.src}
                            alt={activeMedia.alt}
                            fill
                            sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
                            className="object-cover"
                        />
                    </div>
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
                                aria-label={`${selectMediaLabel} ${index + 1}`}
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
        </section>
    );
}