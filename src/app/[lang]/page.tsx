import { notFound } from "next/navigation";

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
      <p>{dictionary.navigation.home}</p>
      <p>{dictionary.navigation.projects}</p>
      <p>{dictionary.navigation.about}</p>
    </main>
  );
}