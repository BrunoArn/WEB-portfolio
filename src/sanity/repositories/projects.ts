import type { Project } from "@/content/types/project";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityProject } from "@/sanity/types/project";

import { adaptProject } from "@/content/adapters/project";
import { sanityClient } from "@/sanity/client";
import { projectProjection } from "@/sanity/queries/project";

// Keep published project data fresh without querying Sanity on every visit.
const projectFetchOptions = { next: { revalidate: 60 } };

/** Only published slugs are needed to enumerate detail pages during the build. */
export async function getProjectSlugs(): Promise<string[]> {
    const slugs = await sanityClient.fetch<string[]>(
        '*[_type == "project" && defined(slug.current) && slug.current != ""].slug.current',
    );
    return [...new Set(slugs)];
}

const projectsQuery = `
  *[_type == "project"] | order(order asc) {
    ${projectProjection}
  }
`;

export async function getProjects(
    language: ContentLanguage,
): Promise<Project[]> {
    const projects = await sanityClient.fetch<SanityProject[]>(
        projectsQuery,
        {},
        projectFetchOptions,
    );

    return projects.map((project) =>
        adaptProject(project, language),
    );
}

const projectBySlugQuery = `
  *[_type == "project" && slug.current == $slug][0] {
    ${projectProjection}
  }
`;

export async function getProjectBySlug(
    slug: string,
    language: ContentLanguage,
): Promise<Project | null> {
    const project = await sanityClient.fetch<SanityProject | null>(
        projectBySlugQuery,
        { slug },
        projectFetchOptions,
    );

    return project
        ? adaptProject(project, language)
        : null;
}

const featuredProjectsQuery = `
  *[
    _type == "project" &&
    featured == true
  ] | order(order asc) {
    ${projectProjection}
  }
`;

export async function getFeaturedProjects(
    language: ContentLanguage,
): Promise<Project[]> {
    const projects = await sanityClient.fetch<SanityProject[]>(
        featuredProjectsQuery,
        {},
        projectFetchOptions,
    );

    return projects.map((project) =>
        adaptProject(project, language),
    );
}