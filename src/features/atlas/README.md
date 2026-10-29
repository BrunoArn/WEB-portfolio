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

Before movement, inverse-camera bounds extend both contours and spatial colors. Closing restores the camera and scroll. With motion disabled, it also restores the exact original Canvas raster. Enabled breathing continues via the separate motion loop.

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

For experiments open `/pt/atlas-preview?terrain=1` (also available in EN). Its collapsible panel changes only local state, with no CMS writes; reload discards those changes. Its restore button uses the same reference as Studio. Terrain controls remain opt-in; motion controls are available through `?motion=1`. Input changes are grouped into requested frames; the renderer updates its settings and invalidates only the relevant geometry cache, without remounting interaction handlers or recreating marker nodes. Terrain changes do not introduce their own permanent redraw loop.

Validation for this block: TypeScript and ESLint for the app/Studio; official schema validation with zero errors/warnings; Studio build; data/field checks including every control's effect, ranges/fallbacks, separate profiles and zero-project behavior; browser checks of all five sliders and exact reference restoration at desktop and phone sizes; marker node reuse; desktop/mobile override isolation; overrides discarded by reload; normal URL without terrain controls. The 12 PT/EN viewport cases / 72 card cycles and the real-motion interruption checks passed with the new composition. Representative reference/panel screenshots were visually inspected. Scripts and captures are under `.work/atlas-terrain-controls/` in the task workspace.

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

## Lateral mobile composition

Mobile project elevations now use wider, shallower footprints and small rotations in the tall world. The reference mobile ridges also span across the screen, with shallower side valleys opening lateral passages. This changes the scalar sources, not a stretched or rotated canvas image. Project positions, territory color logic, camera/card behavior, world size, vertical scrolling and the entire desktop profile stay unchanged.

The mobile reference in `shared/atlas-composition-regions.ts` is also used by the existing Studio reference/reset controls. Published custom regions retain their explicit values; no Sanity data is patched automatically. At the time of validation, the published settings document was absent, so this preview uses the reference regions. Earlier numerical comparisons against the original field describe the previous mobile reference; only desktop retains that old formula now. Manual project placement remains the current approach.

Validation: PT/EN across 1440, 761, 760, 390, 320px and short landscape; six cards per case, keyboard focus/trap, image/link integrity, no marker overlap or horizontal overflow and exact canvas restoration. One EN/761 case was interrupted by a development refresh while documentation was edited; its full six-card rerun passed. Real-motion tests of all six cards at 390/760px also passed, including intermediate corner shapes, interrupted reveal and reduced motion. Clean mobile and 320px captures were visually inspected; desktop before/after screenshots have identical SHA-256 hashes. App TypeScript/ESLint passed. Tests and comparable captures are in `.work/atlas-mobile-lateral/` in the task workspace; physical devices and authenticated Studio editing were not tested.

## Living-terrain experiment — Canvas 2D

Open `/pt/atlas-preview` or `/en/atlas-preview`: motion is enabled by default with the approved settings and no adjustment panel. Add `?motion=1` to access the diagnostic panel. The Home remains unchanged. The collapsible panel controls breathing, line response, pointer reach and return time, with a live/static toggle and reset. Settings are local and reset on reload; nothing is written to Sanity. Fine-tuning is experimental, not an approved replacement for the reference.

Existing contour ribbons are prepared once per terrain/view update. A shared displacement field adds slow breathing; pointer and selection responses are calculated separately per contour. Ambient grid values are interpolated onto cached ribbon vertices; contour extraction, territory coloring and introduction masking are not repeated each animation frame. Project neighborhoods and the introduction receive less displacement. Geometry/color source positions and DOM markers remain fixed; the camera and card timing are unchanged. This deforms the established relief rather than creating/deleting formations.

