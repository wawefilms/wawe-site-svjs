# Morphing stack → showreel (throwaway comparison)

**Question:** which large-showreel entrance belongs with the accepted water reveal and the bottom-left morphing stack? No entrance has been selected yet.

## Open

From `wawe-site-svjs`:

```sh
pnpm exec vite --config prototypes/vite.foundation.config.ts --host 127.0.0.1 --port 5175
```

http://127.0.0.1:5175/prototypes/ascii-stacking/

Three shareable variants (the thumbnail motion and final layout are shared):

- `?entrance=recede` — **A:** the existing recede uncovers the hero in its final footprint while the stack builds below.
- `?entrance=card` — **B:** the front project lifts/expands upward into the hero while its thumbnail remains underneath. The moving frame blends from the project into the separate local showreel footage.
- `?entrance=unfurl` — **C:** the hero opens upward inside its final footprint during the rightward unfurl.

`?variant=erosion|carry|fade` still selects logo contact; `?paused=1` freezes the opening. The accepted baseline remains at `../ascii-surge/`.

## Review in DialKit

All controls are in the top-right panel; collapse it to see the whole composition.

- **Assets Ready · full arc:** after real media has loaded, latch readiness for the next off-screen surge. It remains a manual review gate, not automatic production readiness.
- **Replay new segment:** begin at recede onset, avoiding the opening hold/wash for comparison.
- **Entrance:** switch at the same timeline position, including while paused.
- **Paused:** freezes the animation **and video playback**.
- **Scrub:** seek 0–100% from recede onset to the settled composition; seeking pauses.
- **Speed:** 0.2–1× review playback, including videos. Defaults do not retune the accepted opening.
- **View final composition:** jump to the static settled frame.
- **Reset to opening:** clear readiness and return to the indefinite hold.
- **Appearance → Background:** live selector for original Ink Navy and three darker shades (72%, 45%, 25% of its RGB channels). Only the revealed scene changes; the accepted opening stays untouched. Share via `?background=ink|deep|midnight|nearBlack`.
- **Stacking → Stack Speed:** 0.5–3×, default **1.8×**. Speeds up project arrivals and native-ratio morphs independently of the logo prelude, separation and accepted water timing.
- **Layout → Bottom Padding:** live 0–180 px slider. Production defaults to matching the side gutter (`bottomPadding: null`); development controls can override it. Padding is capped at 30% of the viewport height to retain space for the scene.
- **Spreading → Spread Speed:** exposed slider, 0.5–6×; higher is faster. Default **2.4×** gives a **0.75-second** rightward sweep (previously 1.8 seconds). Applies on replay; does not change initial stacking speed.
- **Stacking:** arrival spacing and morph duration (before Stack Speed), **Viscosity** (separation joins, not stacked-image coverage) and **Wobble** (edge deformation, **0.01 steps**). Motion settings apply on the next replay/readiness signal, not mid-flight.

Scrub is a manual seek control, not an automatically updating progress meter. Default continuation length is **3.26 seconds on desktop**, **2.73 seconds with three mobile projects**, or **2.55 seconds with two**, measured from recede onset and including the unchanged 1.7-second recede. The hero and first project preview play muted/looping after settlement unless paused or reduced motion is enabled.

## Agreed motion

