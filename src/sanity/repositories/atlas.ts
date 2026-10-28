import { sanityClient } from "@/sanity/client";
import type { SanityProject } from "@/sanity/types/project";

export type AtlasSanityProject = Pick<SanityProject, "_id" | "title" | "description" | "year" | "slug" | "categories"> & { cover: SanityProject["cover"] | null };

// A small read-only projection: do not fetch galleries/playables for map cards.
const atlasProjectsQuery = /* groq */ `
  *[_type == "project"] | order(order asc, _id asc) {
    _id, title, description, year, slug,
    "categories": coalesce(categories[]->{ _id, name, slug, order }, []),
    cover { _type, alt, image { asset->{ _id, url, metadata { dimensions { width, height } } } } }
  }
`;

export async function getAtlasProjects(): Promise<AtlasSanityProject[]> {
  return sanityClient.withConfig({ perspective: "published" }).fetch<AtlasSanityProject[]>(atlasProjectsQuery);
}
