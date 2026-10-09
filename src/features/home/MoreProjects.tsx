import type { Project } from "@/content/types/project";
import type { Locale } from "@/i18n/config";

import Image from "next/image";
import Link from "next/link";

type MoreProjectsProps = {
    projects: Project[];
    locale: Locale;
    title: string;
    viewAllLabel: string;
    viewAllHref: string;
};

export function MoreProjects({
    projects,
    locale,
    title,
    viewAllLabel,
    viewAllHref,
}: MoreProjectsProps) {

    if (projects.length === 0) {
        return null;
    }

    return (
        <section className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
            <header className="mb-(--space-20) flex items-end justify-between gap-(--space-16)">
                <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                    {title}
                </h2>

                <Link
                    href={viewAllHref}
                    className="shrink-0 text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary transition-colors duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                >
                    {viewAllLabel} ↗
                </Link>
            </header>

            <div className="grid grid-cols-1 gap-(--card-gap) md:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 6).map((project) => (
                    <Link
                        key={project.slug}
                        href={`/${locale}/projects/${project.slug}`}
                        className="group block overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface transition-colors duration-(--motion-ui) hover:border-app-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    >
                        <div className="relative aspect-video overflow-hidden bg-app-surface-elevated">
                            <Image
                                src={project.cover.src}
                                alt={project.cover.alt}
                                fill
                                sizes="(min-width: 1280px) 387px, (min-width: 1024px) calc(33.333vw - 40px), (min-width: 768px) calc(50vw - 50px), calc(100vw - 40px)"
                                className="object-cover motion-safe:transition-transform motion-safe:duration-(--motion-ui) motion-safe:group-hover:scale-[1.03]"
                            />
                        </div>

                        <div className="p-(--card-padding)">
                            <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
                                {project.categories[0]?.name}
                            </p>

                            <h3 className="mt-(--space-8) text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
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