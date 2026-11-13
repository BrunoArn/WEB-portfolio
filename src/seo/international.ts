import type { Metadata } from "next";
import type { Locale } from "../i18n/config";
import { MissingLocalizedValueError } from "../content/adapters/localization";

export function getCanonicalOrigin(value: string | undefined): string | undefined {
    const input = value?.trim();
    if (!input || !/^https:\/\/[^/\s\\?#@]+\/*$/i.test(input)) return undefined;

    let url: URL;
    try {
        url = new URL(input);
    } catch {
        return undefined;
    }

    const host = url.hostname.replace(/\.$/, "");
    if (
        !host.includes(".") ||
        !host.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ||
        /^(?:\d+\.){3}\d+$/.test(host) ||
        /(?:^|\.)(?:localhost|railway\.app|r2\.dev)$/.test(host)
    ) return undefined;

    return url.origin;
}

export function getIndexingMetadata(
    origin = getCanonicalOrigin(process.env.SEO_CANONICAL_ORIGIN),
    enabled = process.env.SEO_INDEXING_ENABLED,
): Pick<Metadata, "robots"> {
    return { robots: { index: Boolean(origin && enabled === "true"), follow: true } };
}

type PublicPage =
    | { route: "home" | "projects" | "about" }
    | { route: "project"; slug: string };

export function getPublicAlternates(
    locale: Locale,
    page: PublicPage,
    hasTranslation = true,
    origin = getCanonicalOrigin(process.env.SEO_CANONICAL_ORIGIN),
): Pick<Metadata, "alternates"> {
    if (!origin) return {};
    if (page.route === "project" && ["", ".", ".."].includes(page.slug)) return {};

    const suffix = page.route === "project"
        ? "/projects/" + encodeURIComponent(page.slug)
        : page.route === "home" ? "" : "/" + page.route;
    const canonical = origin + "/" + locale + suffix;
    const alternate = otherLocale(locale);

    return {
        alternates: {
            canonical,
            languages: {
                [locale]: canonical,
                ...(hasTranslation ? { [alternate]: origin + "/" + alternate + suffix } : {}),
            },
        },
    };
}

export function otherLocale(locale: Locale): Locale {
    return locale === "pt" ? "en" : "pt";
}

export async function hasLocalizedPage(load: () => Promise<unknown>): Promise<boolean> {
    try {
        return (await load()) != null;
    } catch (error) {
        if (error instanceof MissingLocalizedValueError) return false;
        throw error;
    }
}