The experiment targets at most 30 redraws/sec, uses elapsed-time smoothing, pauses when hidden or outside the viewport, stops when disabled or motion has settled with breathing off, and respects reduced motion. Touch input does not create a hover force; touch project selection still produces an impulse. Turning the experiment off restores the static raster. This uses Canvas 2D with no shader, added rendering dependency or changes to the Home. Physical-device battery/performance and other browsers still need assessment; local headless timings are diagnostic rather than device performance guarantees.

Validation: app TypeScript and feature ESLint passed. The normal preview passed 12 PT/EN viewport cases / 72 card cycles, including keyboard, focus, image/link integrity and exact return raster. The motion experiment passed six real-motion project cycles at 1440/390px and six selection-impulse cycles at 320/760/761px, touch-hover exclusion, settled idle, hidden/offscreen pause/resume and reduced-motion checks. Toggling motion off matched the normal static canvas byte-for-byte at 1440/390px; geometry build counts stayed stable during continuous movement. Rendered pressure frames were visually inspected. On this headless Chrome host, sampled displacement+draw work averaged 5.52ms desktop / 2.37ms at 390px (p95 6.7/3.0ms), excluding browser presentation; this is not a physical-phone benchmark. Scripts, captures and timings are in `.work/atlas-motion/` in the task workspace.

### Individual line response and earlier selection pulse

`atlas-string-response.ts` caches arc lengths, normals and sampled centerlines. Each contour independently finds its closest cursor contact, bends locally along its own normal away from the pointer, and relaxes with the return-time control. Distance determines intensity; contours on opposite sides of the pointer receive opposite physical responses, regardless of path winding. The existing breathing field is unchanged. This replaces the broad radial cursor displacement; it is an individual-strand approximation, not a full string/cloth simulation. Project and introduction protection still apply.

The selection impulse is painted synchronously when selection begins. It now strikes each contour at its own closest contact and sends two packets along that contour at 300 CSS px/sec, with a short attack and exponential decay. Its initial front starts beyond the exact contact to remain perceptible early. Existing camera and card timings remain unchanged.

The strand checks verified opposite sides, distance/arc-length falloff, reversed path orientation, return-time response and closed-loop continuity. Browser checks covered all six cards at desktop/390px and touch/selection/offscreen behavior at 320/760/761px, with static-raster restoration and reduced motion. For Hungry Worm at 1440/390/760px, the first opening-frame canvas already differed from the settled terrain while the camera animation time was still 0ms; early captures were inspected. No zoom/card duration changed. Latest tests and captures are in `.work/atlas-motion-strings/`; physical-device testing remains outstanding.

The approved mouse reach is 65 CSS px, and the affected arc-length span scales proportionally (84.5px). The panel exposes **Alcance do mouse / Pointer reach**, from 15 to 80 CSS px, without changing breathing or the selection pulse. Live/static comparison and the other motion controls remain available. These adjustments are local; reload restores the reference values.

Default-preview verification covered PT at 1440/390px and EN at 761/760px: motion without query parameters, all four controls, reach adjustment/reset, geometry reuse, live/static comparison, six card cycles per viewport, reduced motion and absence of horizontal overflow/page errors. TypeScript, ESLint and independent-strand tests passed. Desktop controls were visually inspected. Current scripts/captures are in `.work/atlas-motion-default/`; physical-device testing remains outstanding.

### Selection excites individual strands

The selection ring was removed from the shared displacement grid. Each contour receives its own signed impulse from its closest point to the selected project, using the same normal/contact logic as the pointer. Two local packets travel in opposite arc-length directions along that contour, with intensity based on source distance and a return-time-dependent decay. Closed contours use a smooth periodic packet distance. The pointer response and click impulse coexist as separate offsets on the same ribbon; ambient breathing, the four controls, camera timing and card layout are unchanged. Disabling motion or requesting reduced motion clears both responses.

