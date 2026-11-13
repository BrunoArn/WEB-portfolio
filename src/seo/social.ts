import type { Metadata } from "next";
import type { ProjectImage } from "../content/types/project";
import type { Locale } from "../i18n/config";
import { institutionalOgCopy, type InstitutionalOgPage } from "../i18n/institutional-og";

const openGraphLocales = { pt: "pt_BR", en: "en_US" } satisfies Record<Locale, string>;

function coverImage(cover?: ProjectImage) {
    if (!cover?.src || !/^https:\/\//i.test(cover.src) || /[\s\\?#]/.test(cover.src)) return undefined;
    let url: URL;
    try {
        url = new URL(cover.src);
    } catch {
        return undefined;
    }
    if (
        !url || url.origin !== "https://cdn.sanity.io" ||
        url.username || url.password || url.search || url.hash ||
        !url.pathname.startsWith("/images/")
    ) return undefined;

    return {
        url: cover.src,
        alt: cover.alt,
        width: cover.width,
        height: cover.height,
    };
}

type SocialPage = Pick<Metadata, "alternates"> & {
    title: string | { absolute: string };
    description: string;
};

export function getSocialMetadata(
    page: SocialPage,
    locale: Locale,
    imagePage: InstitutionalOgPage,
    siteName: string,
    cover?: ProjectImage,
): Pick<Metadata, "openGraph" | "twitter"> {
    const canonical = page.alternates?.canonical;
    if (typeof canonical !== "string") return {};

    const copy = institutionalOgCopy[locale][imagePage];
    const image = coverImage(cover) ?? {
        url: new URL(`/api/og/institutional/${locale}/${imagePage}`, canonical).href,
        width: 1200,
        height: 630,
        alt: `${copy.title} · ${copy.subtitle}`,
    };
    const title = typeof page.title === "string" ? `${page.title} | ${siteName}` : page.title.absolute;
    const { description } = page;

    return {
        openGraph: {
            type: "website",
            title,
            description,
            url: canonical,
            locale: openGraphLocales[locale],
            images: [image],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}