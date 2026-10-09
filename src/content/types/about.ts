export interface AboutExperience {
    id: string;
    role: string;
    organization: string;
    startYear: number;
    endYear?: number;
    isCurrent: boolean;
    description: string;
}

export interface AboutEducation {
    id: string;
    degree: string;
    institution: string;
    startYear?: number;
    endYear?: number;
    description?: string;
}

export interface AboutSkillGroup {
    id: string;
    title: string;
    skills: string[];
}

export interface AboutLanguage {
    id: string;
    name: string;
    proficiency: string;
}

export interface AboutAchievement {
    id: string;
    title: string;
    year: number;
    description: string;
}

export interface About {
    name: string;
    headline: string;
    introduction: string;

    experience: AboutExperience[];
    education: AboutEducation[];
    skillGroups: AboutSkillGroup[];
    languages: AboutLanguage[];
    achievements: AboutAchievement[];

    email: string;

    githubUrl?: string;
    linkedinUrl?: string;
    itchUrl?: string;

    cvUrl?: string;
}