export interface LocalizedValue {
  pt: string;
  en: string;
}

export type ContentLanguage = keyof LocalizedValue;

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