"use client";

import { useId, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

import { AtlasMotionPanel } from "./AtlasMotionPanel";
import { AtlasTerrainPanel } from "./AtlasTerrainPanel";
import { AtlasThumbnail } from "./AtlasThumbnail";
import { positionAtlasProjects } from "./atlas-engine";
import { atlasWorlds } from "./atlas-layout";
import type { AtlasContent } from "./atlas-types";
import { useAtlasScene } from "./useAtlasScene";
import styles from "./AtlasMap.module.css";

type AtlasMapProps = {
    locale: Locale;
    labels: Dictionary["atlas"];
    content: AtlasContent;
    showTerrainControls?: boolean;
    showMotionControls?: boolean;
};

const worldDimensions = {
    "--atlas-desktop-width": atlasWorlds.desktop.width,
    "--atlas-desktop-height": atlasWorlds.desktop.height,
    "--atlas-mobile-width": atlasWorlds.mobile.width,
    "--atlas-mobile-height": atlasWorlds.mobile.height,
} as CSSProperties;

/** React owns the interface; useAtlasScene owns the browser controllers and cleanup. */
export function AtlasMap({
    locale,
    labels: text,
    content,
    showTerrainControls = false,
    showMotionControls = false,
}: AtlasMapProps) {
    const dialogId = useId();
    const {
        refs,
        selectedProjectId,
        webglFailed,
        mobile,
        settings,
        updateControls,
        resetControls,
        motionSettings,
        setMotionSettings,
    } = useAtlasScene({ locale, content, missingDescription: text.contentNote });
    const { root, canvas, viewport, intro, world, dialog, panel, media, morph } = refs;
    const positionedProjects = positionAtlasProjects(content.projects, mobile);

    return (
        <main
            ref={root}
            className={styles.root}
            data-atlas-preview
            data-entry="pending"
            style={worldDimensions}
        >
            <noscript>
                <style>{`[data-atlas-preview] :is([data-atlas-project],[data-atlas-territory]){opacity:1!important;visibility:visible!important}`}</style>
            </noscript>

            <div className={styles.viewport} ref={viewport}>
                <div className={styles.world} ref={world}>
                    <canvas
                        key={webglFailed ? "static" : "webgl"}
                        className={styles.canvas}
                        ref={canvas}
                        aria-hidden="true"
                    />
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
                                        style={{
                                            left: `${project.x * 100}%`,
                                            top: `${project.y * 100}%`,
                                            "--atlas-tone": project.color,
                                        } as CSSProperties}
                                    >
                                        <button
                                            type="button"
                                            className={styles.trigger}
                                            data-atlas-trigger
                                            aria-label={project.title}
                                            aria-haspopup="dialog"
                                            aria-expanded="false"
                                            aria-controls={dialogId}
                                        />
                                        <span className={styles.thumbSlot} data-atlas-thumb-slot>
                                            <AtlasThumbnail
                                                image={project.image}
                                                unavailable={text.unavailable}
                                                selected={selectedProjectId === project.id}
                                            />
                                        </span>
                                        <span className={styles.label}>
                                            <span className={styles.projectTitle}>{project.title}</span>
                                            <small className={styles.projectMeta}>
                                                {project.categoryLabel}{project.year ? ` · ${project.year}` : ""}
                                            </small>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        {content.territories.map(territory => (
                            <div
                                key={territory.id}
                                data-atlas-territory={territory.id}
                                className={styles.territory}
                                aria-hidden="true"
                                style={{
                                    left: `${(mobile ? territory.mx : territory.x) * 100}%`,
                                    top: `${(mobile ? territory.my : territory.y) * 100}%`,
                                    color: territory.color,
                                }}
                            >
                                {territory.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.intro} ref={intro}>
                    <h1 className={styles.title}>{text.title}</h1>
                    <p className={styles.description}>{text.description}</p>
                </div>
            </div>

            {/* The interaction controller fills the card and moves the existing thumbnail.
                These data attributes are its contract with the React markup. */}
            <dialog
                ref={dialog}
                id={dialogId}
                className={styles.dialog}
                aria-labelledby={dialogId + "-title"}
                aria-describedby={dialogId + "-description"}
            >
                <div className={styles.cardFrame}>
                    <button type="button" className={styles.close} data-atlas-close>
                        {text.close} <span aria-hidden="true">×</span>
                    </button>
                    <div ref={panel} className={styles.card}>
                        <a ref={media} className={styles.selectedMedia} data-atlas-project-link />
                        <div className={styles.selectedCopy}>
                            <p className={styles.selectedCategory} data-atlas-category />
                            <h2 id={dialogId + "-title"}>
                                <a className={styles.titleLink} data-atlas-project-link>
                                    <span data-atlas-title />
                                </a>
                            </h2>
                            <p id={dialogId + "-description"} data-atlas-description />
                            <p className={styles.mediaNote} data-atlas-media-note>{text.unavailable}</p>
                            <a className={styles.detailLink} data-atlas-detail data-atlas-project-link hidden>
                                {text.detail}
                            </a>
                        </div>
                    </div>
                </div>
                <div ref={morph} className={styles.morph} aria-hidden="true" />
            </dialog>

            {webglFailed && <p className={styles.fallbackNotice} role="status">{text.fallback}</p>}
            {showMotionControls && !webglFailed && (
                <AtlasMotionPanel
                    labels={text.motion}
                    value={motionSettings}
                    onChange={setMotionSettings}
                />
            )}
            {showTerrainControls && (
                <AtlasTerrainPanel
                    labels={text.terrain}
                    mobile={mobile}
                    value={settings[mobile ? "mobile" : "desktop"]}
                    onChange={updateControls}
                    onReset={resetControls}
                />
            )}
        </main>
    );
}
