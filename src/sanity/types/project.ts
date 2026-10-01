import type { LocalizedValue } from "@/content/adapters/localization";
import type { ProjectStatus } from "@/content/types/project";
import type { SanityCategory } from "./category";

export interface SanityProjectTeamMember {
    name: string;
    role: LocalizedValue;
}

export interface SanityProject {
    _id: string;

    title: LocalizedValue;

    slug: {
        current: string;
    };

    year: number;

    description: LocalizedValue;
    context?: LocalizedValue;
    role: LocalizedValue;

    status: ProjectStatus;
    organization?: LocalizedValue;

    categories: SanityCategory[];
    technologies: string[];
    team: SanityProjectTeamMember[];
}