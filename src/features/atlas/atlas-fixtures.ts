import type { AtlasCategory, AtlasProject } from "./atlas-types";

// Explicit fixtures: no CMS identity, destination or image association is implied.
export const atlasCategories: readonly AtlasCategory[] = [
  { name: "Games", token: "--atlas-games" },
  { name: "Web", token: "--atlas-web" },
  { name: "Interactive", token: "--atlas-interactive" },
];

export const atlasProjects: readonly AtlasProject[] = [
  { id: "fixture-bloomancer", title: { pt: "Bloomancer", en: "Bloomancer" }, c: 0, x: .43, y: .27, mx: .30, my: .29 },
  { id: "fixture-hungry-worm", title: { pt: "Hungry Worm", en: "Hungry Worm" }, c: 0, x: .25, y: .47, mx: .67, my: .39, left: true },
  { id: "fixture-2d-rpg", title: { pt: "2D RPG Project", en: "2D RPG Project" }, c: 0, x: .57, y: .48, mx: .28, my: .46 },
  { id: "fixture-gabriela", title: { pt: "Portfólio da Gabriela", en: "Gabriela’s Portfolio" }, c: 1, x: .79, y: .24, mx: .53, my: .61, left: true },
  { id: "fixture-apple-academy", title: { pt: "Apple Academy · BGS 2019", en: "Apple Academy · BGS 2019" }, c: 2, x: .30, y: .76, mx: .29, my: .73 },
  { id: "fixture-forensic", title: { pt: "Forensic Injury Visualizer", en: "Forensic Injury Visualizer" }, c: 2, x: .73, y: .65, mx: .67, my: .80, left: true },
  { id: "fixture-quitandinha", title: { pt: "VR Quitandinha", en: "VR Quitandinha" }, c: 2, x: .62, y: .82, mx: .28, my: .88 },
];

export const atlasMobileQuery = "(max-width: 760px)";
