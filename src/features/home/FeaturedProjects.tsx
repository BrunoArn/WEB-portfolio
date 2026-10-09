"use client";

import type { Project } from "@/content/types/project";
import type { Locale } from "@/i18n/config";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type FeaturedProjectsProps = {
  projects: Project[];
  locale: Locale;
  eyebrow: string;
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  selectProjectLabel: string;
};

export function FeaturedProjects({
  projects,
  locale,
  eyebrow,
  title,
  viewAllLabel,
  viewAllHref,
  selectProjectLabel,
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
        <div className="grid lg:min-h-105 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:min-h-100 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Link
            key={`cover-${project.slug}`}
            href={`/${locale}/projects/${project.slug}`}
            aria-label={project.title}
            className="featured-project-enter relative block h-64 overflow-hidden bg-app-surface-elevated focus-visible:outline-none after:pointer-events-none after:absolute after:inset-1 after:z-10 after:content-[''] focus-visible:after:outline-4 focus-visible:after:outline-offset-0 focus-visible:after:outline-app-accent lg:h-auto"
          >
            <Image
              src={project.cover.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 800px, (min-width: 1024px) calc(60vw - 48px), (min-width: 768px) calc(100vw - 80px), calc(100vw - 40px)"
              className="object-cover"
            />
          </Link>
          {/* painel */}
          <div className="flex min-h-100 min-w-0 flex-col p-(--panel-padding-mobile) sm:min-h-85 md:p-(--panel-padding) lg:min-h-105 xl:min-h-100">
            <div className="grid">
              {projects.map((featuredProject, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={`details-${featuredProject.slug}`}
                    aria-hidden={!isActive}
                    className={`col-start-1 row-start-1 transition-opacity duration-(--motion-featured) motion-reduce:transition-none ${isActive
                      ? "visible opacity-100"
                      : "invisible pointer-events-none opacity-0"
                      }`}
                  >
                    <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-accent">
                      {featuredProject.categories[0]?.name}
                    </p>

                    <h3 className="mt-(--space-12) text-(length:--font-size-card-mobile) font-semibold leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                      <Link
                        href={`/${locale}/projects/${featuredProject.slug}`}
                        className="rounded-(--radius-control) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                      >
                        {featuredProject.title}
                      </Link>
                    </h3>

                    <p className="mt-(--space-12) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                      {featuredProject.description}
                    </p>

                    <p className="mt-(--space-12) text-(length:--font-size-label) leading-(--line-height-label) text-app-text-secondary">
                      {featuredProject.technologies.join(" · ")} · {featuredProject.year}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* thumbnails */}
            {projects.length > 1 && (
              <div className="mt-auto flex min-w-0 max-w-full shrink-0 gap-(--space-8) overflow-x-auto px-1 pb-1 pt-(--space-24)">
                {projects.map((featuredProject, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={featuredProject.slug}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      aria-label={`${selectProjectLabel}: ${featuredProject.title}`}
                      aria-pressed={isActive}
                      className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-(--radius-control) border transition-colors duration-(--motion-fast) 
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${isActive
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