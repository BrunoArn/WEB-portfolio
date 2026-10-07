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

    const devPlayableWidth = Number(
        process.env.PLAYABLE_DEV_WIDTH,
    );

    const devPlayableHeight = Number(
        process.env.PLAYABLE_DEV_HEIGHT,
    );

    const developmentPlayable =
        process.env.NODE_ENV === "development" &&
            process.env.PLAYABLE_DEV_SLUG === project.slug &&
            process.env.PLAYABLE_DEV_URL &&
            Number.isInteger(devPlayableWidth) &&
            devPlayableWidth > 0 &&
            Number.isInteger(devPlayableHeight) &&
            devPlayableHeight > 0
            ? {
                source: process.env.PLAYABLE_DEV_URL,
                width: devPlayableWidth,
                height: devPlayableHeight,
            }
            : undefined;

    const resolvedPlayable =
        developmentPlayable ??
        project.playable;


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
                    </div>
                </div>

                {project.media.length > 0 && (
                    <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                        <ProjectMediaPreview
                            media={project.media}
                            selectMediaLabel={dictionary.projectDetail.media.select}
                        />
                    </div>
                )}

                {project.media.length > 0 && (
                    <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                        <ProjectGallery
                            media={project.media}
                            title={dictionary.projectDetail.gallery.title}
                        />
                    </div>
                )}

                {resolvedPlayable && (
                    <div className="pb-(--section-spacing-mobile) md:pb-(--section-spacing-desktop)">
                        <ProjectPlayable
                            source={resolvedPlayable.source}
                            projectTitle={project.title}
                            width={resolvedPlayable.width}
                            height={resolvedPlayable.height}
                            labels={dictionary.projectDetail.playable}
                        />
                    </div>
                )}
            </Container>
        </main>
    );
}