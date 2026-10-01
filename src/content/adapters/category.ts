import type { Category } from "@/content/types/category";
import type { SanityCategory } from "@/sanity/types/category";

import {
  resolveLocalizedValue,
  type ContentLanguage,
} from "./localization";

export function adaptCategory(
  category: SanityCategory,
  language: ContentLanguage,
): Category {
  const slug = category.slug?.current;

  if (
    typeof slug !== "string" ||
    slug.trim().length === 0
  ) {
    throw new Error("Category is missing a valid slug.");
  }

  return {
    name: resolveLocalizedValue(category.name, language),
    slug,
    order: category.order,
  };
}