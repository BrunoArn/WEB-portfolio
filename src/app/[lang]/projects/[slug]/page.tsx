import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/seo/JsonLd";
import { getProjectJsonLd } from "@/seo/structured-data";
import { getSocialMetadata } from "@/seo/social";
import { getCanonicalOrigin, getPublicAlternates, otherLocale } from "@/seo/international";
import { accentStyle } from "@/styles/accent";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getProjectBySlug, getProjectCards, getProjectSlugs, hasRenderableProjectAlternate } from "@/sanity/repositories/projects";
import { ProjectHero } from "@/features/project-detail/ProjectHero";
import { getDictionary } from "@/i18n/get-dictionary";
import { ProjectAbout } from "@/features/project-detail/ProjectAbout";
import { ProjectInfo } from "@/features/project-detail/ProjectInfo";
import { ProjectMediaPreview } from "@/features/project-detail/ProjectMediaPreview";
import { ProjectPlayable } from "@/features/project-detail/ProjectPlayable";
import { RelatedProjects } from "@/features/project-detail/RelatedProjects";
import { AtlasBackground } from "@/features/atlas/AtlasBackground";
import backgroundStyles from "@/features/atlas/AtlasBackground.module.css";

// Prebuild existing projects; new published slugs can still render on demand.
export const dynamicParams = true;

export async function generateStaticParams() {
    const slugs = await getProjectSlugs();
    return slugs.map(slug => ({ slug }));
}

type ProjectPageProps = {
    params: Promise<{
        lang: string;
        slug: string;
    }>;
};

export async function generateMetadata({
    params,
}: ProjectPageProps): Promise<Metadata> {
    const { lang, slug } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const project = await getProjectBySlug(slug, lang);

    if (!project) {
        notFound();
    }

    const origin = getCanonicalOrigin(process.env.SEO_CANONICAL_ORIGIN);
    const hasTranslation = origin ? await hasRenderableProjectAlternate(project.slug, otherLocale(lang)) : false;

    const dictionary = await getDictionary(lang);
    const metadata = {
        // Custom SEO titles are complete editorial titles; only fallbacks use the layout brand.
        ...getPublicAlternates(lang, { route: "project", slug: project.slug }, hasTranslation, origin),
        title: project.seo?.title ? { absolute: project.seo.title } : project.title,
        description: project.seo?.description ?? project.description,
    };

    return {
        ...metadata,
        ...getSocialMetadata(metadata, lang, "projects", dictionary.site.name, project.cover),
    };
}

export default async function ProjectPage({
    params,
}: ProjectPageProps) {
    const { lang, slug } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const project = await getProjectBySlug(slug, lang);
    const dictionary = await getDictionary(lang);

    if (!project) {
        notFound();
    }

    const projects = await getProjectCards(lang);

    const currentCategorySlugs = new Set(
        project.categories.map((category) => category.slug),
    );

    const relatedByCategory = projects.filter(
        (candidate) =>
            candidate.slug !== project.slug &&
            candidate.categories.some((category) =>
                currentCategorySlugs.has(category.slug),
            ),
    );

    const fallbackProjects = projects.filter(
        (candidate) =>
            candidate.slug !== project.slug &&
            !relatedByCategory.some(
                (related) => related.slug === candidate.slug,
            ),
    );

    const relatedProjects = [
        ...relatedByCategory,
        ...fallbackProjects,
    ].slice(0, 6);

    return (
        <ViewTransition default="none" enter="project-page-enter">
            <main data-project-detail className={backgroundStyles.page} style={accentStyle(project.accentColor)}>
                <JsonLd data={getProjectJsonLd(lang, dictionary.site.name, project)} />
                <AtlasBackground
                    projectSlug={project.slug}
                    locale={lang}
                    labels={dictionary.atlas}
                />
                <Container>
                    <div className="pt-(--space-24) md:pt-(--space-32)">
                        <ProjectHero
                            project={project}
                            actions={dictionary.projectDetail.actions}
                            hasPlayable={Boolean(project.playable)}
                        />
                    </div>

                    <div className="py-(--section-spacing-mobile) md:py-(--section-spacing-desktop)">
                        <div className="grid gap-(--space-40) md:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                            <ProjectAbout
                                project={project}
                                title={dictionary.projectDetail.about}
                            />

                            <ProjectInfo
                                project={project}
                                labels={dictionary.projectDetail.info}
                            />
                        </div>
                    </div>

                    {project.media.length > 0 && (
                        <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                            <ProjectMediaPreview
                                media={project.media}
                                labels={dictionary.projectDetail.media}
                            />
                        </div>
                    )}


                    {project.playable && (
                        <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                            <ProjectPlayable
                                source={project.playable.source}
                                projectTitle={project.title}
                                width={project.playable.width}
                                height={project.playable.height}
                                labels={dictionary.projectDetail.playable}
                                poster={project.cover}
                            />
                        </div>
                    )}

                    {relatedProjects.length > 0 && (
                        <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                            <RelatedProjects
                                projects={relatedProjects}
                                title={dictionary.projectDetail.related.title}
                                locale={lang}
                            />
                        </div>
                    )}
                </Container>
            </main>
        </ViewTransition>
    );
}
