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
  return {
    name: resolveLocalizedValue(category.name, language),
    slug: category.slug.current,
    order: category.order,
  };
}