import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type AboutPageProps = {
    params: Promise<{ lang: string }>;
};

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