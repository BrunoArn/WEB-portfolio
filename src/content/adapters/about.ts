
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
} from "@/sanity/types/about";

import {
    resolveLocalizedValue,
    type ContentLanguage,
} from "./localization";

function adaptExperience(
    entry: SanityAboutExperience,
    language: ContentLanguage,
): AboutExperience {
    return {
        id: entry._key,
        role: resolveLocalizedValue(entry.role, language),
        organization: entry.organization,
        startYear: entry.startYear,
        endYear: entry.endYear ?? undefined,
        isCurrent: entry.isCurrent ?? false,
        description: resolveLocalizedValue(entry.description, language),
    };
}

function adaptEducation(
    entry: SanityAboutEducation,
    language: ContentLanguage,
): AboutEducation {
    return {
        id: entry._key,
        degree: resolveLocalizedValue(entry.degree, language),
        institution: entry.institution,
        startYear: entry.startYear ?? undefined,
        endYear: entry.endYear ?? undefined,
        description: entry.description
            ? resolveLocalizedValue(entry.description, language)
            : undefined,
    };
}

function adaptSkillGroup(
    entry: SanityAboutSkillGroup,
    language: ContentLanguage,
): AboutSkillGroup {
    return {
        id: entry._key,
        title: resolveLocalizedValue(entry.title, language),
        skills: entry.skills,
    };
}

function adaptLanguage(
    entry: SanityAboutLanguage,
    language: ContentLanguage,
): AboutLanguage {
    return {
        id: entry._key,
        name: resolveLocalizedValue(entry.name, language),
        proficiency: resolveLocalizedValue(entry.proficiency, language),
    };
}
function adaptAchievement(
    entry: SanityAboutAchievement,
    language: ContentLanguage,
): AboutAchievement {
    return {
        id: entry._key,
        title: resolveLocalizedValue(entry.title, language),
        year: entry.year,
        description: resolveLocalizedValue(entry.description, language),
    };
}

export function adaptAbout(
    about: SanityAbout,
    language: ContentLanguage,
): About {
    if (!about || typeof about.name !== "string" || !about.name.trim()) {
        throw new Error("About Page is missing a valid professional name.");
    }

    if (
        typeof about.email !== "string" ||
        !about.email.trim()
    ) {
        throw new Error("About Page is missing a valid contact email.");
    }

    return {
        name: about.name,
        headline: resolveLocalizedValue(about.headline, language),
        introduction: resolveLocalizedValue(about.introduction, language),

        experience: about.experience.map((entry) =>
            adaptExperience(entry, language),
        ),

        education: about.education.map((entry) =>
            adaptEducation(entry, language),
        ),

        skillGroups: about.skillGroups.map((entry) =>
            adaptSkillGroup(entry, language),
        ),

        languages: about.languages.map((entry) =>
            adaptLanguage(entry, language),
        ),
        achievements: (about.achievements ?? []).map((entry) =>
            adaptAchievement(entry, language),
        ),

        email: about.email,

        githubUrl: about.githubUrl ?? undefined,
        linkedinUrl: about.linkedinUrl ?? undefined,
        itchUrl: about.itchUrl ?? undefined,

        cvUrl:
            (language === "pt" ? about.cvPt : about.cvEn)
                ?.asset?.url ?? undefined,
    };
}
