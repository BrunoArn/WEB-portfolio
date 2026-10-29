import { notFound } from "next/navigation";

import { AtlasPreview } from "@/features/atlas/AtlasPreview";
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
  return <AtlasPreview locale={lang} content={content} />;
}
