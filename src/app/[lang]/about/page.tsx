import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

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

    return (
        <main>
            <Container>
                <h1>{dictionary.navigation.about}</h1>
            </Container>
        </main>
    );
}