import type { Project } from "@/content/types/project";

import Image from "next/image";

type ProjectHeroProps = {
    project: Project;
    actions: Readonly<{
        play: string;
        github: string;
        liveSite: string;
    }>;

    hasPlayable: boolean;
};

export function ProjectHero({
    project,
    actions,
    hasPlayable,
}: ProjectHeroProps) {

    return (
        <section>
            <div className="overflow-hidden rounded-(--radius-large) border border-app-border bg-app-surface">
                {/* The shared grid cell keeps 16:9 as a minimum while allowing the overlay to grow. */}
                <div className="relative aspect-video overflow-hidden bg-app-surface-elevated md:grid md:aspect-auto md:before:col-start-1 md:before:row-start-1 md:before:pt-[56.25%]">
                    <Image
                        src={project.cover.src}
                        alt={project.cover.alt}
                        fill
                        priority
                        sizes="(min-width: 1280px) 1280px, (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
                        className="object-cover"
                    />

                    <div
                        aria-hidden="true"
                        className="absolute inset-0 hidden bg-linear-to-t from-app-background/95 via-app-background/30 to-transparent md:block"
                    />

                    <div className="relative hidden p-(--space-40) md:col-start-1 md:row-start-1 md:block md:self-end">
                        <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
                            {project.categories[0]?.name}
                        </p>

                        <h1 className="mt-(--space-8) max-w-4xl text-(length:--font-size-hero-desktop) font-semibold leading-(--line-height-hero) text-app-text-primary">
                            {project.title}
                        </h1>

                        <p className="mt-(--space-12) wrap-anywhere text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                            {project.role} · {project.year}
                        </p>

                        {(hasPlayable || project.liveSiteUrl || project.githubUrl) && (
                            <div className="mt-(--space-24) flex flex-wrap gap-(--space-8)">
                                {hasPlayable && (
                                    <a
                                        href="#playable"
                                        className="rounded-(--radius-control) bg-app-accent px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-background motion-safe:transition-opacity motion-safe:duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                    >
                                        ▶ {actions.play}
                                    </a>
                                )}

                                {project.liveSiteUrl && (
                                    <a
                                        href={project.liveSiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                    >
                                        {actions.liveSite} ↗
                                    </a>
                                )}

                                {project.githubUrl && (
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                    >
                                        {actions.github} ↗
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-(--panel-padding-mobile) md:hidden">
                    <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
                        {project.categories[0]?.name}
                    </p>

                    <h1 className="mt-(--space-8) text-(length:--font-size-hero-mobile) font-semibold leading-(--line-height-hero) text-app-text-primary">
                        {project.title}
                    </h1>

                    <p className="mt-(--space-12) wrap-anywhere text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                        {project.role} · {project.year}
                    </p>

                    {(hasPlayable || project.liveSiteUrl || project.githubUrl) && (
                        <div className="mt-(--space-24) flex flex-wrap gap-(--space-8)">
                            {hasPlayable && (
                                <a
                                    href="#playable"
                                    className="rounded-(--radius-control) bg-app-accent px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-background motion-safe:transition-opacity motion-safe:duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                >
                                    ▶ {actions.play}
                                </a>
                            )}

                            {project.liveSiteUrl && (
                                <a
                                    href={project.liveSiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                >
                                    {actions.liveSite} ↗
                                </a>
                            )}

                            {project.githubUrl && (
                                <a
                                    href={project.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-8) text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary motion-safe:transition-colors motion-safe:duration-(--motion-fast) hover:bg-app-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                >
                                    {actions.github} ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}