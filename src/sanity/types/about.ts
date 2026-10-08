import type { LocalizedValue } from "@/content/adapters/localization";

export interface SanityAboutExperience {
    _key: string;
    role: LocalizedValue;
    organization: string;
    startYear: number;
    endYear?: number | null;
    isCurrent?: boolean | null;
    description: LocalizedValue;
}

export interface SanityAboutEducation {
    _key: string;
    degree: LocalizedValue;
    institution: string;
    startYear?: number | null;
    endYear?: number | null;
    description?: LocalizedValue | null;
}

export interface SanityAboutSkillGroup {
    _key: string;
    title: LocalizedValue;
    skills: string[];
}

export interface SanityAboutLanguage {
    _key: string;
    name: LocalizedValue;
    proficiency: LocalizedValue;
}

export interface SanityAboutAchievement {
    _key: string;
    title: LocalizedValue;
    year: number;
    description: LocalizedValue;
}

export interface SanityAboutFile {
    asset: {
        _id: string;
        _type: "sanity.fileAsset";
        mimeType: string | null;
        extension: string | null;
        url: string;
    } | null;
}

export interface SanityAbout {
    _id: string;

    name: string;
    headline: LocalizedValue;
    introduction: LocalizedValue;

    experience: SanityAboutExperience[];
    education: SanityAboutEducation[];
    skillGroups: SanityAboutSkillGroup[];
    languages: SanityAboutLanguage[];
    achievements: SanityAboutAchievement[];

    email: string;

    githubUrl: string | null;
    linkedinUrl: string | null;
    itchUrl: string | null;

    cvPt: SanityAboutFile | null;
    cvEn: SanityAboutFile | null;
}