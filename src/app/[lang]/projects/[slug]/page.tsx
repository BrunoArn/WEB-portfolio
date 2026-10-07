import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getProjectBySlug } from "@/sanity/repositories/projects";
import { ProjectHero } from "@/features/project-detail/ProjectHero";
import { getDictionary } from "@/i18n/get-dictionary";
import { ProjectAbout } from "@/features/project-detail/ProjectAbout";
import { ProjectInfo } from "@/features/project-detail/ProjectInfo";
import { ProjectMediaPreview } from "@/features/project-detail/ProjectMediaPreview";
import { ProjectGallery } from "@/features/project-detail/ProjectGallery";
import { ProjectPlayable } from "@/features/project-detail/ProjectPlayable";

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

    return {
        title: project.seo?.title ?? project.title,
        description: project.seo?.description ?? project.description,
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

    const developmentPlayableSource =
        process.env.NODE_ENV === "development" &&
            process.env.PLAYABLE_DEV_SLUG === project.slug
            ? process.env.PLAYABLE_DEV_URL
            : undefined;

    const playableSource =
        developmentPlayableSource ??
        project.playable?.source;


    return (
        <main>
            <Container>
                <ProjectHero
                    project={project}
                    actions={dictionary.projectDetail.actions}
                />

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

                        {project.media.length > 0 && (
                            <ProjectMediaPreview
                                media={project.media}
                                selectMediaLabel={dictionary.projectDetail.media.select}
                            />
                        )}

                        {project.media.length > 0 && (
                            <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                                <ProjectGallery
                                    media={project.media}
                                    title={dictionary.projectDetail.gallery.title}
                                />
                            </div>
                        )}

                        {playableSource && (
                            <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                                <ProjectPlayable
                                    source={playableSource}
                                    projectTitle={project.title}
                                    labels={dictionary.projectDetail.playable}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    );
}