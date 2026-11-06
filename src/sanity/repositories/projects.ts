import type { Project, ProjectCardData } from "@/content/types/project";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityProject, SanityProjectCard } from "@/sanity/types/project";

import { adaptProject, adaptProjectCard } from "@/content/adapters/project";
import { sanityClient } from "@/sanity/client";
import { sanityCacheOptions } from "@/sanity/cache";
import { projectProjection, projectCardProjection } from "@/sanity/queries/project";

// Category labels/colors are resolved by the project projection too.
const projectFetchOptions = sanityCacheOptions("projects", "categories");

/** Only published slugs are needed to enumerate detail pages during the build. */
export async function getProjectSlugs(): Promise<string[]> {
    const slugs = await sanityClient.fetch<string[]>(
        '*[_type == "project" && defined(slug.current) && slug.current != ""].slug.current',
        {},
        // Build inventory must always reflect currently published slugs.
        { cache: "no-store" },
    );
    return [...new Set(slugs)];
}

const projectCardsQuery = `
  *[_type == "project"] | order(order asc) {
    ${projectCardProjection}
  }
`;

export async function getProjectCards(
    language: ContentLanguage,
): Promise<ProjectCardData[]> {
    const projects = await sanityClient.fetch<SanityProjectCard[]>(
        projectCardsQuery,
        {},
        projectFetchOptions,
    );

    return projects.map((project) =>
        adaptProjectCard(project, language),
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
