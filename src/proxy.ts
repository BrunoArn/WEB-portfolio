import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "@/i18n/config";

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
    url.pathname = `/${defaultLocale}${pathname}`;

    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        "/((?!api(?:/|$)|_next(?:/|$)|icons(?:/|$)|resume(?:/|$)|static(?:/|$)|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
    ],
};