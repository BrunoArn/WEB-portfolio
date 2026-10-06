import type { Project } from "@/content/types/project";

import Image from "next/image";

type ProjectsGridProps = {
    projects: Project[];
};

export function ProjectsGrid({
    projects,
}: ProjectsGridProps) {
    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-(--card-gap) md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <article
                    key={project.slug}
                    className="group overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface motion-safe:transition-colors motion-safe:duration-(--motion-ui) hover:border-app-text-secondary"
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

                        <h2 className="mt-(--space-8) text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                            {project.title}
                        </h2>

                        <p className="mt-(--space-8) text-(length:--font-size-label) leading-(--line-height-label) text-app-text-secondary">
                            {project.role} · {project.year}
                        </p>
                    </div>
                </article>
            ))}
        </div>
    );
}