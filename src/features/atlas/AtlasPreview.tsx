"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { atlasCategories, atlasMobileQuery, atlasProjects } from "./atlas-fixtures";
import { mountAtlasTerrain, positionAtlasProjects } from "./atlas-engine";
import styles from "./AtlasPreview.module.css";
import { atlasWorlds } from "./atlas-layout";

const copy = {
  pt: {
    preview: "ATLAS / PRÉVIA",
    eyebrow: "DISCOVERY THROUGH INTERACTION",
    title: <>Ideias que viram<br />experiências.</>,
    description: "Um território de jogos, interfaces e experiências interativas.",
    projects: "Projetos do Atlas",
    unavailable: "Miniatura indisponível",
    imageNote: "sem miniatura",
    note: "Imagens indisponíveis · categorias provisórias",
  },
  en: {
    preview: "ATLAS / PREVIEW",
    eyebrow: "DISCOVERY THROUGH INTERACTION",
    title: <>Ideas into<br />experiences.</>,
    description: "A landscape of games, interfaces and interactive experiences.",
    projects: "Atlas projects",
    unavailable: "Thumbnail unavailable",
    imageNote: "no thumbnail",
    note: "Images unavailable · provisional categories",
  },
} as const;

function subscribeToLayout(callback: () => void) {
  const query = window.matchMedia(atlasMobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function getLayout() { return window.matchMedia(atlasMobileQuery).matches; }
function getServerLayout() { return false; }

type AtlasPreviewProps = { locale: Locale };

export function AtlasPreview({ locale }: AtlasPreviewProps) {
  const text = copy[locale];
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const mobile = useSyncExternalStore(subscribeToLayout, getLayout, getServerLayout);
  const positionedProjects = positionAtlasProjects(atlasProjects, mobile);

  useEffect(() => {
    if (!canvas.current || !viewport.current || !intro.current) return;
    return mountAtlasTerrain(canvas.current, viewport.current, intro.current, atlasProjects, atlasMobileQuery);
  }, []);

  return (
    <main ref={root} className={styles.root} data-atlas-preview style={{ "--atlas-desktop-width": atlasWorlds.desktop.width, "--atlas-desktop-height": atlasWorlds.desktop.height, "--atlas-mobile-width": atlasWorlds.mobile.width, "--atlas-mobile-height": atlasWorlds.mobile.height } as CSSProperties}>
      <div className={styles.viewport} ref={viewport}>
        <canvas className={styles.canvas} ref={canvas} aria-hidden="true" />
        <div className={styles.intro} ref={intro}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1 className={styles.title}>{text.title}</h1>
          <p className={styles.description}>{text.description}</p>
        </div>

        <div className={styles.projectPlane}>
          <ul className={styles.projects} aria-label={text.projects}>
            {positionedProjects.map(project => {
              const category = atlasCategories[project.c];
              const left = mobile ? project.x > .5 : project.left;
              return (
                <li
                  key={project.id}
                  data-atlas-project={project.id}
                  className={`${styles.project} ${left ? styles.left : ""}`}
                  style={{ left: `${project.x * 100}%`, top: `${project.y * 100}%`, "--atlas-tone": `var(${category.token})` } as CSSProperties}
                >
                  <span className={styles.thumb} role="img" aria-label={text.unavailable}>
                    <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="8" cy="9" r="1.5" />
                      <path d="m3 17 6-5 4 3 3-3 5 5" />
                    </svg>
                  </span>
                  <span className={styles.label}>
                    <span className={styles.projectTitle}>{project.title[locale]}</span>
                    <small className={styles.projectMeta}>{category.name} · {text.imageNote}</small>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className={`${styles.territory} ${styles.games}`} aria-hidden="true">GAMES</div>
          <div className={`${styles.territory} ${styles.web}`} aria-hidden="true">WEB</div>
          <div className={`${styles.territory} ${styles.interactive}`} aria-hidden="true">INTERACTIVE</div>
        </div>
      </div>
      <p className={styles.preview}>{text.preview} · {text.note}</p>
    </main>
  );
}

