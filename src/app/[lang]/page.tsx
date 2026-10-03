import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { HomeHero } from "@/features/home/HomeHero";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

type HomePageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const dictionary = await getDictionary(lang);

  return (
    <main>
      <Container>
        <HomeHero
          eyebrow={dictionary.home.hero.eyebrow}
          title={dictionary.home.hero.title}
          description={dictionary.home.hero.description}
          ctaLabel={dictionary.home.hero.cta}
          ctaHref={`/${lang}/projects`}
        />
      </Container>
    </main>
  );
}