import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { locales } from "@/i18n/config";
import { getPreferredLocale } from "@/i18n/preferred-locale";

function pathnameHasLocale(pathname: string) {
    return locales.some(
        (locale) =>
            pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    );
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathnameHasLocale(pathname)) {
        return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    const locale = getPreferredLocale(request.headers.get("accept-language"));
    url.pathname = `/${locale}${pathname}`;

    const response = NextResponse.redirect(url);
    // Only this entry redirect varies by browser. Localized pages keep their cache.
    response.headers.set("Vary", "Accept-Language");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
}

export const config = {
    matcher: [
        "/((?!api(?:/|$)|_next(?:/|$)|icons(?:/|$)|resume(?:/|$)|static(?:/|$)|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
    ],
};