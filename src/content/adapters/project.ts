import type {
  Project,
  ProjectSeo,
  ProjectStatus,
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
  if (
    !member ||
    typeof member.name !== "string" ||
    member.name.trim().length === 0
  ) {
    throw new Error("Project has an invalid team member.");
  }

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

const PROJECT_STATUSES: ProjectStatus[] = [
  "released",
  "prototype",
  "hackathon",
  "client",
  "development",
  "archived",
];

export function adaptProject(
  project: SanityProject,
  language: ContentLanguage,
): Project {
  const slug = project.slug?.current;

  if (
    typeof slug !== "string" ||
    slug.trim().length === 0
  ) {
    throw new Error("Project is missing a valid slug.");
  }

  if (!project.cover) {
    throw new Error(
      `Project "${slug}" is missing a cover.`,
    );
  }

  if (!Array.isArray(project.categories)) {
    throw new Error(
      `Project "${slug}" has invalid categories.`,
    );
  }

  const validCategories = project.categories.filter(
    (category): category is NonNullable<typeof category> =>
      Boolean(category),
  );

  if (validCategories.length === 0) {
    throw new Error(
      `Project "${slug}" has no valid categories.`,
    );
  }

  if (
    !Number.isInteger(project.year) ||
    project.year < 2000 ||
    project.year > 2100
  ) {
    throw new Error(`Project "${slug}" has an invalid year.`);
  }

  if (!PROJECT_STATUSES.includes(project.status)) {
    throw new Error(`Project "${slug}" has an invalid status.`);
  }

  if (typeof project.featured !== "boolean") {
    throw new Error(
      `Project "${slug}" has an invalid featured value.`,
    );
  }

  if (
    !Number.isInteger(project.order) ||
    project.order < 0
  ) {
    throw new Error(`Project "${slug}" has an invalid order.`);
  }

  if (
    !Array.isArray(project.technologies) ||
    project.technologies.some(
      (technology) =>
        typeof technology !== "string" ||
        technology.trim().length === 0,
    )
  ) {
    throw new Error(
      `Project "${slug}" has invalid technologies.`,
    );
  }

  if (
    project.playable &&
    (
      project.playable.type !== "unity-webgl" ||
      typeof project.playable.source !== "string" ||
      project.playable.source.trim().length === 0
    )
  ) {
    throw new Error(
      `Project "${slug}" has an invalid playable configuration.`,
    );
  }

  return {
    title: resolveLocalizedValue(project.title, language),
    slug,
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