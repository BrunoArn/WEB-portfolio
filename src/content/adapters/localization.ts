export interface LocalizedValue {
  pt: string;
  en: string;
}

export type ContentLanguage = keyof LocalizedValue;

export function resolveLocalizedValue(
  value: LocalizedValue,
  language: ContentLanguage,
): string {
  return value[language];
}