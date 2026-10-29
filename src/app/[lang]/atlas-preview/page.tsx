import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AtlasPreview } from "@/features/atlas/AtlasPreview";
import { getAtlasData } from "@/sanity/repositories/atlas";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { isLocale } from "@/i18n/config";

type AtlasPreviewPageProps = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ terrain?: string; motion?: string }>;
};

export async function generateMetadata({
  params,
}: AtlasPreviewPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return {
    title: lang === "pt" ? "Atlas — Prévia" : "Atlas — Preview",
    robots: { index: false, follow: false },
  };
}

export default async function AtlasPreviewPage({
  params, searchParams,
}: AtlasPreviewPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const content = adaptAtlasContent(await getAtlasData(), lang);
  const query = await searchParams;
  return <AtlasPreview locale={lang} content={content} showTerrainControls={query?.terrain === "1"} showMotionControls={query?.motion === "1"} />;
}
