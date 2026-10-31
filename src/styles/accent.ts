import type { CSSProperties } from "react";

/** Scope the accent to one project/category; never inherit another project's color. */
export function accentStyle(color?: string): CSSProperties {
  return {
    "--color-accent": color ?? "var(--color-accent-default)",
  } as CSSProperties;
}
