import type { Project } from "@/content/types/project";

import Image from "next/image";
import Link from "next/link";

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
    if (projects.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                {title}
            </h2>

            <div className="mt-(--space-20) flex snap-x snap-mandatory gap-(--card-gap) overflow-x-auto pb-(--space-4)">
                {projects.map((project) => (
                    <Link
                        key={project.slug}
                        href={`/${locale}/projects/${project.slug}`}
                        className="group w-[82%] shrink-0 snap-start overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface motion-safe:transition-colors motion-safe:duration-(--motion-ui) hover:border-app-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent sm:w-[60%] md:w-[40%] lg:w-[calc((100%-60px)/4)]"
                    >
                        <div className="relative aspect-video overflow-hidden bg-app-surface-elevated">
                            <Image
                                src={project.cover.src}
                                alt={project.cover.alt}
                                fill
                                sizes="(min-width: 1024px) 280px, (min-width: 768px) 40vw, 82vw"
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