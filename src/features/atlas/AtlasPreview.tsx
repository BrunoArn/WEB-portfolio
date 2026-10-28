"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { atlasCategories, atlasMobileQuery, atlasProjects } from "./atlas-fixtures";
import { mountAtlasTerrain, positionAtlasProjects } from "./atlas-engine";
import styles from "./AtlasPreview.module.css";
import { mountAtlasInteraction } from "./atlas-interaction";
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
    close: "Voltar ao mapa",
    contentNote: "Prévia de interação. Conteúdo e imagens reais serão conectados na próxima etapa.",
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
    close: "Back to map",
    contentNote: "Interaction preview. Real content and images will be connected in the next step.",
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
  const dialogId = useId();
  const world = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const morph = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const mobile = useSyncExternalStore(subscribeToLayout, getLayout, getServerLayout);
  const positionedProjects = positionAtlasProjects(atlasProjects, mobile);

  useEffect(() => {
    if (!canvas.current || !viewport.current || !intro.current) return;
    if (!root.current || !world.current || !dialog.current || !panel.current || !media.current || !morph.current) return;
    const terrain = mountAtlasTerrain(canvas.current, viewport.current, intro.current, atlasProjects, atlasMobileQuery);
    const disposeInteraction = mountAtlasInteraction({ root: root.current, viewport: viewport.current, world: world.current, dialog: dialog.current, panel: panel.current, media: media.current, morph: morph.current }, terrain, locale);
    return () => { disposeInteraction(); terrain.dispose(); };
  }, [locale]);

  return (
    <main ref={root} className={styles.root} data-atlas-preview style={{ "--atlas-desktop-width": atlasWorlds.desktop.width, "--atlas-desktop-height": atlasWorlds.desktop.height, "--atlas-mobile-width": atlasWorlds.mobile.width, "--atlas-mobile-height": atlasWorlds.mobile.height } as CSSProperties}>
      <div className={styles.viewport} ref={viewport}>
        <div className={styles.world} ref={world}>
        <canvas className={styles.canvas} ref={canvas} aria-hidden="true" />
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
                  <button type="button" className={styles.trigger} data-atlas-trigger aria-label={project.title[locale]} aria-haspopup="dialog" aria-expanded="false" aria-controls={dialogId} />
                  <span className={styles.thumbSlot}>
                  <span className={styles.thumb} role="img" aria-label={text.unavailable}>
                    <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="8" cy="9" r="1.5" />
                      <path d="m3 17 6-5 4 3 3-3 5 5" />
                    </svg>
                  </span>
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
        <div className={styles.intro} ref={intro}>
          <p className={styles.eyebrow}>{text.eyebrow}</p>
          <h1 className={styles.title}>{text.title}</h1>
          <p className={styles.description}>{text.description}</p>
        </div>

      </div>
      <dialog ref={dialog} id={dialogId} className={styles.dialog} aria-labelledby={dialogId + "-title"} aria-describedby={dialogId + "-description"}>
        <div ref={panel} className={styles.card}>
          <button type="button" className={styles.close} data-atlas-close>{text.close} <span aria-hidden="true">×</span></button>
          <div ref={media} className={styles.selectedMedia} />
          <div className={styles.selectedCopy}>
            <p className={styles.selectedCategory} data-atlas-category />
            <h2 id={dialogId + "-title"} data-atlas-title />
            <p id={dialogId + "-description"}>{text.contentNote}</p>
            <p className={styles.mediaNote}>{text.unavailable}</p>
          </div>
        </div>
        <div ref={morph} className={styles.morph} aria-hidden="true" />
      </dialog>
      <p className={styles.preview}>{text.preview} · {text.note}</p>
    </main>
  );
}

