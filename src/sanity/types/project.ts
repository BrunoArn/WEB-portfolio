import type { LocalizedValue } from "@/content/adapters/localization";
import type { ProjectStatus } from "@/content/types/project";
import type { SanityCategory } from "./category";
import type {
    SanityProjectImage,
    SanityProjectMedia,
} from "./media";

export interface SanityProjectTeamMember {
    name: string;
    role: LocalizedValue;
}

export interface SanityProjectPlayable {
    type: "unity-webgl";
    source: string;
}

export interface SanityProjectSeo {
    title?: LocalizedValue;
    description?: LocalizedValue;
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

    cover: SanityProjectImage;
    media: SanityProjectMedia[];

    github?: string;
    liveSite?: string;

    playable?: SanityProjectPlayable;

    featured: boolean;
    order: number;

    seo?: SanityProjectSeo;
}