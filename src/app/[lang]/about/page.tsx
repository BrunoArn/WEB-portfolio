import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAbout } from "@/sanity/repositories/about";
import { AboutExperience } from "@/features/about/AboutExperience";
import { AboutEducation } from "@/features/about/AboutEducation";
import { AboutSkills } from "@/features/about/AboutSkills";
import { AboutLanguages } from "@/features/about/AboutLanguages";
import { AboutLinks } from "@/features/about/AboutLinks";
import { AboutAchievements } from "@/features/about/AboutAchievements";

type AboutPageProps = {
    params: Promise<{ lang: string }>;
};

export async function generateMetadata({
    params,
}: AboutPageProps): Promise<Metadata> {
    const { lang } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const dictionary = await getDictionary(lang);

    return {
        title: dictionary.navigation.about,
    };
}

export default async function AboutPage({
    params,
}: AboutPageProps) {
    const { lang } = await params;

    if (!isLocale(lang)) {
        notFound();
    }

    const dictionary = await getDictionary(lang);
    const about = await getAbout(lang);

    if (!about) {
        return notFound();
    }


    return (
        <main>
            <Container>
                <section className="py-(--section-spacing-mobile) md:py-(--section-spacing-desktop)">
                    <div className="max-w-4xl">
                        <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) tracking-wide text-app-accent">
                            {dictionary.navigation.about}
                        </p>

                        <h1 className="mt-(--space-16) text-(length:--font-size-hero-mobile) font-semibold leading-(--line-height-hero) text-app-text-primary md:text-(length:--font-size-hero-desktop)">
                            {about.name}
                        </h1>

                        <p className="mt-(--space-16) text-(length:--font-size-body) font-medium leading-(--line-height-body) text-app-accent">
                            {about.headline}
                        </p>

                        <p className="mt-(--space-16) max-w-3xl whitespace-pre-line text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                            {about.introduction}
                        </p>


                        <div className="mt-(--space-24) flex flex-wrap gap-(--space-12)">
                            <a
                                href={`mailto:${about.email}`}
                                className="inline-flex min-h-10 items-center justify-center rounded-(--radius-control) bg-app-accent px-(--space-16) text-(length:--font-size-label) font-medium uppercase text-app-background transition-opacity duration-(--motion-fast) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                            >
                                EMAIL ↗
                            </a>

                            {about.cvUrl && (
                                <a
                                    href={about.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-10 items-center justify-center rounded-(--radius-control) border border-app-border bg-app-surface px-(--space-16) text-(length:--font-size-label) font-medium uppercase text-app-text-primary transition-colors duration-(--motion-fast) hover:border-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                                >
                                    DOWNLOAD CV ↓
                                </a>
                            )}
                        </div>

                    </div>
                </section>
                <div className="grid gap-(--space-20) md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
                    <div className="min-w-0">
                        <AboutExperience
                            experiences={about.experience}
                            title={dictionary.about.experience}
                            presentLabel={dictionary.about.present}
                        />

                        <AboutEducation
                            education={about.education}
                            title={dictionary.about.education}
                        />
                    </div>


                    <div className="flex min-w-0 flex-col gap-(--space-20)">
                        <AboutSkills
                            groups={about.skillGroups}
                            title={dictionary.about.skills}
                        />

                        <AboutLanguages
                            languages={about.languages}
                            title={dictionary.about.languages}
                        />

                        <AboutLinks
                            githubUrl={about.githubUrl}
                            linkedinUrl={about.linkedinUrl}
                            itchUrl={about.itchUrl}
                            title={dictionary.about.links}
                        />

                    </div>
                </div>

                <AboutAchievements
                    achievements={about.achievements}
                    title={dictionary.about.achievements}
                />

            </Container>
        </main>
    );

}