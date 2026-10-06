import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ProjectsFilters } from "@/features/projects/ProjectsFilters";
import { getCategories } from "@/sanity/repositories/categories";

type ProjectsPageProps = {
    params: Promise<{ lang: string }>;
};

export async function generateMetadata({
    params,
}: ProjectsPageProps): Promise<Metadata> {
    const { lang } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const dictionary = await getDictionary(lang);



    return {
        title: dictionary.navigation.projects,
    };
}

export default async function ProjectsPage({
    params,
}: ProjectsPageProps) {
    const { lang } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const dictionary = await getDictionary(lang);
    const categories = await getCategories(lang);

    return (
        <main>
            <Container>
                <header className="py-(--section-spacing-mobile) md:py-(--section-spacing-desktop)">
                    <div className="grid gap-(--space-24) lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-(--space-40)">
                        <div>
                            <h1 className="text-(length:--font-size-page-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-page-desktop)">
                                {dictionary.projects.title}
                            </h1>

                            <p className="mt-(--space-16) max-w-3xl text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                                {dictionary.projects.description}
                            </p>
                        </div>

                        <ProjectsFilters
                            categories={categories}
                            allLabel={dictionary.projects.filters.all}
                            ariaLabel={dictionary.projects.filters.label}
                        />
                    </div>
                </header>
            </Container>
        </main>
    );
}