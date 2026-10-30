"use client";
import { useId } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { atlasMotionReference, type AtlasMotionSettings } from "./atlas-motion-settings";
import styles from "./AtlasMap.module.css";

export function AtlasMotionPanel({ labels, value, onChange }: { labels: Dictionary["atlas"]["motion"]; value: AtlasMotionSettings; onChange: (value: AtlasMotionSettings) => void }) {
  const id = useId();
  return <details className={`${styles.terrainPanel} ${styles.motionPanel}`} data-atlas-motion-controls open>
    <summary>{labels.title}</summary>
    <p>{labels.description}</p>
    <label className={styles.motionToggle}><input type="checkbox" checked={value.enabled} onChange={event => onChange({...value, enabled:event.currentTarget.checked})} />{labels.enabled}</label>
    {(["breath","pressure","mouseRadius","returnTime","selectionStrength"] as const).map(key => <label key={key} htmlFor={`${id}-${key}`}>
      <span>{labels.controls[key]} <output>{value[key]}{key === "mouseRadius" ? " px" : ""}</output></span>
      <input type="range" id={`${id}-${key}`} data-motion-control={key} min={key === "mouseRadius" ? 15 : 0} max={key === "mouseRadius" ? 80 : 100} value={value[key]} onChange={event => onChange({...value,[key]:Number(event.currentTarget.value)})} />
    </label>)}
    <p className={styles.reducedMotionNote}>{labels.reduced}</p>
    <button type="button" onClick={() => onChange({...atlasMotionReference})}>{labels.reset}</button>
  </details>;
}
