import { sanityClient } from "@/sanity/client";
import type { LocalizedValue } from "@/content/adapters/localization";
import type { SanityProject } from "@/sanity/types/project";

export interface AtlasSanityPosition { x?: number; y?: number }
export interface AtlasSanityTerritory {
  _id: string;
  atlas: {
    isTerritory?: boolean;
    color?: string;
    label?: LocalizedValue;
    desktop?: AtlasSanityPosition;
    mobile?: AtlasSanityPosition;
  } | null;
}
export type AtlasSanityProject = Pick<SanityProject, "_id" | "title" | "description" | "year" | "slug" | "categories"> & {
  cover: SanityProject["cover"] | null;
  atlas?: {
    enabled?: boolean;
    territory?: { _ref?: string };
    desktop?: AtlasSanityPosition;
    mobile?: AtlasSanityPosition;
    influence?: number;
  } | null;
};
export interface AtlasSanityData {
  projects: AtlasSanityProject[];
  territories: AtlasSanityTerritory[];
}

const atlasQuery = /* groq */ `{
  "projects": *[_type == "project" && atlas.enabled == true] | order(order asc, _id asc) {
    _id, title, description, year, slug,
    atlas{enabled, territory{_ref}, desktop{x,y}, mobile{x,y}, influence},
    "categories": coalesce(categories[]->{ _id, name, slug, order }, []),
    cover { _type, alt, image { asset->{ _id, url, metadata { dimensions { width, height } } } } }
  },
  "territories": *[_type == "category" && atlas.isTerritory == true] | order(order asc, _id asc) {
    _id, atlas{isTerritory, color, label, desktop{x,y}, mobile{x,y}}
  }
}`;

export async function getAtlasData(): Promise<AtlasSanityData> {
  return sanityClient.withConfig({ perspective: "published" }).fetch<AtlasSanityData>(atlasQuery, {}, { cache: "no-store" });
}
