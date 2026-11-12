import { adaptAbout } from "@/content/adapters/about";
import { adaptCategory } from "@/content/adapters/category";
import { adaptProject, adaptProjectCard } from "@/content/adapters/project";
import { locales, type Locale } from "@/i18n/config";
import { sanityCacheOptions } from "@/sanity/cache";
import { sanityClient } from "@/sanity/client";
import { aboutQuery } from "@/sanity/queries/about";
import { projectProjection } from "@/sanity/queries/project";
import { categoriesQuery } from "@/sanity/repositories/categories";
import type { SanityAbout } from "@/sanity/types/about";
import type { SanityCategory } from "@/sanity/types/category";
import type { SanityProject } from "@/sanity/types/project";

const sitemapInventoryQuery = `{
    "sitemapProjects": *[_type == "project"] | order(slug.current asc) {
        ${projectProjection}
    },
    "about": ${aboutQuery},
    "categories": ${categoriesQuery}
}`;

export type SitemapInventory = {
    sitemapProjects: SanityProject[];
    about: SanityAbout | null;
    categories: SanityCategory[];
};

// Only synchronous adapter failures describe unavailable page content.
// Query failures must reach the route so it never serves a partial inventory as a success.
function isRenderable(adapt: () => unknown): boolean {
    try {
        adapt();
        return true;
    } catch {
        return false;
    }
}

export function getSitemapAvailability({ sitemapProjects, about, categories }: SitemapInventory) {
    const cardsAvailable = locales.filter((locale) =>
        sitemapProjects.every((project) => isRenderable(() => adaptProjectCard(project, locale))),
    );
    const projectLists = cardsAvailable.filter((locale) =>
        categories.every((category) => isRenderable(() => adaptCategory(category, locale))),
    );
    const aboutLocales = locales.filter((locale) =>
        about !== null && isRenderable(() => adaptAbout(about, locale)),
    );

    const details = new Map<string, Locale[]>();
    const slugCounts = new Map<string, number>();
    for (const { slug } of sitemapProjects) {
        if (typeof slug?.current === "string") {
            slugCounts.set(slug.current, (slugCounts.get(slug.current) ?? 0) + 1);
        }
    }

    for (const project of sitemapProjects) {
        const slug = project.slug?.current;
        // Ambiguous slugs cannot be matched to a single published detail.
        if (!slug || slugCounts.get(slug) !== 1) continue;
        const available = cardsAvailable.filter((locale) => isRenderable(() => adaptProject(project, locale)));
        if (available.length) details.set(slug, available);
    }

    return { projectLists, aboutLocales, details };
}

export async function getSitemapInventory(): Promise<SitemapInventory> {
    return sanityClient.withConfig({ perspective: "published" }).fetch<SitemapInventory>(
        sitemapInventoryQuery,
        {},
        sanityCacheOptions("projects", "categories", "about"),
    );
}