- The new sequence remains behind the **same soft reveal edge**; nothing paints ahead of the water. The logo grows from a small circle at the shared stack centre during 0.42–0.78 s after recede onset, then projects start at 0.90 s. The delay keeps the circle growth visible instead of hiding it under the water.
- The stack occupies the bottom-left region. **Incoming faces and the whole native-ratio morph have a fixed centre**, never a bottom-corner origin. Completed incoming faces fully own the outline: no previous-image rim, no delayed underlying shapes, and no repeated smooth-min expansion of coincident stack layers.
- **Reverse birth order:** for final row A → B → C, stack C → B → A. The last stacked project is the first active preview in the final row. This is not cue synchronisation with the separate local showreel.
- Image content is proportionally cropped, not stretched. Growing faces have a narrow advancing material boundary; during separation, nearest-surface colouring carries images through the joins.
- Cards use **one WebGL2 signed-distance-field surface** with pinching/drooping joins and subtle simplex-noise surface tension. Viscose helpers are adapted with attribution in `FLUID-LICENSE.txt`; departure choreography follows the user's leave-behind refinement. No broad per-card bending.
- **Continuous travelling stack:** one distance-based, constant-speed sweep from the logo centre to the last project slot. Cards are deposited at their slot centres without stopping or restarting the remaining stack; slot widths interpolate separately from translation. Deposited cards stay fixed. Liquid joins briefly persist across successive deposits.
- **Moving-stack perspective:** up to 0.14 radians (~8°) of Y-axis tilt. The shader inverse-projects both the silhouette and artwork; liquid joins meet the same anchored centres. Deposited cards and the logo are flat. Reduced motion goes directly to the static composition.
- Wobble and joins relax to zero at settlement. Settled surface caching remains available when source frames are unchanged; the active first preview normally keeps its texture updating.
- **Full-size logo base:** after its circle-growth prelude, the badge never shrinks to fit an incoming project. New imagery occludes its full-size artwork. It stays behind first when projects move right. **Logo in stack** makes it a seventh SDF element from the first project arrival, clipped by the contact-led envelope rather than resized; it joins the departing projects viscously. Toggle under Stacking and replay, or open `?logoStack=1`.
- **Contact-led arrivals:** each new native-ratio image grows until it touches the previous envelope's first pair of edges. Before contact it does not reshape the old face. After contact the shared outline morphs towards the new aspect, with an analytic spring (mass 1, stiffness 100, damping 10) and a settled tail. Growth uses 42% of Morph duration; the remainder is the spring response.
- **Text is uncovered by the departing stack**, not a separately timed wipe/fade. Its clip follows the first project's trailing edge; it is painted behind the fluid surface, so the logo variant's neck can temporarily occlude it too.
- Desktop retains six projects. **Mobile keeps logo, identity and 2–3 projects in one bottom-anchored row**. Logo and cards now have the same layout height, with the badge's small optical inset. All six source projects still load for desktop resizing.
- **Hero is flush to the viewport top**, with side margins retained, square top corners and rounded bottom corners. Header review text hides during the scene. Hero/thumbnail slots still use cover cropping.
- **Bottom gutter equals the side gutter** (18 px on mobile; max(28 px, 5.2vw) on desktop). The row and hero height are recomputed around that gutter; logo/project row heights remain matched. The build centre is now the final logo centre, so the full-size base never has to relocate.
- The identity uses the existing self-hosted **Pilcrow Rounded Semibold**. Darker scene backgrounds are study-only Ink Navy shades, not changes to the global brand tokens.

## Actual media, not screenshot crops

- **Projects:** read-only `https://cms.wawefilms.com/api/projects?limit=100&depth=2`.
- **Hero:** `/showreel-mock.webm`, served from `static/showreel-mock.webm`. This local placeholder is intentionally not in Payload.
- Six playable projects are selected by priority (null last), then newest. URLs, titles and aspect ratios come from real project/media records and decoded video dimensions.
- Prefer a supported WebM `smallFile`; MIME type, not filename extension, identifies media. Several CMS filenames have no conventional extension.
- Real image posters are loaded when present. Missing posters, or poster fields linked to a video, use a captured frame of that project's real video. Failed media can fall through to the next project; no synthetic-image fallback.
- The current data provides mostly 16:9 projects and a wider ~2.36:1 project. **No portrait ratios are fabricated** to exaggerate the morph.
- The user explicitly chose **keep native proportions** after confirming that the current 61 CMS media assets contain no portrait images/videos. Do not substitute portrait crops to manufacture more aspect-ratio variation in the stack.
- Only the arriving project preview plays during stacking, alongside the hero when its entrance permits. Earlier arrivals hold their last frame. The last-arriving/first-row project stays active through separation and settlement, independently of the local hero montage.
- The final identity says **SHOWREEL**, not a guessed project name: no cue map connects the local montage to CMS projects yet. The first wide thumbnail is a composition choice, not a claim that it matches the current showreel shot. Thumbnail clicking/navigation and cue synchronization remain out of scope.
- `assets/badge.png` is a small cream tint of the existing supplied logo artwork. The temporary screenshot crops were removed.

CMS and R2 do not grant this localhost origin CORS. `vite.foundation.config.ts` supplies fixed, dev-only `/__stacking-api` and `/__stacking-media` proxies, stripping Cookie/Authorization upstream. No credentials, CMS mutations, production configuration changes, downloaded media copies, or new dependencies are required.

The opening paints before project fetching, video decoding, the extra display font or DialKit are requested. The new scene waits for decoded media. This does **not** solve the existing cold-opening font/mask asset caveat documented in the surge handoff.

## Implementation boundary

