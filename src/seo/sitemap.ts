import type { MetadataRoute } from "next";
import { locales, type Locale } from "../i18n/config";
import { getCanonicalOrigin, getIndexingMetadata, getPublicAlternates } from "./international";

export function getSitemapOrigin(
    configuredOrigin = process.env.SEO_CANONICAL_ORIGIN,
    enabled = process.env.SEO_INDEXING_ENABLED,
): string | undefined {
    const origin = getCanonicalOrigin(configuredOrigin);
    const { robots } = getIndexingMetadata(origin, enabled);
    return typeof robots === "object" && robots?.index ? origin : undefined;
}

type Availability = {
    projectLists: readonly Locale[];
    aboutLocales: readonly Locale[];
    details: ReadonlyMap<string, readonly Locale[]>;
};

export function createSitemap(origin: string, availability: Availability): MetadataRoute.Sitemap {
    const entries: MetadataRoute.Sitemap = [];

    function add(page: Parameters<typeof getPublicAlternates>[1], available: readonly Locale[]) {
        for (const locale of available) {
            const { alternates } = getPublicAlternates(locale, page, available.length > 1, origin);
            if (typeof alternates?.canonical === "string") {
                entries.push({
                    url: alternates.canonical,
                    alternates: { languages: alternates.languages as Record<string, string> },
                });
            }
        }
    }

    add({ route: "home" }, locales);
    add({ route: "projects" }, availability.projectLists);
    add({ route: "about" }, availability.aboutLocales);
    for (const [slug, available] of availability.details) {
        add({ route: "project", slug }, available);
    }

    return entries;
}