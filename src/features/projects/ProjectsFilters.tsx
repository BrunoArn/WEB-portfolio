"use client";

import type { Category } from "@/content/types/category";

type ProjectsFiltersProps = {
    categories: Category[];
    allLabel: string;
    ariaLabel: string;
    activeFilter: string;
    onFilterChange: (filter: string) => void;
};

export function ProjectsFilters({
    categories,
    allLabel,
    ariaLabel,
    activeFilter,
    onFilterChange,
}: ProjectsFiltersProps) {

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="flex min-w-0 gap-(--space-8) overflow-x-auto"
        >
            <button
                type="button"
                aria-pressed={activeFilter === "all"}
                onClick={() => onFilterChange("all")}
                className={`min-h-10 shrink-0 rounded-(--radius-control) px-(--space-16) text-(length:--font-size-label) font-medium uppercase transition-colors duration-(--motion-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${activeFilter === "all"
                    ? "bg-app-accent text-app-background focus-visible:ring-app-background"
                    : "bg-app-surface-elevated text-app-text-primary hover:bg-app-surface focus-visible:ring-app-accent"
                    }`}
            >
                {allLabel}
            </button>

            {categories.map((category) => {
                const isActive = activeFilter === category.slug;

                return (
                    <button
                        key={category.slug}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onFilterChange(category.slug)}
                        className={`min-h-10 shrink-0 rounded-(--radius-control) px-(--space-16) text-(length:--font-size-label) font-medium uppercase transition-colors duration-(--motion-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${isActive
                            ? "bg-app-accent text-app-background focus-visible:ring-app-background"
                            : "bg-app-surface-elevated text-app-text-primary hover:bg-app-surface focus-visible:ring-app-accent"
                            }`}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}