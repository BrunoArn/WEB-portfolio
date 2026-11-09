export interface LocalizedValue {
  pt: string;
  en: string;
}

export type ContentLanguage = keyof LocalizedValue;

/** Optional editorial overrides never borrow another language or invalidate a page. */
export function resolveOptionalLocalizedValue(
  value: Partial<LocalizedValue> | null | undefined,
  language: ContentLanguage,
): string | undefined {
  const localizedValue = value?.[language];
  return typeof localizedValue === "string" && localizedValue.trim()
    ? localizedValue.trim()
    : undefined;
}

export function resolveLocalizedValue(
  value: LocalizedValue | null | undefined,
  language: ContentLanguage,
): string {
  const localizedValue = value?.[language];

  if (
    typeof localizedValue !== "string" ||
    localizedValue.trim().length === 0
  ) {
    throw new Error(
      `Missing localized value for language "${language}".`,
    );
  }

  return localizedValue;
}