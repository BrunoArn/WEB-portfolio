import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AtlasPreview } from "@/features/atlas/AtlasPreview";
import { isLocale } from "@/i18n/config";

type AtlasPreviewPageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({
  params,
}: AtlasPreviewPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return {
    title: lang === "pt" ? "Atlas — Prévia" : "Atlas — Preview",
    robots: { index: false, follow: false },
  };
}

export default async function AtlasPreviewPage({
  params,
}: AtlasPreviewPageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return <AtlasPreview locale={lang} />;
}
