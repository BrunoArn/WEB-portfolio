import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AtlasMap } from "@/features/atlas/AtlasMap";
import { getAtlasData } from "@/sanity/repositories/atlas";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

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

  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.atlas.previewTitle,
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

  const [dictionary, data] = await Promise.all([getDictionary(lang), getAtlasData()]);
  const content = adaptAtlasContent(data, lang, dictionary.atlas.content);
  const query = await searchParams;
  return <AtlasMap locale={lang} labels={dictionary.atlas} content={content} showTerrainControls={query?.terrain === "1"} showMotionControls={query?.motion === "1"} />;
}
