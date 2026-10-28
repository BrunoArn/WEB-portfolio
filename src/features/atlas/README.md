# Atlas preview — published Sanity content

The isolated preview is available at `/pt/atlas-preview` and `/en/atlas-preview`. The Home, shared navigation, global styles and standalone `atlas-poc` reference remain unchanged. This block connects content; composition refinements and further accessibility/performance review remain separate review steps.

## Content and boundaries

`src/sanity/repositories/atlas.ts` uses the existing Sanity client with the published perspective and a minimal read-only projection (IDs, titles, descriptions, categories, year, slug and cover). It does not fetch galleries or playable builds, write documents, change schemas, or expose client configuration to the browser. The repository follows the existing project's query conventions without adding dependencies.

`atlas-content.ts` adapts this response before it reaches the client, reusing the site's localized-value resolver and image adapter. It selects the requested PT/EN fields without silently borrowing another language. Missing titles, descriptions, categories, image assets/alt text and destinations are reported explicitly. Missing images retain placeholders; network image failures also switch to a placeholder. No images are inferred from filenames or galleries.

The six published document IDs were verified against Sanity and explicitly bound to the approved manual anchors in `atlas-composition.ts`. Identity does not depend on a translated title or changing sort order. Territory assignments are checked against actual category slugs: `game`, `web-development`, `interactive-experiences` and `vr`. Conflicting or unpositioned documents are listed in the collapsible content issues area, with their existing detail link when available, instead of receiving invented positions or categories.

Confirmed destinations:

| Published project | Existing slug |
| --- | --- |
| Bloomancer | bloomancer |
| Hungry Worm | hungry-worm |
| 2D RPG Project | 2d-rpg-project |
| Portfólio Gabriela / Gabriela's Portfolio | portfolio-gabriela |
| Forensic Injury Visualizer | forensic-injury-visualizer |
| VR Quintandinha | vr-quintandinha |

All six currently have a cover and localized text. Apple Academy · BGS 2019 is absent from published content and has no marker or fabricated card. Its former anchor remains as an art-directed landform, preserving the approved scalar field and spatial color influence. The seven landform anchors are now separate from the six content records. Future projects require an explicit manual placement; distribution is not automatic.

Images use the existing `next/image` pipeline and allowed Sanity CDN, in the same circular thumbnail element that expands into the card. Cards display the actual localized title, categories and description and link to `/{locale}/projects/{slug}`. Current cover crops are centered, consistent with the existing site; the Studio images currently contain no hotspot/crop data. Some current covers are banners or contain text; editorial framing and image selection can be reviewed in the next visual refinement block. Alt text comes from the CMS, including its currently generic labels; it is not rewritten by Atlas.

## Preserved rendering and interaction

`atlas-layout.ts` defines the fixed worlds, desktop 1440×790 and mobile 390×1160. The smooth scalar field, level curves and spatial category weights use those coordinates. Canvas and marker anchors share a uniform camera scale. Desktop fits between the shared header/footer with no vertical scrolling; mobile through 760 px follows width up to scale 1 and retains a taller map with document scrolling. Extra window space shows genuinely generated terrain rather than stretching the raster.

Selection retains the 720 ms camera/morph easing, zoom factors 1.85 desktop and 1.65 mobile, followed by a 220 ms card reveal. Map text starts returning immediately over 180 ms during closing. The same thumbnail DOM node moves out of its slot and back. Before movement, inverse-camera bounds extend both geometry and color coverage; closing restores the original terrain raster. There is no permanent animation loop or per-frame contour generation.

The native modal provides background inertness. Named project buttons, visible focus, Tab/Shift+Tab wrapping, Escape, outside dismissal and return focus remain supported. The card's detail link participates in keyboard navigation. Resize/reduced-motion changes and unmount restore selection, body styles and scrolling. Reduced motion skips transitions.

## Validation for this content block

ESLint, TypeScript and diff checks passed. Chromium rendering covered 16 PT/EN cases at 1440×900, 1000×700, 761×900, 760×900, 767×700, 390×844, 320×568 and 844×390. Across 96 card cycles, checks covered loaded real images, localized titles/descriptions, detail destinations, same-node morph, card bounds, keyboard/link focus, exact Canvas restoration and scroll restoration. Map labels/thumbnails stayed inside their frame without overlap or horizontal overflow; desktop remained without vertical scrolling. Representative desktop, phone, intermediate-width and card captures were visually inspected.

All 12 localized detail destinations returned HTTP 200 and their expected project headings. A real card link was also activated by keyboard. The four-size timing checks verified the card remains hidden while the thumbnail enlarges and map text returns during closing. Adapter checks covered missing cover/translation/slug, a new unpositioned document and changed category. A simulated network image failure rendered the placeholder while preserving navigation.

Scripts, content audit and captures are in the task workspace under `.work/atlas-sanity/`; timing captures are in `.work/atlas-timing/`. These are desktop Chromium viewport tests, not physical-device or other-browser tests. Screen-reader announcements, browser text enlargement and production performance remain to be reviewed. No CMS mutations or production deployment were performed.
