"use client";

import type { Locale } from "@/i18n/config";

import styles from "./AtlasPreview.module.css";

const copy = {
  pt: {
    preview: "ATLAS / PRÉVIA",
    eyebrow: "DISCOVERY THROUGH INTERACTION",
    title: <>Ideias que viram<br />experiências.</>,
    description: "Um território de jogos, interfaces e experiências interativas.",
    stageTitle: "Preparando a paisagem",
    stageDescription: "Os projetos vão habitar este espaço.",
  },
  en: {
    preview: "ATLAS / PREVIEW",
    eyebrow: "DISCOVERY THROUGH INTERACTION",
    title: <>Ideas into<br />experiences.</>,
    description: "A landscape of games, interfaces and interactive experiences.",
    stageTitle: "Preparing the landscape",
    stageDescription: "Projects will inhabit this space.",
  },
} as const;

type AtlasPreviewProps = {
  locale: Locale;
};

/** Isolated preview shell. The approved terrain joins this component in block 2. */
export function AtlasPreview({ locale }: AtlasPreviewProps) {
  const text = copy[locale];

  return (
    <main className={styles.root} data-atlas-preview>
      <div className={styles.intro}>
        <p className={styles.preview}>{text.preview}</p>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.description}</p>
      </div>

      <section className={styles.stage} aria-labelledby="atlas-stage-title">
        <h2 id="atlas-stage-title" className={styles.stageTitle}>
          {text.stageTitle}
        </h2>
        <p className={styles.stageDescription}>{text.stageDescription}</p>
      </section>
    </main>
  );
}
