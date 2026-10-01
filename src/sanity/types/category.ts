import type { LocalizedValue } from "@/content/adapters/localization";

export interface SanityCategory {
  _id: string;

  name: LocalizedValue;

  slug: {
    current: string;
  };

  order: number;
}