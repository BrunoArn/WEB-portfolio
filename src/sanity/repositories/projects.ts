import type { Project } from "@/content/types/project";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityProject } from "@/sanity/types/project";

import { adaptProject } from "@/content/adapters/project";
import { sanityClient  } from "@/sanity/client";
import { projectProjection } from "@/sanity/queries/project";

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
  );

  return projects.map((project) =>
    adaptProject(project, language),
  );
}