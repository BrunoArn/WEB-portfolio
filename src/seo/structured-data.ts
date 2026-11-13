import type { About } from "../content/types/about";
import type { Project } from "../content/types/project";
import { locales, type Locale } from "../i18n/config";
import { getCanonicalOrigin, getPublicAlternates } from "./international";

const context = "https://schema.org";

function websiteId(origin: string) {
    return origin + "/#website";
}

function httpsUrl(value: string | undefined): value is string {
    if (!value || !/^https:\/\//i.test(value) || /[\s\\]/.test(value)) return false;
    try {
        const url = new URL(value);
        return !url.username && !url.password;
    } catch {
        return false;
    }
}

export function getWebsiteJsonLd(name: string, configuredOrigin = process.env.SEO_CANONICAL_ORIGIN) {
    const origin = getCanonicalOrigin(configuredOrigin);
    if (!origin) return undefined;

    return {
        "@context": context,
        "@type": "WebSite",
        "@id": websiteId(origin),
        name,
        url: origin + "/",
        inLanguage: locales,
    };
}

export function getProfileJsonLd(
    locale: Locale,
    name: string,
    about: Pick<About, "name" | "introduction" | "githubUrl" | "linkedinUrl" | "itchUrl">,
    configuredOrigin = process.env.SEO_CANONICAL_ORIGIN,
) {
    const origin = getCanonicalOrigin(configuredOrigin);
    if (!origin) return undefined;
    const { alternates } = getPublicAlternates(locale, { route: "about" }, false, origin);
    const canonical = alternates?.canonical;
    if (typeof canonical !== "string") return undefined;

    const personId = origin + "/#person";
    const profiles = [...new Set([about.githubUrl, about.linkedinUrl, about.itchUrl].filter(httpsUrl))];

    return {
        "@context": context,
        "@graph": [
            {
                "@type": "ProfilePage",
                "@id": canonical + "#webpage",
                url: canonical,
                name,
                inLanguage: locale,
                isPartOf: { "@id": websiteId(origin) },
                mainEntity: { "@id": personId },
            },
            {
                "@type": "Person",
                "@id": personId,
                name: about.name,
                description: about.introduction,
                ...(profiles.length > 0 && { sameAs: profiles }),
            },
        ],
    };
}

export function getProjectJsonLd(
    locale: Locale,
    siteName: string,
    project: Pick<Project, "slug" | "title" | "description" | "cover" | "role" | "team">,
    configuredOrigin = process.env.SEO_CANONICAL_ORIGIN,
) {
    const origin = getCanonicalOrigin(configuredOrigin);
    if (!origin) return undefined;
    const { alternates } = getPublicAlternates(locale, { route: "project", slug: project.slug }, false, origin);
    const canonical = alternates?.canonical;
    if (typeof canonical !== "string") return undefined;

    const workId = origin + "/#project-" + encodeURIComponent(project.slug);
    const teamIncludesOwner = project.team.some((member) => member.name === siteName);
    const credits = [
        ...(teamIncludesOwner ? [] : [siteName + " — " + project.role]),
        ...project.team.map(({ name, role }) => name + " — " + role),
    ];

    return {
        "@context": context,
        "@graph": [
            {
                "@type": "WebPage",
                "@id": canonical + "#webpage",
                url: canonical,
                name: project.title,
                inLanguage: locale,
                isPartOf: { "@id": websiteId(origin) },
                mainEntity: { "@id": workId },
            },
            {
                "@type": "CreativeWork",
                "@id": workId,
                name: project.title,
                description: project.description,
                ...(httpsUrl(project.cover.src) && { image: project.cover.src }),
                creditText: [...new Set(credits)],
            },
        ],
    };
}

export function serializeJsonLd(data: object) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}