Selection-strand validation: pure geometry checks covered signed/opposing responses, distance falloff, two arc-length packets, immediate response, reversed winding, simultaneous hover/strike state, closed-loop continuity and return-time decay. The normal preview passed 24 card cycles across PT 1440/390px and EN 761/760px, controls/reset, geometry reuse, live/static comparison, reduced motion and no overflow/page errors. Hungry Worm first-frame checks passed at 1440/390/760px while camera time was still 0ms; desktop/mobile captures were visually inspected. TypeScript and ESLint passed. Current tests/captures are under `.work/atlas-selection-strands/` in the task workspace. Physical-device evaluation remains outstanding.

### Stronger, adjustable selection impulse

The panel now includes **Impulso da seleção / Selection impulse** (0–100, default 75). Value 25 keeps the former amplitude scale; 75 applies three times that amplitude. Wave packets are slightly broader and decay more slowly, with a smooth final fade over a 1.15s lifetime. The response still starts immediately and travels along each individual contour. Zero disables only the selection impulse; breathing, pointer strength/reach, camera timing and card layout remain independent. The controls remain local and reset on reload.

Stronger-impulse validation: default strength is exactly 3x the former amplitude scale; zero strength removes the strike and the new envelope ends smoothly at zero. Strand/winding/closed-loop checks passed. The five-control preview passed 24 card cycles at PT 1440/390px and EN 761/760px, reset, geometry reuse, live/static comparison, reduced motion and no horizontal overflow/page errors. Hungry Worm still responds in the first opening frame at 1440/390/760px; a mobile opening capture was visually inspected. TypeScript and ESLint passed. Current scripts/captures are under `.work/atlas-selection-strength/`; physical-device evaluation remains outstanding.

## Camera-aware raster resolution

Before opening a project, the terrain renderer reserves backing-store density for the maximum camera zoom (1.85 desktop / 1.65 mobile). It redraws the contour ribbons at that density before the CSS camera transition starts, retains it through closing, and restores idle density only after the camera returns. Geometry, stroke widths, spatial colors, positions and animation durations are unchanged. This avoids magnifying a low-resolution terrain raster during the movement.

`atlas-raster.ts` uses the existing base device-density cap of 2, multiplied by the requested camera zoom. A 24-million-pixel / 8192-pixel-side budget bounds backing-surface allocation; extreme viewport/device combinations may therefore receive less than the requested density. Resolution changes do not affect the geometry cache key. No per-frame backing-store resize or progressive density change is introduced. The low-resolution color field remains a smooth tint/mask; actual contour edges are rasterized at the higher backing resolution. Physical high-DPI devices and battery/performance remain to be checked.

Raster validation: unit checks covered zoom/device density and pixel/side budgets. All six projects passed opening/closing at seven viewport/DPR combinations (42 cycles), including 760/761px layout boundaries, DPR 1/2/3 emulation and a budget-limited 1920px case. Higher density remained through opening/reveal/selection/closing; idle density and the exact static raster returned afterward. Mid-opening interruption was checked on desktop/mobile. At 1440px DPR 1 and 2, backing ratios rose from 1/2 to 1.85/3.7 respectively; before/after crops were captured and 1x crops visually compared. Local motion redraw work averaged 10.17ms (DPR1), 13.92ms (DPR2) on desktop, and 5.14ms at 390px DPR2; p95 was 15.9/18.6/7.9ms, excluding browser presentation. TypeScript, ESLint and diff checks passed. Scripts/captures are under `.work/atlas-zoom-quality/`; physical-device performance remains untested.

## Physical-phone access to the development server

The first S23 screenshots showed an empty canvas and server-rendered desktop marker positions. Reproduction through the machine's LAN IP found development font requests returning 403 and rejected HMR connections; the app remained unhydrated on both the LAN IP and 127.0.0.1 when started with hostname 0.0.0.0. `next.config.ts` now allows 127.0.0.1 plus this machine's assigned non-loopback IPv4 addresses through Next's development-only `allowedDevOrigins` option. It does not change production routes, Home content, the landscape or project data.

