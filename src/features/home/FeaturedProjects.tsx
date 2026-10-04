import type { Project } from "@/content/types/project";

import Image from "next/image";
import Link from "next/link";

type FeaturedProjectsProps = {
  projects: Project[];
  eyebrow: string;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
};

export function FeaturedProjects({
  projects,
  eyebrow,
  title,
  viewAllLabel,
  viewAllHref,
}: FeaturedProjectsProps) {

  if (projects.length === 0) {
    return null;
  }
  const project = projects[0];

  return (
    <section className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
      <header className="mb-(--space-20)">
        <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
          {eyebrow}
        </p>

        <div className="mt-(--space-8) flex items-end justify-between gap-(--space-16)">
          <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
            {title}
          </h2>

          <Link
            href={viewAllHref}
            className="shrink-0 text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-primary transition-colors duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            {viewAllLabel} ↗
          </Link>
        </div>
      </header>

      <article className="overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface">
        <div className="grid md:grid-cols-[2fr_1fr]">
          <div className="relative min-h-64 overflow-hidden bg-app-surface-elevated md:min-h-90">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="p-(--panel-padding-mobile) md:p-(--panel-padding)">
            <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
              {project.categories[0]?.name}
            </p>

            <h3 className="mt-(--space-12) text-(length:--font-size-card-mobile) font-semibold leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
              {project.title}
            </h3>

            <p className="mt-(--space-12) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
              {project.description}
            </p>

            <p className="mt-(--space-12) text-(length:--font-size-label) leading-(--line-height-label) text-app-text-secondary">
              {project.technologies.join(" · ")} · {project.year}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}