- `main.js`: accepted motion clock + continuation clock, review controls, pause/visibility/reduced-motion coordination.
- `scene.js`: deterministic centred geometry, fluid parameters, single-row responsive layout, three hero entrances and muted preview coordination.
- `fluid.js`: cropped WebGL2 SDF render pass. A 4×2 atlas accommodates six projects plus the optional logo. Only visible surfaces contribute to the union; hidden cards stay stacked without inflating it. Uploads track changed images/video frames, including palette-dependent logo artwork; in-progress seeks are not mistaken for decoded frames. The surface is composited through the existing water mask.
- Shader unavailability/context loss uses plain-card fallback and explicitly reports it in DialKit; the full fluid effect requires WebGL2.
- `media.js`: read-only Payload loader and local showreel decoder.
- `../ascii-surge/field.js`: an optional fifth scene-painter argument paints into the existing card surface before the unchanged shared water mask. That optional scene surface now uses display resolution (capped at DPR 2), matching the fluid pass and output canvas, rather than upscaling a CSS-pixel raster. Without a painter, the accepted surge placeholder stays on its original path. Water, contact, clock and locked opening values were not retuned.

Reduced motion goes directly to the static final composition and does not play any videos. Hidden pages pause clocks and videos without catch-up. This is an isolated canvas study, not an accessible production video player or a CMS-backed showreel implementation.

## Checks performed

```sh
node --check prototypes/ascii-stacking/main.js
node --check prototypes/ascii-stacking/scene.js
node --check prototypes/ascii-stacking/media.js
node --check prototypes/ascii-stacking/fluid.js
node prototypes/ascii-stacking/check.mjs
node prototypes/ascii-surge/check.mjs
node prototypes/ascii-opening/measure-water.mjs
pnpm check
pnpm build
```

Browser checks: real API/decoded media; all three entrances; indefinite hold; readiness latch; one surge; recede/stack overlap; no premature reveal; identical final card geometry; pause/resume including video; hidden-page freeze; reduced-motion static state; WebGL context-loss fallback; 320×568 and 390×844 single-row layout without horizontal overflow. `pnpm check`: zero errors and 20 pre-existing warnings; build passes with existing large-chunk and adapter-auto deployment notices.

Regression checks cover fixed logo artwork geometry, portrait↔landscape first-edge contact (no incoming-driven resize before contact), spring overshoot/settlement, constant sweep velocity through deposits, flat stationary deposited cards, equal bottom/side gutters and responsive rows. GPU checks at DPR 1 / 2 retain crisp material transitions and opaque project/logo joins; perspective changes the silhouette's top edge by 4 / 4.5 CSS px in the diagnostic fixture and returns exactly flat at zero tilt. Complete top-face coverage remains verified at **zero wobble and viscosity 0 / 0.9 / 1.5**.

Run the GPU raster check in this study's browser console:

```js
(await import('./check-fluid.js')).checkFluid();
(await import('./check-fluid.js')).checkStackCoverage();
(await import('./check-fluid.js')).checkLogoStack();
(await import('./check-fluid.js')).checkPerspective();
```

The previous travelling-stack iteration measured ~16.7 ms p95 frame intervals at 1440×900 / DPR 2 across 260 frames; this is not a benchmark of the new perspective/contact refinement or an all-device FPS guarantee. The refinement was checked at DPR 1 / 2, 390×844 / 320×568, reduced motion and WebGL-loss fallback. Earlier checks covered loaded Pilcrow, Wobble **0.65**, all four backgrounds and the unchanged opening reveal. Safari/iOS, safe areas, cold loads and subjective motion quality still need review.

Debug entry point:

```js
const p = window.stackingStudy;
p.preview();
p.pause(true);
p.seek(2.8);                    // seconds after recede begins
p.selectEntrance('card');
p.snapshot();                   // state, settings, real media URLs, video playback
p.model();                      // current card rectangles
```

## References

- User's `stacking-pinterest.mp4`: accumulating cards, then lateral separation.
- User's supplied final-composition image: large hero and bottom logo / identity / thumbnail strip.
- [Viscose carousel](https://viscose-carousel.vercel.app/) and [its shader](https://github.com/Yousuf-developer/Viscose-carousel/blob/main/components/shaders/planeShaders.js): adapted SDF smooth minimum, swept pinched bridge and simplex noise, attributed under MIT in `FLUID-LICENSE.txt`. No reference artwork or fonts were copied.
- The reference was inspected with a manually stepped 60 Hz animation clock and [Carousel.jsx](https://github.com/Yousuf-developer/Viscose-carousel/blob/main/components/Carousel.jsx). Its cumulative fan informed the prior iteration; the user's subsequent clarification superseded that motion with a travelling remainder and stationary deposited cards.

**Next decision:** compare A/B/C with real footage, choose the hero entrance, then tune stack size, arrival rhythm, cropping and liquid-join strength. No final hero entrance is approved by this implementation.
