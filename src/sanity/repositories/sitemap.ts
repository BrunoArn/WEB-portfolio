import { adaptAbout } from "@/content/adapters/about";
import { canRenderCategories, canRenderProjectCards, isRenderable } from "../../content/adapters/availability";
import { adaptProject } from "@/content/adapters/project";
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

export function getSitemapAvailability({ sitemapProjects, about, categories }: SitemapInventory) {
    const cardsAvailable = locales.filter((locale) =>
        canRenderProjectCards(sitemapProjects, locale),
    );
    const projectLists = cardsAvailable.filter((locale) =>
        canRenderCategories(categories, locale),
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
