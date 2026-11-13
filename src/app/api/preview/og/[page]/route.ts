import { createElement } from "react";
import { InstitutionalOgImage } from "@/features/social/institutional-og-image";
import { renderOgImage } from "@/features/social/og-image";
import { defaultLocale, isLocale } from "@/i18n/config";
import { institutionalOgCopy, isInstitutionalOgPage } from "@/i18n/institutional-og";

type PreviewContext = {
    params: Promise<{ page: string }>;
};

export const runtime = "nodejs";

export async function GET(request: Request, { params }: PreviewContext) {
    if (process.env.NODE_ENV !== "development") {
        return new Response(null, { status: 404 });
    }

    const { page } = await params;
    const locale = new URL(request.url).searchParams.get("lang") ?? defaultLocale;

    if (!isInstitutionalOgPage(page) || !isLocale(locale)) {
        return new Response(null, { status: 404 });
    }

    return renderOgImage(createElement(InstitutionalOgImage, institutionalOgCopy[locale][page]));
}