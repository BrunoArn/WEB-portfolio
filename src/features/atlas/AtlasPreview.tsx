"use client";

import { useEffect, useId, useState, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { atlasTerrainReference, type AtlasTerrainSettings, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import { AtlasMotionPanel } from "./AtlasMotionPanel";
import { atlasMotionReference } from "./atlas-motion-settings";
import { AtlasTerrainPanel } from "./AtlasTerrainPanel";
import { AtlasThumbnail } from "./AtlasThumbnail";
import type { AtlasContent } from "./atlas-types";
import type { Locale } from "@/i18n/config";
import { atlasMobileQuery } from "./atlas-composition";
import { mountAtlasTerrain, positionAtlasProjects } from "./atlas-engine";
import styles from "./AtlasPreview.module.css";
import { mountAtlasInteraction } from "./atlas-interaction";
import { atlasWorlds } from "./atlas-layout";

const copy = {
  pt: {
    title: "Bruno Arnaud",
    description: "Um território de jogos, interfaces e experiências interativas.",
    projects: "Projetos do Atlas",
    unavailable: "Miniatura indisponível",
    close: "Voltar ao mapa",
    contentNote: "Descrição indisponível.",
    detail: "Ver projeto completo",
  },
  en: {
    title: "Bruno Arnaud",
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

type AtlasPreviewProps = { locale: Locale; content: AtlasContent; showTerrainControls?: boolean; showMotionControls?: boolean };

export function AtlasPreview({ locale, content, showTerrainControls = false, showMotionControls = false }: AtlasPreviewProps) {
  const text = copy[locale];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [motionSettings, setMotionSettings] = useState({ ...atlasMotionReference });
  const latestMotion = useRef(motionSettings);
  const terrainController = useRef<ReturnType<typeof mountAtlasTerrain> | null>(null);
  const [override, setOverride] = useState<{ source: AtlasTerrainSettings; value: AtlasTerrainSettings } | null>(null);
  const settings = override?.source === content.terrain ? override.value : content.terrain;
  const latestTerrain = useRef(settings);
  const pendingSettings = useRef<AtlasTerrainSettings | null>(null);
  const settingsFrame = useRef(0);
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
    let cancelled = false;
    const terrain = mountAtlasTerrain(canvas.current, viewport.current, intro.current, content.projects, content.territories, atlasMobileQuery, content.terrain,
      { staticFallback: webglFailed, onFallback: () => { if (!cancelled) setWebglFailed(true); } });
    terrainController.current = terrain;
    terrain.setMotion(latestMotion.current);
    terrain.setSettings(latestTerrain.current);
    const disposeInteraction = mountAtlasInteraction({ root: root.current, viewport: viewport.current, world: world.current, dialog: dialog.current, panel: panel.current, media: media.current, morph: morph.current }, terrain, content.projects, text.contentNote, setSelectedProjectId);
    return () => { cancelled = true; disposeInteraction(); terrain.dispose(); terrainController.current = null; };
  }, [locale, content.projects, content.territories, content.terrain, text.contentNote, webglFailed]);
  useEffect(() => { latestTerrain.current = settings; terrainController.current?.setSettings(settings); }, [settings]);
  useEffect(() => { latestMotion.current = motionSettings; terrainController.current?.setMotion(motionSettings); }, [motionSettings, locale, content]);
  useEffect(() => () => cancelAnimationFrame(settingsFrame.current), []);
  function updateControls(key: keyof AtlasTerrainControls, value: number) {
    const profile = mobile ? "mobile" : "desktop";
    const base = pendingSettings.current ?? settings;
    pendingSettings.current = { ...base, [profile]: { ...base[profile], [key]: value } };
    if (!settingsFrame.current) settingsFrame.current = requestAnimationFrame(() => {
      settingsFrame.current = 0;
      if (pendingSettings.current) setOverride({ source: content.terrain, value: pendingSettings.current });
      pendingSettings.current = null;
    });
  }
  function resetControls() {
    cancelAnimationFrame(settingsFrame.current); settingsFrame.current = 0; pendingSettings.current = null;
    setOverride({ source: content.terrain, value: { ...settings, [mobile ? "mobile" : "desktop"]: { ...atlasTerrainReference } } });
  }

  return (
    <main ref={root} className={styles.root} data-atlas-preview style={{ "--atlas-desktop-width": atlasWorlds.desktop.width, "--atlas-desktop-height": atlasWorlds.desktop.height, "--atlas-mobile-width": atlasWorlds.mobile.width, "--atlas-mobile-height": atlasWorlds.mobile.height } as CSSProperties}>
      <div className={styles.viewport} ref={viewport}>
        <div className={styles.world} ref={world}>
        <canvas key={webglFailed ? "static" : "webgl"} className={styles.canvas} ref={canvas} aria-hidden="true" />
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
                    <AtlasThumbnail image={project.image} unavailable={text.unavailable} selected={selectedProjectId === project.id} />
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
      {webglFailed && <p className={styles.fallbackNotice} role="status">{locale === "pt" ? "Visualização simplificada ativada." : "Simplified view enabled."}</p>}
      {showMotionControls && !webglFailed && <AtlasMotionPanel locale={locale} value={motionSettings} onChange={setMotionSettings} />}
      {showTerrainControls && <AtlasTerrainPanel locale={locale} mobile={mobile} value={settings[mobile ? "mobile" : "desktop"]} onChange={updateControls} onReset={resetControls} />}
    </main>
  );
}

