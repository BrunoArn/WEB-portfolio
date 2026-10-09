"use client";

import type { Category } from "@/content/types/category";
import type { Project } from "@/content/types/project";

import { useState } from "react";

import { ProjectsFilters } from "./ProjectsFilters";
import { ProjectsGrid } from "./ProjectsGrid";
import type { Locale } from "@/i18n/config";

type ProjectsListingProps = {
    projects: Project[];
    categories: Category[];
    locale: Locale;
    allLabel: string;
    filtersLabel: string;
    emptyLabel: string;
};

export function ProjectsListing({
    projects,
    categories,
    locale,
    allLabel,
    filtersLabel,
    emptyLabel,
}: ProjectsListingProps) {

    const [activeFilter, setActiveFilter] = useState("all");

    const filteredProjects =
        activeFilter === "all"
            ? projects
            : projects.filter((project) =>
                project.categories.some(
                    (category) => category.slug === activeFilter,
                ),
            );

    return (
        <>
            <ProjectsFilters
                categories={categories}
                allLabel={allLabel}
                ariaLabel={filtersLabel}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            <div className="mt-(--space-8) lg:col-span-2">
                {filteredProjects.length > 0 ? (
                    <ProjectsGrid
                        projects={filteredProjects}
                        locale={locale}
                    />
                ) : (
                    <p className="text-(length:--font-size-body) leading-(--line-height-body) text-app-text-secondary">
                        {emptyLabel}
                    </p>
                )}
            </div>
        </>
    );
}