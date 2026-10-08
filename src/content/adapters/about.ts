
import type {
    About,
    AboutExperience,
    AboutEducation,
    AboutSkillGroup,
    AboutLanguage,
    AboutAchievement,
} from "@/content/types/about";

import type {
    SanityAbout,
    SanityAboutExperience,
    SanityAboutEducation,
    SanityAboutSkillGroup,
    SanityAboutLanguage,
    SanityAboutAchievement,
    SanityAboutFile,
} from "@/sanity/types/about";

import {
    resolveLocalizedValue,
    type ContentLanguage,
} from "./localization";

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function requireString(value: unknown, field: string): string {
    if (!isNonEmptyString(value)) {
        throw new Error("About Page is missing a valid " + field + ".");
    }
    return value;
}

function isValidEmail(value: unknown): value is string {
    if (!isNonEmptyString(value) || value.length > 254) return false;
    const parts = value.split("@");
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    // Conservative, unquoted contact addresses safe for the existing mailto link.
    return local.length <= 64 && /^[A-Za-z0-9_+.'-]+$/.test(local) &&
        !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") &&
        domain.includes(".") && domain.split(".").every((label) =>
            /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label),
        );
}

function optionalHttpsUrl(value: unknown): string | undefined {
    if (!isNonEmptyString(value) || !/^https:\/\//i.test(value) || /[\s\\]/.test(value)) {
        return undefined;
    }
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname && !url.username && !url.password
            ? value
            : undefined;
    } catch {
        return undefined;
    }
}

function collectionEntries<T>(value: T[] | null | undefined, field: string): T[] {
    if (value == null) return [];
    if (!Array.isArray(value)) {
        throw new Error("About Page " + field + " must be an array.");
    }
    // Non-object placeholders cannot form optional collection items.
    return value.filter(isRecord);
}

function optionalYear(value: unknown, field: string): number | undefined {
    if (value == null) return undefined;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1950 || value > 2100) {
        throw new Error("About Page has an invalid " + field + ".");
    }
    return value;
}

function requiredYear(value: unknown, field: string): number {
    const year = optionalYear(value, field);
    if (year === undefined) {
        throw new Error("About Page is missing a valid " + field + ".");
    }
    return year;
}

function optionalCurrent(value: unknown): boolean {
    if (value == null) return false;
    if (typeof value !== "boolean") {
        throw new Error("About Page has an invalid experience.isCurrent.");
    }
    return value;
}

function optionalCvUrl(file: SanityAboutFile | null | undefined): string | undefined {
    if (!isRecord(file) || !isRecord(file.asset)) return undefined;
    const asset = file.asset;
    const id = typeof asset._id === "string" ? /^file-([a-f0-9]{40})-pdf$/.exec(asset._id) : null;
    if (!id || asset._type !== "sanity.fileAsset" ||
        asset.mimeType !== "application/pdf" || asset.extension !== "pdf") return undefined;
    const value = optionalHttpsUrl(asset.url);
    if (!value) return undefined;
    const url = new URL(value);
    const path = url.pathname.split("/");
    return url.hostname === "cdn.sanity.io" && !url.port &&
        path.length === 5 && path[1] === "files" && path[2] && path[3] &&
        path[4] === id[1] + ".pdf" ? value : undefined;
}

function adaptExperience(
    entry: SanityAboutExperience,
    language: ContentLanguage,
): AboutExperience {
    return {
        id: requireString(entry._key, "experience._key"),
        role: resolveLocalizedValue(entry.role, language),
        organization: requireString(entry.organization, "experience.organization"),
        startYear: requiredYear(entry.startYear, "experience.startYear"),
        endYear: optionalYear(entry.endYear, "experience.endYear"),
        isCurrent: optionalCurrent(entry.isCurrent),
        description: resolveLocalizedValue(entry.description, language),
    };
}

function adaptEducation(
    entry: SanityAboutEducation,
    language: ContentLanguage,
): AboutEducation {
    const description = entry.description?.[language];

    return {
        id: requireString(entry._key, "education._key"),
        degree: resolveLocalizedValue(entry.degree, language),
        institution: requireString(entry.institution, "education.institution"),
        startYear: optionalYear(entry.startYear, "education.startYear"),
        endYear: optionalYear(entry.endYear, "education.endYear"),
        description:
            typeof description === "string" && description.trim().length > 0
                ? description
                : undefined,
    };
}

function adaptSkillGroup(
    entry: SanityAboutSkillGroup,
    language: ContentLanguage,
): AboutSkillGroup | null {
    const id = requireString(entry._key, "skillGroups._key");
    const title = resolveLocalizedValue(entry.title, language);
    const skills = Array.isArray(entry.skills) ? entry.skills.filter(isNonEmptyString) : [];
    if (skills.length === 0) return null;

    return {
        id,
        title,
        skills,
    };
}

function adaptLanguage(
    entry: SanityAboutLanguage,
    language: ContentLanguage,
): AboutLanguage {
    return {
        id: requireString(entry._key, "languages._key"),
        name: resolveLocalizedValue(entry.name, language),
        proficiency: resolveLocalizedValue(entry.proficiency, language),
    };
}
function adaptAchievement(
    entry: SanityAboutAchievement,
    language: ContentLanguage,
): AboutAchievement {
    return {
        id: requireString(entry._key, "achievements._key"),
        title: resolveLocalizedValue(entry.title, language),
        year: requiredYear(entry.year, "achievements.year"),
        description: resolveLocalizedValue(entry.description, language),
    };
}

export function adaptAbout(
    about: SanityAbout,
    language: ContentLanguage,
): About {
    if (!isRecord(about) || !isNonEmptyString(about.name)) {
        throw new Error("About Page is missing a valid professional name.");
    }

    if (!isValidEmail(about.email)) {
        throw new Error("About Page is missing a valid contact email.");
    }

    return {
        name: about.name,
        headline: resolveLocalizedValue(about.headline, language),
        introduction: resolveLocalizedValue(about.introduction, language),

        experience: collectionEntries(about.experience, "experience").map((entry) =>
            adaptExperience(entry, language),
        ),

        education: collectionEntries(about.education, "education").map((entry) =>
            adaptEducation(entry, language),
        ),

        skillGroups: collectionEntries(about.skillGroups, "skillGroups").map((entry) =>
            adaptSkillGroup(entry, language),
        ).filter((group): group is AboutSkillGroup => group !== null),

        languages: collectionEntries(about.languages, "languages").map((entry) =>
            adaptLanguage(entry, language),
        ),
        achievements: collectionEntries(about.achievements, "achievements").map((entry) =>
            adaptAchievement(entry, language),
        ),

        email: about.email,

        githubUrl: optionalHttpsUrl(about.githubUrl),
        linkedinUrl: optionalHttpsUrl(about.linkedinUrl),
        itchUrl: optionalHttpsUrl(about.itchUrl),

        cvUrl:
            optionalCvUrl(language === "pt" ? about.cvPt : about.cvEn),
    };
}
