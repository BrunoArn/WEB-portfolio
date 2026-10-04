"use client";

import type { Project } from "@/content/types/project";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

  const [activeIndex, setActiveIndex] = useState(0);

  if (projects.length === 0) {
    return null;
  }

  const project = projects[activeIndex];

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
      {/* cover */}
      <article className="overflow-hidden rounded-(--radius-card) border border-app-border bg-app-surface">
        <div className="grid md:h-100 md:grid-cols-[2fr_1fr]">
          <div className="relative min-h-64 overflow-hidden bg-app-surface-elevated md:min-h-0">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover"
            />
          </div>
          {/* painel */}
          <div className="flex flex-col p-(--panel-padding-mobile) md:p-(--panel-padding)">
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
            {/* thumbnails */}
            {projects.length > 1 && (
              <div className="mt-auto flex gap-(--space-8) overflow-x-auto pt-(--space-24) snap-x snap-mandatory">
                {projects.map((featuredProject, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={featuredProject.slug}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`Selecionar ${featuredProject.title}`}
                      aria-pressed={isActive}
                      className={`relative h-14 w-20 shrink-0 snap-start overflow-hidden rounded-(--radius-control) border transition-colors duration-(--motion-fast) ${isActive
                        ? "border-app-accent"
                        : "border-app-border hover:border-app-text-secondary"
                        }`}
                    >
                      <Image
                        src={featuredProject.cover.src}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}