After the config reload, both origins loaded without failed resources/console errors, the mobile canvas drew 36 contours and the mobile project positions initialized correctly. LAN HTTP checks at 384x824 and 360x780 with DPR3/touch emulation passed all six tap-open/close cycles, active terrain and no horizontal overflow; the corrected 384px capture was visually inspected. TypeScript and config ESLint passed. Scripts/captures are under `.work/atlas-phone-network/`. The user subsequently confirmed the expected mobile behavior on the Samsung S23. This was a user functional check, not a device benchmark.

## Approved motion settings

The user selected: enabled, breathing **90**, line response **85**, pointer reach **65 CSS px**, return time **86**, selection impulse **75**. `atlasMotionReference` is the single default/reset source. Both locales run these settings on the normal preview with no adjustment panel. `?motion=1` exposes the same five controls for future diagnostics; hiding the panel does not disable motion. Diagnostic changes remain local and reload/reset restore the approved values. The Home is unchanged.

Approved-settings verification passed on PT desktop and LAN mobile (384px/DPR3), and EN at 761/760px: live motion without a normal-page panel, 24 total card cycles, diagnostic values matching the user selection, reset to those values and reload behavior. TypeScript and ESLint passed. Current script/capture: `.work/atlas-motion-approved/` in the task workspace. The user confirmed mobile functionality on the Samsung S23; no instrumented battery or device-performance benchmark was performed.

## Final integration review — 2026-10-29

The preview heading is **Bruno Arnaud** in PT/EN. The approved motion defaults, no-panel normal route and optional `?motion=1` diagnostics remain unchanged. The existing Home routes and the standalone prototype were preserved.

Production validation used an isolated copy of the current tracked sources and dependencies, built with Next 16.3.6/Turbopack. The test copy's Turbopack root was widened only to include its linked local dependencies; product configuration was not changed for this. The original development server stayed available. Root lint, TypeScript/production compilation, Studio build and official schema validation passed.

The published Sanity document was checked against rendered Canvas settings: desktop amplitude 52, mobile amplitude 50, remaining controls at reference values, eight saved regions and seven active per layout. A local change/reset did not write to Sanity; reload restored the published values. Six projects and three territories had no PT/EN content issues. The agent did not automate a new authenticated Studio edit/publication.

Browser coverage included 12 PT/EN viewport cases / 72 card cycles, real images and links, visible focus and modal keyboard trapping, scroll/raster restoration, no overlapping/out-of-bounds markers or horizontal overflow, all 12 localized detail destinations, desktop/mobile language switching, image-to-detail navigation and working browser-back restoration. Preview robots metadata stays noindex. Both existing Home pages were checked separately.

Two review fixes were added. A queued motion frame now applies the stop policy when motion becomes disallowed, ensuring an in-session reduced-motion change clears deformation and restores the exact static raster; resume, zoom interruption and scroll cleanup were verified at 1440/384/760px. The terrain raster is cropped to the remaining camera envelope at 120ms and to the settled camera window after opening; the complete generated terrain domain stays cached and full return coverage is restored before closing. Requested zoom density and camera/card durations are unchanged, with no per-frame backing-store resize. Allocation-budget limits can still affect actual density on extreme viewports.

Thirty moving card cycles plus ten early/mid-opening interruptions at desktop DPR2, mobile DPR3, 760/761px and short landscape confirmed raster coverage of every sampled viewport edge, terrain-geometry reuse and full idle restoration. In-page sampling on this headless host improved steady selected-map redraws at desktop DPR2 from about 9.8 to 27.9/sec; whole-transition samples stayed around 25–28/sec across the measured profiles. These are local software/browser measurements, not physical-device guarantees. Clean desktop/mobile production captures were visually inspected. The crop optimization itself has not been retested on a physical S23.

Current scripts, captures and reports are under `.work/atlas-final/` in the task workspace. Home replacement and deployment were not performed; the explicit approval step remains.
