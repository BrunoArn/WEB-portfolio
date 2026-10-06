import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getProjectBySlug } from "@/sanity/repositories/projects";

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

    if (!project) {
        notFound();
    }

    return (
        <main>
            <Container>
                <h1>{project.title}</h1>
            </Container>
        </main>
    );
}