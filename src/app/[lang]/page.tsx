import type { Metadata } from "next";
import { JsonLd } from "@/seo/JsonLd";
import { getWebsiteJsonLd } from "@/seo/structured-data";
import { getSocialMetadata } from "@/seo/social";
import { getPublicAlternates } from "@/seo/international";
import { notFound } from "next/navigation";

import { AtlasMap } from "@/features/atlas/AtlasMap";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAtlasData } from "@/sanity/repositories/atlas";

type HomePageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  const metadata = {
    ...getPublicAlternates(lang, { route: "home" }),
    title: { absolute: dictionary.metadata.home.title },
    description: dictionary.metadata.home.description,
  };

  return {
    ...metadata,
    ...getSocialMetadata(metadata, lang, "home", dictionary.site.name),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const [dictionary, data] = await Promise.all([getDictionary(lang), getAtlasData()]);
  const content = adaptAtlasContent(data, lang, dictionary.atlas.content);
  return (
    <>
      <JsonLd data={getWebsiteJsonLd(dictionary.site.name)} />
      <AtlasMap locale={lang} labels={dictionary.atlas} content={content} />
    </>
  );
}
