"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { atlasTerrainReference, type AtlasTerrainSettings, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { AtlasContent } from "./atlas-types";
import { atlasMotionReference } from "./atlas-motion-settings";
import { atlasMobileQuery } from "./atlas-composition";
import { mountAtlasTerrain } from "./atlas-engine";
import { mountAtlasInteraction } from "./atlas-interaction";
import { mountAtlasEntrance } from "./atlas-entrance";
type AtlasSceneOptions = {
    locale: Locale;
    content: AtlasContent;
    missingDescription: string;
};
function subscribeToLayout(callback: () => void) {
    const query = window.matchMedia(atlasMobileQuery);
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
}
function getLayout() {
    return window.matchMedia(atlasMobileQuery).matches;
}
function getServerLayout() {
    return false;
}
/** Connect React to the scene; no markup, translations or terrain formulas live here. */
export function useAtlasScene({ locale, content, missingDescription }: AtlasSceneOptions) {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [webglFailed, setWebglFailed] = useState(false);
    const [motionSettings, setMotionSettings] = useState({ ...atlasMotionReference });
    const latestMotion = useRef(motionSettings);
    const entranceFinished = useRef(false);
    const terrainController = useRef<ReturnType<typeof mountAtlasTerrain> | null>(null);
    // Overrides belong to this preview session; published settings stay untouched.
    const [override, setOverride] = useState<{
        source: AtlasTerrainSettings;
        value: AtlasTerrainSettings;
    } | null>(null);
    const settings = override?.source === content.terrain ? override.value : content.terrain;
    const latestTerrain = useRef(settings);
    const pendingSettings = useRef<AtlasTerrainSettings | null>(null);
    const settingsFrame = useRef(0);
    // Stable DOM refs connect the markup to the browser-only controllers.
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
    // Own the lifetime of the terrain, entrance and camera together.
    useEffect(() => {
        if (!canvas.current || !viewport.current || !intro.current)
            return;
        if (!root.current || !world.current || !dialog.current || !panel.current || !media.current || !morph.current)
            return;
        let cancelled = false;
        const terrain = mountAtlasTerrain(
            canvas.current,
            viewport.current,
            intro.current,
            content.projects,
            content.territories,
            atlasMobileQuery,
            content.terrain,
            {
                staticFallback: webglFailed,
                entrance: !entranceFinished.current,
                onReady: () => entrance?.start(),
                onFallback: () => {
                    if (!cancelled) setWebglFailed(true);
                },
            },
        );
        const entrance = mountAtlasEntrance(root.current, viewport.current, terrain, {
            skip: webglFailed || entranceFinished.current,
            onComplete: () => { entranceFinished.current = true; },
        });
        terrainController.current = terrain;
        terrain.setMotion(latestMotion.current);
        terrain.setSettings(latestTerrain.current);
        const disposeInteraction = mountAtlasInteraction(
            {
                root: root.current,
                viewport: viewport.current,
                world: world.current,
                dialog: dialog.current,
                panel: panel.current,
                media: media.current,
                morph: morph.current,
            },
            terrain,
            content.projects,
            missingDescription,
            setSelectedProjectId,
        );
        return () => {
            cancelled = true;
            entrance?.dispose();
            disposeInteraction();
            terrain.dispose();
            terrainController.current = null;
        };
    }, [locale, content.projects, content.territories, content.terrain, missingDescription, webglFailed]);
    useEffect(() => {
        latestTerrain.current = settings;
        terrainController.current?.setSettings(settings);
    }, [settings]);
    useEffect(() => {
        latestMotion.current = motionSettings;
        terrainController.current?.setMotion(motionSettings);
    }, [motionSettings, locale, content]);
    useEffect(() => () => cancelAnimationFrame(settingsFrame.current), []);
    // Coalesce continuous slider input into one settings update per frame.
    function updateControls(key: keyof AtlasTerrainControls, value: number) {
        const profile = mobile ? "mobile" : "desktop";
        const base = pendingSettings.current ?? settings;
        pendingSettings.current = { ...base, [profile]: { ...base[profile], [key]: value } };
        if (!settingsFrame.current)
            settingsFrame.current = requestAnimationFrame(() => {
                settingsFrame.current = 0;
                if (pendingSettings.current)
                    setOverride({ source: content.terrain, value: pendingSettings.current });
                pendingSettings.current = null;
            });
    }
    function resetControls() {
        cancelAnimationFrame(settingsFrame.current);
        settingsFrame.current = 0;
        pendingSettings.current = null;
        setOverride({ source: content.terrain, value: { ...settings, [mobile ? "mobile" : "desktop"]: { ...atlasTerrainReference } } });
    }
    return {
        refs: { root, canvas, viewport, intro, world, dialog, panel, media, morph },
        selectedProjectId, webglFailed, mobile,
        motionSettings, setMotionSettings,
        settings, updateControls, resetControls,
    };
}
