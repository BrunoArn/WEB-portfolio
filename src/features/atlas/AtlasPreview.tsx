"use client";

import { useEffect, useId, useState, useRef, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import type { AtlasContent, AtlasProject } from "./atlas-types";
import type { Locale } from "@/i18n/config";
import { atlasMobileQuery } from "./atlas-composition";
import { mountAtlasTerrain, positionAtlasProjects } from "./atlas-engine";
import styles from "./AtlasPreview.module.css";
import { mountAtlasInteraction } from "./atlas-interaction";
import { atlasWorlds } from "./atlas-layout";

const copy = {
  pt: {
    title: <>Ideias que viram<br />experiências.</>,
    description: "Um território de jogos, interfaces e experiências interativas.",
    projects: "Projetos do Atlas",
    unavailable: "Miniatura indisponível",
    close: "Voltar ao mapa",
    contentNote: "Descrição indisponível.",
    detail: "Ver projeto completo",
  },
  en: {
    title: <>Ideas into<br />experiences.</>,
    description: "A landscape of games, interfaces and interactive experiences.",
    projects: "Atlas projects",
    unavailable: "Thumbnail unavailable",
    close: "Back to map",
    contentNote: "Description unavailable.",
    detail: "View full project",
  },
} as const;

function subscribeToLayout(callback: () => void) {
  const query = window.matchMedia(atlasMobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function getLayout() { return window.matchMedia(atlasMobileQuery).matches; }
function getServerLayout() { return false; }

function AtlasThumbnail({ image, unavailable }: { image: AtlasProject["image"]; unavailable: string }) {
  const [failed, setFailed] = useState(false);
  const available = image && !failed;
  return <span className={styles.thumb} role="img" aria-label={available ? image.alt : unavailable} data-atlas-missing={!available}>
    {available ? <Image src={image.src} alt="" fill sizes="460px" className={styles.thumbImage} onError={() => setFailed(true)} /> :
      <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 6-5 4 3 3-3 5 5" />
      </svg>}
  </span>;
}

type AtlasPreviewProps = { locale: Locale; content: AtlasContent };

export function AtlasPreview({ locale, content }: AtlasPreviewProps) {
  const text = copy[locale];
  const dialogId = useId();
  const world = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLAnchorElement>(null);
  const morph = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const mobile = useSyncExternalStore(subscribeToLayout, getLayout, getServerLayout);
  const positionedProjects = positionAtlasProjects(content.projects, mobile);

  useEffect(() => {
    if (!canvas.current || !viewport.current || !intro.current) return;
    if (!root.current || !world.current || !dialog.current || !panel.current || !media.current || !morph.current) return;
    const terrain = mountAtlasTerrain(canvas.current, viewport.current, intro.current, content.projects, content.territories, atlasMobileQuery);
    const disposeInteraction = mountAtlasInteraction({ root: root.current, viewport: viewport.current, world: world.current, dialog: dialog.current, panel: panel.current, media: media.current, morph: morph.current }, terrain, content.projects, text.contentNote);
    return () => { disposeInteraction(); terrain.dispose(); };
  }, [locale, content.projects, content.territories, text.contentNote]);

  return (
    <main ref={root} className={styles.root} data-atlas-preview style={{ "--atlas-desktop-width": atlasWorlds.desktop.width, "--atlas-desktop-height": atlasWorlds.desktop.height, "--atlas-mobile-width": atlasWorlds.mobile.width, "--atlas-mobile-height": atlasWorlds.mobile.height } as CSSProperties}>
      <div className={styles.viewport} ref={viewport}>
        <div className={styles.world} ref={world}>
        <canvas className={styles.canvas} ref={canvas} aria-hidden="true" />
        <div className={styles.projectPlane}>
          <ul className={styles.projects} aria-label={text.projects}>
            {positionedProjects.map(project => {
              const left = mobile ? project.x > .5 : project.left;
              return (
                <li
                  key={project.id}
                  data-atlas-project={project.id}
                  data-atlas-placement={project.placement}
                  className={`${styles.project} ${left ? styles.left : ""}`}
                  style={{ left: `${project.x * 100}%`, top: `${project.y * 100}%`, "--atlas-tone": project.color } as CSSProperties}
                >
                  <button type="button" className={styles.trigger} data-atlas-trigger aria-label={project.title} aria-haspopup="dialog" aria-expanded="false" aria-controls={dialogId} />
                  <span className={styles.thumbSlot}>
                    <AtlasThumbnail image={project.image} unavailable={text.unavailable} />
                  </span>
                  <span className={styles.label}>
                    <span className={styles.projectTitle}>{project.title}</span>
                    <small className={styles.projectMeta}>{project.categoryLabel}{project.year ? ` · ${project.year}` : ""}</small>
                  </span>
                </li>
              );
            })}
          </ul>
          {content.territories.map(territory => <div key={territory.id} data-atlas-territory={territory.id} className={styles.territory} aria-hidden="true" style={{ left: `${(mobile ? territory.mx : territory.x) * 100}%`, top: `${(mobile ? territory.my : territory.y) * 100}%`, color: territory.color }}>{territory.name}</div>)}
        </div>
        </div>
        <div className={styles.intro} ref={intro}>
          <h1 className={styles.title}>{text.title}</h1>
          <p className={styles.description}>{text.description}</p>
        </div>

      </div>
      <dialog ref={dialog} id={dialogId} className={styles.dialog} aria-labelledby={dialogId + "-title"} aria-describedby={dialogId + "-description"}>
        <div className={styles.cardFrame}>
          <button type="button" className={styles.close} data-atlas-close>{text.close} <span aria-hidden="true">×</span></button>
          <div ref={panel} className={styles.card}>
          <a ref={media} className={styles.selectedMedia} data-atlas-project-link />
          <div className={styles.selectedCopy}>
            <p className={styles.selectedCategory} data-atlas-category />
            <h2 id={dialogId + "-title"}><a className={styles.titleLink} data-atlas-project-link><span data-atlas-title /></a></h2>
            <p id={dialogId + "-description"} data-atlas-description />
            <p className={styles.mediaNote} data-atlas-media-note>{text.unavailable}</p>
            <a className={styles.detailLink} data-atlas-detail data-atlas-project-link hidden>{text.detail}</a>
          </div>
        </div>
        </div>
        <div ref={morph} className={styles.morph} aria-hidden="true" />
      </dialog>
    </main>
  );
}

