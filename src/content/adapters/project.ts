import type {
  Project,
  ProjectSeo,
  ProjectTeamMember,
} from "@/content/types/project";

import type {
  SanityProject,
  SanityProjectSeo,
  SanityProjectTeamMember,
} from "@/sanity/types/project";

import { adaptCategory } from "./category";
import {
  resolveLocalizedValue,
  type ContentLanguage,
} from "./localization";
import {
  adaptProjectImage,
  adaptProjectMedia,
} from "./media";

function adaptTeamMember(
  member: SanityProjectTeamMember,
  language: ContentLanguage,
): ProjectTeamMember {
  return {
    name: member.name,
    role: resolveLocalizedValue(member.role, language),
  };
}

function adaptSeo(
  seo: SanityProjectSeo,
  language: ContentLanguage,
): ProjectSeo {
  return {
    title: seo.title
      ? resolveLocalizedValue(seo.title, language)
      : undefined,

    description: seo.description
      ? resolveLocalizedValue(seo.description, language)
      : undefined,
  };
}

export function adaptProject(
  project: SanityProject,
  language: ContentLanguage,
): Project {
  if (!project.slug?.current) {
    throw new Error("Project is missing a valid slug.");
  }

  if (!project.cover) {
    throw new Error(
      `Project "${project.slug.current}" is missing a cover.`,
    );
  }

  if (!Array.isArray(project.categories)) {
    throw new Error(
      `Project "${project.slug.current}" has invalid categories.`,
    );
  }

  const validCategories = project.categories.filter(
    (category): category is NonNullable<typeof category> =>
      Boolean(category),
  );

  if (validCategories.length === 0) {
    throw new Error(
      `Project "${project.slug.current}" has no valid categories.`,
    );
  }

  return {
    title: resolveLocalizedValue(project.title, language),
    slug: project.slug.current,
    year: project.year,

    description: resolveLocalizedValue(
      project.description,
      language,
    ),

    context: project.context
      ? resolveLocalizedValue(project.context, language)
      : undefined,

    role: resolveLocalizedValue(project.role, language),

    status: project.status,

    organization: project.organization
      ? resolveLocalizedValue(project.organization, language)
      : undefined,

    categories: validCategories.map((category) =>
      adaptCategory(category, language),
    ),

    technologies: project.technologies,

    team: project.team.map((member) =>
      adaptTeamMember(member, language),
    ),

    cover: adaptProjectImage(project.cover, language),

    media: project.media.map((item) =>
      adaptProjectMedia(item, language),
    ),

    githubUrl: project.github ?? undefined,
    liveSiteUrl: project.liveSite ?? undefined,

    playable: project.playable
      ? {
        type: project.playable.type,
        source: project.playable.source,
      }
      : undefined,

    featured: project.featured,
    order: project.order,

    seo: project.seo
      ? adaptSeo(project.seo, language)
      : undefined,
  };
}