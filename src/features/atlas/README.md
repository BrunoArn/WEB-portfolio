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
- Independent composition regions add broad elevations or subtract valleys, matching the original art-directed model. Their own profile settings control placement, shape and strength; they are not tied to the presence of any project.
- The smooth coordinate warp, fixed contour density, minimum visible stroke width, varying stroke thickness, smoothing and filtering of tiny mobile loops remain. The introduction retains its local soft attenuation.
- The former Apple Academy project anchor remains removed. Independent composition regions are now editable sources of elevation or valleys, as requested. They can remain even without participating projects; an empty region list and zero projects produce zero terrain.
- Spatial color weights are calculated only from participating projects and their main territories, with contained transitions. No category creates an elevation merely by existing.

The field is calculated once per geometry build; sampling reuses the prepared project kernels and connections. It does not regenerate contours per animation frame.

## Preserved presentation and interaction

Worlds remain 1440×790 desktop and 390×1160 mobile. The field, extended terrain and HTML markers share world coordinates and a uniform camera scale. Desktop fits the available frame without document scrolling; mobile through 760 px retains its taller proportional map and document scrolling.

Camera/thumbnail motion lasts 400 ms, followed by a 220 ms downward card reveal. The image border disappears at the start of that reveal; the complete card keeps the territory border. Map text returns during closing and the external close button disappears immediately. Image, title and detail action link to the existing localized project page. Native modal semantics, keyboard focus, Escape, outside dismissal, reduced motion, resize interruption and cleanup remain.

Before movement, inverse-camera bounds extend both contours and spatial colors. Closing restores the exact original Canvas raster and scroll. There is no permanent animation loop.

## Current content audit

The published configuration contains six participating projects and three valid territories, with no adapter issues. VR Quintandinha uses its current published position; no hardcoded position is substituted. Apple Academy has no marker, terrain anchor or reserved influence.

## Validation

ESLint, TypeScript and diff checks passed. Pure-data/field checks verified the published settings, disabled versus deleted sources, changed position and influence, explicit priority, an additional synthetic fourth territory/project, deterministic field generation and an empty map with zero contours. All synthetic mutations were local copies; no Sanity documents were written.

Chromium rendered 12 PT/EN viewport cases at 1440×900, 761×900, 760×900, 390×844, 320×568 and 844×390. Across 72 card cycles, checks covered images, card/button bounds, category borders, image/title/detail link agreement, keyboard order, exact Canvas restoration and scroll restoration. Representative desktop, intermediate and phone screenshots were visually inspected. Targeted real-motion samples checked the 400/220 ms sequence and interrupted closing. Coverage checks sampled movement when opening each of the six projects on desktop and phone.

Audit data, tests and captures are in the task workspace under `.work/atlas-live-terrain/`. This is desktop Chromium viewport testing, not physical-device or other-browser verification. New configurations still require visual review of spacing and composition. No deployment, Home replacement or Studio document mutation was performed.

## Simple terrain controls

The single Studio entry **Atlas — Topografia** edits document `atlas-settings` (type `atlasSettings`). Desktop and mobile have independent profiles. The schema prevents duplicate/delete actions in the Studio UI, following the existing About singleton pattern. An absent or partial published document uses safe reference defaults; nothing is seeded or published automatically.

| Control | Range | Reference | Effect |
| --- | --- | --- | --- |
| Amplitude | 0–100 | 50 | Narrower/wider project footprints; project height remains its own influence setting. |
| Alongamento | 0–100 | 50 | Vertical-to-horizontal elongation at the current direction. |
| Direção | -90–90 degrees | 0 | Additional rotation of project formations. |
| Conexão | 0–100 | 50 | Strength of derived bridges and broad composition guidance. Natural overlap can remain at zero. |
| Respiro | 0–100 | 50 | Soft valley attenuation, opening space between masses. |

`shared/atlas-terrain-settings.ts` defines the common defaults, limits and defensive resolution for both apps. Studio sliders retain numeric entry and each profile has **Restaurar referência deste perfil**, which patches only the five controls. This edits the draft; publish to apply to the normal preview on reload.

The reference now restores the original additive/subtractive model: project field + auxiliary elevations - valleys. It is an adapted starting point for review, not an exact recreation of the old approved map or an approval claim. Auxiliary regions may create terrain independently of projects. Apple Academy is not represented as a project or an extra region.

