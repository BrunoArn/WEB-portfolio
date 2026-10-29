# Atlas preview — terrain driven by published Sanity projects

The isolated map is available at `/pt/atlas-preview` and `/en/atlas-preview`. Home, shared navigation, detail pages and the standalone `atlas-poc` reference remain unchanged.

## Content now controls the map

`getAtlasData()` uses the existing Sanity client, the published perspective, no CDN and `cache: no-store`. One minimal query reads project content plus Atlas settings and enabled category territories. Publishing and then reloading the preview reads the current configuration; there is no live subscription or Studio draft preview.

A project participates only when `atlas.enabled` is true and its settings are valid. Its desktop/mobile positions, influence and explicit main territory come from Sanity. The main territory must be one of its own categories and must have valid published territory settings. Other categories remain in the project's information but do not override priority. Missing/invalid settings are retained as adapter issues/unplaced entries, with no invented position or fallback territory. Missing cover data or image-load errors still use the placeholder.

Territory names, label positions and colors come from category Atlas settings. The renderer supports an arbitrary number of territory IDs/colors, without special slug mappings or a three-color limit. A territory appears on the map when at least one valid active project uses it. Changes to the territory color also affect its markers and card borders. Current label positions are used directly; the former category-specific CSS overrides for intermediate widths were removed.

There is no fixed project-ID table or manual source array. A newly published project with complete Atlas settings joins the map without a code edit. Deleting it or disabling its Atlas participation removes its marker, elevation and color influence. Manual positions remain editorial responsibilities; collision-free placement for arbitrary coordinates is not automatic.

## Terrain rules

`atlas-field.ts` prepares a smooth scalar field from the current project set:

- Every project contributes a smooth elliptical elevation multiplied by its configured influence (default 1). A territory represented by a single project receives a broader mobile footprint so it remains legible.
- Nearby elevations receive mild connecting shoulders selected by a deterministic minimum spanning forest. Same-territory neighbors are preferred; distant groups remain separate. Each connector is derived from two existing projects and disappears/recomputes when those sources change.
- The smooth coordinate warp, fixed contour density, minimum visible stroke width, varying stroke thickness, smoothing and filtering of tiny mobile loops remain. The introduction retains its local soft attenuation.
- No project-related or decorative positive elevation is held at an old fixed location. The former Apple Academy anchor and the old fixed shoulders/valleys were removed. With zero participating projects, the scalar field is exactly zero and no terrain contours are drawn.
- Spatial color weights are calculated only from participating projects and their main territories, with contained transitions. No category creates an elevation merely by existing.

The field is calculated once per geometry build; sampling reuses the prepared project kernels and connections. It does not regenerate contours per animation frame.

## Preserved presentation and interaction

Worlds remain 1440×790 desktop and 390×1160 mobile. The field, extended terrain and HTML markers share world coordinates and a uniform camera scale. Desktop fits the available frame without document scrolling; mobile through 760 px retains its taller proportional map and document scrolling.

Camera/thumbnail motion lasts 400 ms, followed by a 220 ms downward card reveal. The image border disappears at the start of that reveal; the complete card keeps the territory border. Map text returns during closing and the external close button disappears immediately. Image, title and detail action link to the existing localized project page. Native modal semantics, keyboard focus, Escape, outside dismissal, reduced motion, resize interruption and cleanup remain.

Before movement, inverse-camera bounds extend both contours and spatial colors. Closing restores the exact original Canvas raster and scroll. There is no permanent animation loop.

## Current content audit

The published configuration contains six participating projects and three valid territories, with no adapter issues. The configured VR Quintandinha desktop X is **32**, as published by the user; no former hardcoded position is substituted. Apple Academy has no marker, terrain anchor or reserved influence.

## Validation

ESLint, TypeScript and diff checks passed. Pure-data/field checks verified the published settings, disabled versus deleted sources, changed position and influence, explicit priority, an additional synthetic fourth territory/project, deterministic field generation and an empty map with zero contours. All synthetic mutations were local copies; no Sanity documents were written.

Chromium rendered 12 PT/EN viewport cases at 1440×900, 761×900, 760×900, 390×844, 320×568 and 844×390. Across 72 card cycles, checks covered images, card/button bounds, category borders, image/title/detail link agreement, keyboard order, exact Canvas restoration and scroll restoration. Representative desktop, intermediate and phone screenshots were visually inspected. Targeted real-motion samples checked the 400/220 ms sequence and interrupted closing. Coverage checks sampled movement when opening each of the six projects on desktop and phone.

Audit data, tests and captures are in the task workspace under `.work/atlas-live-terrain/`. This is desktop Chromium viewport testing, not physical-device or other-browser verification. New configurations still require visual review of spacing and composition. No deployment, Home replacement or Studio document mutation was performed.
