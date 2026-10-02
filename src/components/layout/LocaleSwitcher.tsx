"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isLocale, locales } from "@/i18n/config";

type Locale = (typeof locales)[number];

type LocaleSwitcherProps = {
  currentLocale: Locale;
};

function getLocalizedPath(pathname: string, locale: Locale) {
  const segments = pathname.split("/");

  if (isLocale(segments[1])) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }

  return segments.join("/") || `/${locale}`;
}

export function LocaleSwitcher({
  currentLocale,
}: LocaleSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-(--space-8) text-(length:--font-size-label) font-medium">
      {locales.map((locale, index) => {
        const isCurrent = locale === currentLocale;

        return (
          <span key={locale} className="flex items-center gap-(--space-8)">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="text-app-text-secondary"
              >
                /
              </span>
            )}

            {isCurrent ? (
              <span
                aria-current="page"
                className="text-app-accent"
              >
                {locale.toUpperCase()}
              </span>
            ) : (
              <Link
                href={getLocalizedPath(pathname, locale)}
                className="text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-text-primary"
              >
                {locale.toUpperCase()}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}