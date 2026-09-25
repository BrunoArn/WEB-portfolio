import type { Locale } from "./config";

const dictionaries = {
  pt: () => import("./dictionaries/pt").then((module) => module.default),
  en: () => import("./dictionaries/en").then((module) => module.default),
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}