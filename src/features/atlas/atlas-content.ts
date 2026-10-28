import { resolveLocalizedValue, type LocalizedValue } from "@/content/adapters/localization";
import { adaptProjectImage } from "@/content/adapters/media";
import type { Locale } from "@/i18n/config";
import type { AtlasSanityProject } from "@/sanity/repositories/atlas";
import { atlasPlacements, atlasTerrainAnchors } from "./atlas-composition";
import type { AtlasContent, AtlasCategoryIndex } from "./atlas-types";

// These are actual category slugs, not names inferred from project titles.
const territories: Readonly<Record<string, AtlasCategoryIndex>> = {
  game: 0, "web-development": 1, "interactive-experiences": 2, vr: 2,
};

export function adaptAtlasContent(rows: readonly AtlasSanityProject[], locale: Locale): AtlasContent {
  const content: AtlasContent = { projects: [], unplaced: [], issues: [] };
  const pt = locale === "pt";
  function localized(value: LocalizedValue | null | undefined, id: string, field: string) {
    try { return resolveLocalizedValue(value, locale); }
    catch { content.issues.push(`${id}: ${field} (${locale}) ${pt ? "indisponível" : "unavailable"}.`); return undefined; }
  }
  for (const row of rows) {
    const title = localized(row.title, row._id, "title") ?? (pt ? "Título indisponível" : "Title unavailable");
    const slug = row.slug?.current?.trim();
    const href = slug ? `/${locale}/projects/${encodeURIComponent(slug)}` : undefined;
    if (!href) content.issues.push(`${title}: ${pt ? "destino indisponível" : "destination unavailable"}.`);
    const placement = atlasPlacements[row._id];
    const anchor = atlasTerrainAnchors.find(anchor => anchor.id === placement);
    if (!anchor) {
      content.unplaced.push({ id: row._id, title, href });
      content.issues.push(`${title}: ${pt ? "posicionamento manual pendente" : "manual placement pending"}.`);
      continue;
    }
    const categories = (row.categories ?? []).filter(category => category != null);
    const territory = categories.map(category => territories[category.slug?.current]).find(value => value !== undefined);
    if (territory === undefined || territory !== anchor.c) {
      content.unplaced.push({ id: row._id, title, href });
      content.issues.push(`${title}: ${pt ? "território requer revisão manual" : "territory needs manual review"}.`);
      continue;
    }
    const categoryLabel = categories.map(category => localized(category.name, row._id, "category")).filter(Boolean).join(" · ");
    const description = localized(row.description, row._id, "description");
    let image;
    try { if (row.cover) image = adaptProjectImage(row.cover, locale); }
    catch { /* Missing assets or localized alt text remain explicit placeholders. */ }
    if (!image) content.issues.push(`${title}: ${pt ? "capa ou texto alternativo indisponível" : "cover or alt text unavailable"}.`);
    content.projects.push({ ...anchor, id: row._id, placement, title, description, categoryLabel, href, image, year: row.year });
  }
  const occupied = new Set(content.projects.map(project => project.placement));
  for (const anchor of atlasTerrainAnchors) {
    if (!occupied.has(anchor.id)) content.issues.push(`${pt ? "Âncora sem projeto publicado" : "Anchor without a published project"}: ${anchor.id === "fixture-apple-academy" ? "Apple Academy · BGS 2019" : anchor.id.replace("fixture-", "")}.`);
  }
  return content;
}
