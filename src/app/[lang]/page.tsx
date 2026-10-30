import { notFound } from "next/navigation";

import { AtlasMap } from "@/features/atlas/AtlasMap";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAtlasData } from "@/sanity/repositories/atlas";

type HomePageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const [dictionary, data] = await Promise.all([getDictionary(lang), getAtlasData()]);
  const content = adaptAtlasContent(data, lang, dictionary.atlas.content);
  return <AtlasMap locale={lang} labels={dictionary.atlas} content={content} />;
}
