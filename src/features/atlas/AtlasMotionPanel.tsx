"use client";
import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { atlasMotionReference, type AtlasMotionSettings } from "./atlas-motion";
import styles from "./AtlasPreview.module.css";

export function AtlasMotionPanel({ locale, value, onChange }: { locale: Locale; value: AtlasMotionSettings; onChange: (value: AtlasMotionSettings) => void }) {
  const id = useId(), pt = locale === "pt";
  const labels = pt ? {breath:"Respiração",pressure:"Resposta das linhas",returnTime:"Tempo de retorno",mouseRadius:"Alcance do mouse",selectionStrength:"Impulso da seleção"} : {breath:"Breathing",pressure:"Line response",returnTime:"Return time",mouseRadius:"Pointer reach",selectionStrength:"Selection impulse"};
  return <details className={`${styles.terrainPanel} ${styles.motionPanel}`} data-atlas-motion-controls open>
    <summary>{pt ? "Movimento · experimento" : "Motion · experiment"}</summary>
    <p>{pt ? "Passe o mouse entre as curvas ou abra um projeto. Desligue para comparar. Ajustes locais, sem salvar." : "Move between the contours or open a project. Turn off to compare. Local, unsaved adjustments."}</p>
    <label className={styles.motionToggle}><input type="checkbox" checked={value.enabled} onChange={event => onChange({...value, enabled:event.currentTarget.checked})} />{pt ? "Cenário vivo" : "Living landscape"}</label>
    {(["breath","pressure","mouseRadius","returnTime","selectionStrength"] as const).map(key => <label key={key} htmlFor={`${id}-${key}`}>
      <span>{labels[key]} <output>{value[key]}{key === "mouseRadius" ? " px" : ""}</output></span>
      <input type="range" id={`${id}-${key}`} data-motion-control={key} min={key === "mouseRadius" ? 15 : 0} max={key === "mouseRadius" ? 80 : 100} value={value[key]} onChange={event => onChange({...value,[key]:Number(event.currentTarget.value)})} />
    </label>)}
    <p className={styles.reducedMotionNote}>{pt ? "Seu dispositivo pede movimento reduzido: o cenário permanece estático." : "Your device requests reduced motion: the landscape stays still."}</p>
    <button type="button" onClick={() => onChange({...atlasMotionReference})}>{pt ? "Restaurar experimento" : "Reset experiment"}</button>
  </details>;
}
