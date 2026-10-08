import type { ProjectMedia } from "@/content/types/project";

import Image from "next/image";

type ProjectGalleryProps = {
    media: ProjectMedia[];
    title: string;
};

export function ProjectGallery({
    media,
    title,
}: ProjectGalleryProps) {
    if (media.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                {title}
            </h2>

            <div className="mt-(--space-20) grid gap-(--card-gap)">
                {media.map((item) => (
                    <div
                        key={item.id}
                        className="overflow-hidden rounded-(--radius-large) border border-app-border bg-app-surface-elevated"
                    >
                        {item.type === "image" ? (
                            <Image
                                src={item.src}
                                alt={item.alt}
                                width={item.width ?? 1600}
                                height={item.height ?? 900}
                                sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
                                className="h-auto w-full"
                            />
                        ) : (
                            <video
                                src={item.src}
                                controls
                                preload="metadata"
                                className="aspect-video w-full bg-black object-contain"
                            />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}