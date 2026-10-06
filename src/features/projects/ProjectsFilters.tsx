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
            aria-label={ariaLabel}
            className="flex min-w-0 gap-(--space-8) overflow-x-auto"
        >
            <button
                type="button"
                aria-pressed={activeFilter === "all"}
                onClick={() => onFilterChange("all")}
                className={`min-h-10 shrink-0 rounded-(--radius-control) px-(--space-16) text-(length:--font-size-label) font-medium uppercase transition-colors duration-(--motion-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent ${activeFilter === "all"
                    ? "bg-app-accent text-app-background"
                    : "bg-app-surface-elevated text-app-text-primary hover:bg-app-surface"
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
                        className={`min-h-10 shrink-0 rounded-(--radius-control) px-(--space-16) text-(length:--font-size-label) font-medium uppercase transition-colors duration-(--motion-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent ${isActive
                            ? "bg-app-accent text-app-background"
                            : "bg-app-surface-elevated text-app-text-primary hover:bg-app-surface"
                            }`}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}