For experiments open `/pt/atlas-preview?terrain=1` (also available in EN). Its collapsible panel changes only local state, with no CMS writes; reload discards those changes. Its restore button uses the same reference as Studio. The normal URL remains free of controls. Input changes are grouped into requested frames; the renderer updates its settings and invalidates only the relevant geometry cache, without remounting interaction handlers or recreating marker nodes. There is no permanent redraw loop.

Validation for this block: TypeScript and ESLint for the app/Studio; official schema validation with zero errors/warnings; Studio build; data/field checks including every control's effect, ranges/fallbacks, separate profiles and zero-project behavior; browser checks of all five sliders and exact reference restoration at desktop and phone sizes; marker node reuse; desktop/mobile override isolation; overrides discarded by reload; normal URL without controls. The 12 PT/EN viewport cases / 72 card cycles and the real-motion interruption checks passed with the new composition. Representative reference/panel screenshots were visually inspected. Scripts and captures are under `.work/atlas-terrain-controls/` in the task workspace.

The rendered Studio still requires login in the test session: authenticated field editing and the Studio reset button have not been exercised against real documents. No Studio deployment or Sanity mutation was performed. Physical-device and other-browser testing remain outstanding.

## Independent composition regions — recovered reference

The latest direction explicitly allows auxiliary masses independent of projects. `shared/atlas-composition-regions.ts` stores the eight named reference regions, representing four elevations/three valleys on desktop and three elevations/four valleys on mobile. These are the actual former art-direction sources, not deleted-project substitutes. The minimum-spanning connections and multiplicative replacement model were removed.

In Studio → **Atlas — Topografia → Regiões de composição**, each item has a name, elevation/valley type and separate desktop/mobile settings. Each profile supports enable/disable, center X/Y, intensity, preset shape (rounded/elongated/band) or custom width/height and rotation. Centers can range from -50 to 150 percent to support formations entering/exiting the viewport. Width/height are smooth Gaussian spreads, not hard rectangle bounds.

An absent `regions` field uses the reference list. Existing settings documents show a **Carregar regiões da referência no rascunho** button to materialize that list for editing. Explicit `[]` means no auxiliary regions. Disabling a region's profile removes its contribution only on that layout. Invalid region data is not replaced by an invented source. The color field still follows the participating projects/territories; without any projects, independent terrain uses a neutral mineral tone.

Default global values reproduce the old scalar formula for the same existing projects, without Apple Academy. Amplitude/elongation/direction adjust project and region footprints; Connection scales auxiliary elevations; Respiro scales valley depth. At the default values, positions/spreads/rotation/intensity match the former generator. Changing the source project set can still change the final picture and colors.

The numeric comparison checked 2048 desktop/mobile samples against the previous generator with the six current projects (unit project influence), with maximum absolute difference 6.67e-16. Independent regions with no projects, empty-list removal, profile disabling, intensity edits and defensive resolution were verified. Twelve PT/EN viewport cases / 72 card cycles passed with the recovered model, including keyboard and exact return-raster checks. ESLint, app/Studio TypeScript, official schema validation and Studio build passed. Representative desktop/mobile renderings were visually inspected; clean comparison captures and tests are in `.work/atlas-regions/`.

No published Sanity document was modified. Authenticated Studio form editing and other browsers/devices remain untested. This delivery changes only the preview and Studio configuration; the Home remains untouched.

## Project thumbnail hover

On devices with a fine pointer, hovering a project expands its circular thumbnail by 20% over 160ms, without moving the label or adding a background highlight behind the name. Keyboard focus receives the same cue. The effect applies only while the map is idle, leaves the approved card transition unchanged, and is disabled for touch-only devices and reduced motion. Browser checks covered expansion/exit, label stability, opening from hover, card size, return, keyboard focus, reduced motion and touch emulation without page errors.

## Card corner continuity

During the existing 220ms downward card reveal, the travelling image's lower corners interpolate from 15px to zero while its upper corners stay rounded. Reparenting the same thumbnail into the card therefore preserves its final shape. Closing captures all four current corner radii, including an interrupted reveal. Browser checks covered six project open/close cycles at 1440, 761, 760 and 390px, intermediate radius values, reveal interruption and reduced motion. TypeScript and ESLint passed. No camera timing or card framing was changed.
