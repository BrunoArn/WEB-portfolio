import type { Category } from "./category";

export type ProjectStatus =
    | "released"
    | "prototype"
    | "hackathon"
    | "client"
    | "development"
    | "archived";

export interface ProjectTeamMember {
    name: string;
    role: string;
}

export interface ProjectImage {
    id: string;
    type: "image";
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export interface ProjectVideo {
    id: string;
    type: "video";
    src: string;
}

export type ProjectMedia = ProjectImage | ProjectVideo;

export interface ProjectPlayable {
    type: "unity-webgl";
    source: string;
    width: number;
    height: number;
}

export interface ProjectSeo {
    title?: string;
    description?: string;
}

export interface Project {
    title: string;
    slug: string;
    year: number;

    description: string;
    context?: string;
    role: string;

    status: ProjectStatus;
    organization?: string;

    categories: Category[];
    technologies: string[];
    team: ProjectTeamMember[];

    cover: ProjectImage;
    media: ProjectMedia[];

    githubUrl?: string;
    liveSiteUrl?: string;

    playable?: ProjectPlayable;

    featured: boolean;
    order: number;

    seo?: ProjectSeo;
}