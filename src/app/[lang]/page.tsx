import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const dictionary = await getDictionary(lang);

  return (
    <main>
      <Container>
        <p>{dictionary.navigation.home}</p>
        <p>{dictionary.navigation.projects}</p>
        <p>{dictionary.navigation.about}</p>
      </Container>
    </main>
  );
}