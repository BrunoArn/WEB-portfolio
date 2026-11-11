import { createElement } from "react";
import { InstitutionalOgImage } from "@/features/social/institutional-og-image";
import { renderOgImage } from "@/features/social/og-image";
import { isLocale } from "@/i18n/config";
import { institutionalOgCopy, isInstitutionalOgPage } from "@/i18n/institutional-og";

type ImageContext = {
    params: Promise<{ lang: string; page: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: ImageContext) {
    const { lang, page } = await params;
    if (!isLocale(lang) || !isInstitutionalOgPage(page)) {
        return new Response(null, { status: 404 });
    }

    return renderOgImage(createElement(InstitutionalOgImage, institutionalOgCopy[lang][page]), {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    });
}