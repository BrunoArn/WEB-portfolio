"use client";
import { useId } from "react";
import { atlasTerrainControlKeys, atlasTerrainLimits, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { Locale } from "@/i18n/config";
import styles from "./AtlasPreview.module.css";

const names = {
  pt: {amplitude: "Amplitude", elongation: "Alongamento", direction: "Direção", connection: "Conexão", negativeSpace: "Respiro"},
  en: {amplitude: "Spread", elongation: "Elongation", direction: "Direction", connection: "Connection", negativeSpace: "Open space"},
};
export function AtlasTerrainPanel({ locale, mobile, value, onChange, onReset }: {
  locale: Locale; mobile: boolean; value: AtlasTerrainControls;
  onChange: (key: keyof AtlasTerrainControls, value: number) => void;
  onReset: () => void;
}) {
  const id = useId(), pt = locale === "pt";
  return <details className={styles.terrainPanel} data-atlas-controls>
    <summary>{pt ? "Ajustar relevo" : "Adjust terrain"} · {mobile ? (pt ? "celular" : "mobile") : "desktop"}</summary>
    <p>{pt ? "Teste local: não salva no Sanity. Para publicar, use Atlas — Topografia no Studio." : "Local preview: does not save to Sanity. Publish through Atlas — Topografia in Studio."}</p>
    {atlasTerrainControlKeys.map(key => <label key={key} htmlFor={`${id}-${key}`}>
      <span>{names[locale][key]} <output>{value[key]}{key === "direction" ? "°" : ""}</output></span>
      <input id={`${id}-${key}`} data-terrain-control={key} type="range" {...atlasTerrainLimits(key)} value={value[key]} onChange={event => onChange(key, Number(event.currentTarget.value))} />
    </label>)}
    <button type="button" onClick={onReset}>{pt ? "Restaurar referência" : "Restore reference"}</button>
  </details>;
}
