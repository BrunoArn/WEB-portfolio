"use client";
import { useId } from "react";
import { atlasTerrainControlKeys, atlasTerrainLimits, type AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./AtlasMap.module.css";

export function AtlasTerrainPanel({ labels, mobile, value, onChange, onReset }: {
  labels: Dictionary["atlas"]["terrain"]; mobile: boolean; value: AtlasTerrainControls;
  onChange: (key: keyof AtlasTerrainControls, value: number) => void;
  onReset: () => void;
}) {
  const id = useId();
  return <details className={styles.terrainPanel} data-atlas-controls>
    <summary>{labels.title} · {mobile ? labels.mobile : labels.desktop}</summary>
    <p>{labels.description}</p>
    {atlasTerrainControlKeys.map(key => <label key={key} htmlFor={`${id}-${key}`}>
      <span>{labels.controls[key]} <output>{value[key]}{key === "direction" ? "°" : ""}</output></span>
      <input id={`${id}-${key}`} data-terrain-control={key} type="range" {...atlasTerrainLimits(key)} value={value[key]} onChange={event => onChange(key, Number(event.currentTarget.value))} />
    </label>)}
    <button type="button" onClick={onReset}>{labels.reset}</button>
  </details>;
}
