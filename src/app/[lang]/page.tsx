import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { FeaturedProjects } from "@/features/home/FeaturedProjects";
import { HomeHero } from "@/features/home/HomeHero";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import { getFeaturedProjects, getProjects, } from "@/sanity/repositories/projects";
import { MoreProjects } from "@/features/home/MoreProjects";

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

  const projects = await getProjects(lang);

  const moreProjects = projects
    .filter((project) => !project.featured)
    .slice(0, 6);

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
          locale={lang}
          eyebrow={dictionary.home.featured.eyebrow}
          title={dictionary.home.featured.title}
          viewAllLabel={dictionary.home.featured.viewAll}
          viewAllHref={`/${lang}/projects`}
          selectProjectLabel={dictionary.home.featured.selectProject}
        />

        <MoreProjects
          projects={moreProjects}
          locale={lang}
          title={dictionary.home.moreProjects.title}
          viewAllLabel={dictionary.home.featured.viewAll}
          viewAllHref={`/${lang}/projects`}
        />
      </Container>
    </main>
  );
}