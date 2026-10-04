import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { FeaturedProjects } from "@/features/home/FeaturedProjects";
import { HomeHero } from "@/features/home/HomeHero";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import { getFeaturedProjects } from "@/sanity/repositories/projects";

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
  const featuredProjects = await getFeaturedProjects(lang);

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

        <FeaturedProjects
          projects={featuredProjects}
          eyebrow={dictionary.home.featured.eyebrow}
          title={dictionary.home.featured.title}
          viewAllLabel={dictionary.home.featured.viewAll}
          viewAllHref={`/${lang}/projects`}
          selectProjectLabel={dictionary.home.featured.selectProject}
        />
      </Container>
    </main>
  );
}