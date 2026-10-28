import type { AtlasCategory, AtlasAnchor } from "./atlas-types";

// Approved art direction. Anchors define landforms independently of CMS content.
export const atlasCategories: readonly AtlasCategory[] = [
  { name: "Games", token: "--atlas-games" },
  { name: "Web", token: "--atlas-web" },
  { name: "Interactive", token: "--atlas-interactive" },
];

export const atlasTerrainAnchors: readonly AtlasAnchor[] = [
  { id: "fixture-bloomancer", c: 0, x: .43, y: .27, mx: .30, my: .29 },
  { id: "fixture-hungry-worm", c: 0, x: .25, y: .47, mx: .67, my: .39, left: true },
  { id: "fixture-2d-rpg", c: 0, x: .57, y: .48, mx: .28, my: .46 },
  { id: "fixture-gabriela", c: 1, x: .79, y: .24, mx: .53, my: .61, left: true },
  { id: "fixture-apple-academy", c: 2, x: .30, y: .76, mx: .29, my: .73 },
  { id: "fixture-forensic", c: 2, x: .73, y: .65, mx: .67, my: .80, left: true },
  { id: "fixture-quitandinha", c: 2, x: .62, y: .82, mx: .28, my: .88 },
];

export const atlasMobileQuery = "(max-width: 760px)";

// Document IDs confirmed against published Sanity content; no title matching.
export const atlasPlacements: Readonly<Record<string, string>> = {
  "8badf717-147b-4b5d-8277-0c03ce673092": "fixture-bloomancer",
  "19ce6aa3-6bae-47c7-8319-505d07c35ee1": "fixture-hungry-worm",
  "b89e0155-a7c4-49cb-80b4-156ba2c46df3": "fixture-2d-rpg",
  "7ca9a640-5c7b-4462-a499-d75b44590610": "fixture-gabriela",
  "43f143cd-9ae6-4696-9e24-9f16b95fb307": "fixture-forensic",
  "0bba11dd-47ef-4dbf-a98c-92b82728d689": "fixture-quitandinha",
};
