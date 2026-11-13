import type { Category } from "@/content/types/category";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityCategory } from "@/sanity/types/category";

import { cache } from "react";
import { canRenderCategories } from "../../content/adapters/availability";
import { adaptCategory } from "@/content/adapters/category";
import { sanityClient } from "@/sanity/client";
import { sanityCacheOptions } from "@/sanity/cache";

export const categoriesQuery = `
  *[_type == "category"] | order(order asc) {
    _id,
    name,
    slug,
    order,
    atlas{isTerritory, color}
  }
`;

const loadCategories = cache(() =>
    sanityClient.fetch<SanityCategory[]>(categoriesQuery, {}, sanityCacheOptions("categories")),
);

export async function hasRenderableCategories(language: ContentLanguage): Promise<boolean> {
    return canRenderCategories(await loadCategories(), language);
}

export async function getCategories(
    language: ContentLanguage,
): Promise<Category[]> {
    const categories = await loadCategories();

    return categories.map((category) =>
        adaptCategory(category, language),
    );
}
