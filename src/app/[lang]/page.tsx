import { notFound } from "next/navigation";

import { AtlasMap } from "@/features/atlas/AtlasMap";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { isLocale } from "@/i18n/config";
import { getAtlasData } from "@/sanity/repositories/atlas";

type HomePageProps = {
  params: Promise<{ lang: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const content = adaptAtlasContent(await getAtlasData(), lang);
  return <AtlasMap locale={lang} content={content} />;
}
