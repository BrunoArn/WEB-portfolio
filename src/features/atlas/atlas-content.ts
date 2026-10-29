import { resolveLocalizedValue, type LocalizedValue } from "@/content/adapters/localization";
import { adaptProjectImage } from "@/content/adapters/media";
import type { Locale } from "@/i18n/config";
import type { AtlasSanityData, AtlasSanityPosition } from "@/sanity/repositories/atlas";
import type { AtlasContent } from "./atlas-types";

function validPosition(value: AtlasSanityPosition | undefined): value is { x: number; y: number } {
  return !!value && [value.x, value.y].every(coordinate => typeof coordinate === "number" && Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 100);
}
const canonicalId = (id: string) => id.replace(/^drafts\./, "");

export function adaptAtlasContent(data: AtlasSanityData, locale: Locale): AtlasContent {
  const content: AtlasContent = { projects: [], territories: [], unplaced: [], issues: [] };
  const pt = locale === "pt";
  function localized(value: LocalizedValue | null | undefined, id: string, field: string) {
    try { return resolveLocalizedValue(value, locale); }
    catch { content.issues.push(`${id}: ${field} (${locale}) ${pt ? "indisponível" : "unavailable"}.`); return undefined; }
  }
  for (const row of data.territories) {
    const config = row.atlas;
    if (!config?.isTerritory) continue;
    const name = localized(config.label, row._id, "label");
    if (!name || !/^#[\da-f]{6}$/i.test(config.color ?? "") || !validPosition(config.desktop) || !validPosition(config.mobile)) {
      content.issues.push(`${row._id}: ${pt ? "configuração de território incompleta" : "incomplete territory settings"}.`);
      continue;
    }
    content.territories.push({ id: row._id, name, color: config.color!, x: config.desktop.x / 100, y: config.desktop.y / 100, mx: config.mobile.x / 100, my: config.mobile.y / 100 });
  }
  const territories = new Map(content.territories.map(territory => [territory.id, territory]));
  for (const row of data.projects) {
    const config = row.atlas;
    if (!config?.enabled) continue;
    const title = localized(row.title, row._id, "title") ?? (pt ? "Título indisponível" : "Title unavailable");
    const slug = row.slug?.current?.trim();
    const href = slug ? `/${locale}/projects/${encodeURIComponent(slug)}` : undefined;
    if (!href) content.issues.push(`${title}: ${pt ? "destino indisponível" : "destination unavailable"}.`);
    const categoryId = canonicalId(config.territory?._ref ?? "");
    const territory = territories.get(categoryId);
    const categories = (row.categories ?? []).filter(category => category != null);
    const influence = config.influence ?? 1;
    if (!territory || !categories.some(category => canonicalId(category._id) === categoryId) || !validPosition(config.desktop) || !validPosition(config.mobile) || !Number.isFinite(influence) || influence < .1 || influence > 2) {
      content.unplaced.push({ id: row._id, title, href });
      content.issues.push(`${title}: ${pt ? "confira território principal, posições e influência" : "check main territory, positions and influence"}.`);
      continue;
    }
    const categoryLabel = categories.map(category => localized(category.name, row._id, "category")).filter(Boolean).join(" · ");
    const description = localized(row.description, row._id, "description");
    let image;
    try { if (row.cover) image = adaptProjectImage(row.cover, locale); }
    catch { /* Preserve the explicit placeholder for incomplete image data. */ }
    if (!image) content.issues.push(`${title}: ${pt ? "capa ou texto alternativo indisponível" : "cover or alt text unavailable"}.`);
    const x = config.desktop.x / 100;
    content.projects.push({ id: row._id, placement: slug ?? row._id, c: territory.id, color: territory.color, x, y: config.desktop.y / 100, mx: config.mobile.x / 100, my: config.mobile.y / 100, influence, left: x > .65 || (x >= .2 && x <= .35), title, description, categoryLabel, href, image, year: row.year });
  }
  const used = new Set(content.projects.map(project => project.c));
  content.territories = content.territories.filter(territory => used.has(territory.id));
  return content;
}
