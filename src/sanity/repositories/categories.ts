import type { Category } from "@/content/types/category";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityCategory } from "@/sanity/types/category";

import { adaptCategory } from "@/content/adapters/category";
import { sanityClient } from "@/sanity/client";

const categoriesQuery = `
  *[_type == "category"] | order(order asc) {
    _id,
    name,
    slug,
    order
  }
`;

export async function getCategories(
    language: ContentLanguage,
): Promise<Category[]> {
    const categories = await sanityClient.fetch<SanityCategory[]>(
        categoriesQuery,
    );

    return categories.map((category) =>
        adaptCategory(category, language),
    );
}