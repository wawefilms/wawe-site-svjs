# Opening → surge comparison (throwaway)

Question: which contact treatment makes the approved opening feel physically consumed by one passing body of water?

All three treatments were received positively; no winner was selected:

- **A / `?variant=erosion`** — local, staggered glyph erosion.
- **B / `?variant=carry`** — touched glyphs travel upward with lateral drift, then dissolve. Procedural displacement, not a fluid simulation.
- **C / `?variant=fade`** — local opacity loss through the contact band.

The 16:9 rectangle is only a placeholder for later card stacking, not a committed frame proportion.

## Run and compare

From `wawe-site-svjs`:

```sh
pnpm exec vite --config prototypes/vite.foundation.config.ts --host 127.0.0.1 --port 5175
```

Open http://127.0.0.1:5175/prototypes/ascii-surge/

**Everything is in DialKit**, top-right. Review contains the read-only state display, logo-contact selector, pause toggle, **Assets Ready**, and **Replay / reset**. Collapse the panel to watch unobstructed. The separate bottom control bar is gone.

1. Let the opening loop indefinitely.
2. Click **Assets Ready** to simulate readiness (not production loading).
3. Watch one upward surge consume the logo, followed by its upward trailing edge revealing the rectangle.
4. Replay clears readiness and resets the opening. Signal readiness again explicitly.
5. Pause during contact and change A/B/C to compare an identical frame.

`?paused=1` starts frozen at the approved opening. The variant is shareable via URL; numeric transition tuning is in memory. No CMS, video, playback, thumbnails, stacking, production routing, or new dependencies.

## Readiness and continuity

`motion.js`: loading → armed → surge → recede → settled. Only `signalReady()` can arm it; repeated signals are ignored until reset. No timeout pretends assets are ready. Reduced motion immediately settles, including on replay or when enabled mid-transition.

The handoff is **phase-aligned**: finish the live lap, then promote its next off-screen entrance. At the locked opening speed, alignment can take up to one lap (~4.86 seconds) after readiness. That is wave alignment, not a loading timer. Readiness/takeover never reset the field clock.

The continuation imports `../ascii-opening/approved-opening.json` directly. Opening overrides are not consumed here. The original study, its two logo modes, DialKit panel, artwork and JSON remain untouched.

`field.js` retains the reference waiting kernel and extends that same field rather than layering another wave. The early handoff blend finishes within 15% of the wash duration (capped at 0.35 seconds). Original lower-grid coordinates are preserved. Residue uses `max`, not additive foam; cream belongs only to active foam. Both edges always travel upward. Logo contact, water and the soft reveal use the shared edge geometry.

## Controls and pacing

- **Surge:** wash duration, crest band, edge relief, body ink.
- **Contact:** dissolution band, carry distance.
- **Recede:** duration, shared soft reveal band.

Numeric tuning is captured at surge start; replay applies subsequent edits without jumping a moving edge. A/B/C switches live, including while paused.

The new transition defaults are **2.1 seconds wash + 1.7 seconds recede**, down from 3.8 + 3.6. The approved opening speed is unchanged. Visible elapsed time is no longer capped to 50 ms per frame: dropped frames do not slow the whole sequence down. Pause and hidden tabs reset the frame timestamp, so hidden time is not replayed.

## Rendering changes and evidence

The original slow path issued thousands of per-glyph Canvas2D paint calls and rebuilt hundreds of reveal gradients every frame. The 50 ms clock cap compounded stalls by discarding elapsed time.

- The opening still uses its original whole-glyph Canvas2D rendering.
- During transition, a runtime-generated atlas batches glyphs into **one WebGL draw** per frame. This is the same water field, not an additional wave. Atlas colours use 64 blue-to-cream levels; all 12 ASCII glyphs remain available. No sprite download or rendering library.
- Canvas2D atlas fallback remains available when WebGL is absent or its context is lost. GPU resources are disposed on resize; replay reuses them.
- Noise lattice values are cached without changing the noise function; provably invisible cells are rejected early.
- The organic reveal mask is generated once per geometry/settings combination, then translated; settled/hidden logo work is skipped.
- State text and DialKit notifications update only when the displayed state changes, not every animation frame.

Same-machine headless Chrome rendering-work probe (not an all-device FPS guarantee):

| Viewport / DPR | Phase | Before p95 | After p95 |
| --- | --- | --- | --- |
| 1920×1080 / 2 | Surge | 10.4 ms | 3.3 ms |
| 1920×1080 / 2 | Recede | 18.8 ms | 2.8 ms |
| 2560×1440 / 2 | Recede, intermediate Canvas atlas | 22.2 ms | 3.4 ms with GPU batch |

The stall test previously advanced 0.88 animation seconds during 1.31 wall seconds (ratio 0.68); it now advances 1.30 during 1.31 (ratio 0.99). A cold real-time playback check had ~16.8 ms p95 frame intervals, but one ~100 ms initialization stall: cold GPU setup and real-device performance remain review items, not proof of perfect pacing on every device. The fallback has a higher rendering cost than GPU batching.

## First-frame asset constraint

The intro is itself the loading experience: **minimize its critical assets, paint early, and don't make users wait on an empty scene**. This requirement is recorded in `docs/idea.md` and the handoff for future production work.

Current low-risk preparation:

- Only the selected badge mask and one Plex font are needed, requested in parallel and preloaded.
- DialKit JS/CSS are requested after the opening has painted; review tooling never gates the first scene.
- No showreel assets, CMS, remote fonts, alternate masks or textures gate the opening.
- Glyph atlas/GPU initialization happens only when transition is needed, not before opening paint.

This is **not yet a complete cold-start/no-empty-state implementation**. The reference badge PNG is still 417,263 bytes and Plex is 14,708 bytes (uncompressed file sizes); the prototype still awaits their decode/load. Later work must evaluate a compact silhouette representation, delivery/caching and a lightweight first-frame fallback. Do not silently ship the current large mask or introduce more critical assets just because the prototype works on localhost.

## Validation / probes

```sh
node prototypes/ascii-surge/check.mjs
node prototypes/ascii-opening/measure-water.mjs
pnpm check
pnpm build
```

In browser DevTools on this study (normal motion):

```js
const probe = await import('./perf.js');
await probe.measure({ assertBudget: true }); // fixed viewport/DPR; warm per-frame work <16.7ms p95
await probe.measureClock();                  // intentional 100ms stalls; wall-time ratio within 10%
```

Both probes drive the actual page, not a replacement renderer. Use identical viewport/DPR and hardware when comparing. The performance budget can fail on software-only rendering, slow hardware or competing load; it is not a production-device guarantee.

Contract probe: hour-long waits remain loading, readiness latches, exactly one surge, reset, reduced motion, monotonic edges and sampled waiting/zero-age-takeover glyph calls match the reference (1e-7 px / 1e-9 ink tolerance). Browser checks cover DialKit-only controls, read-only state, live variants while paused, replay, settled count=1, mobile no horizontal overflow, reduced motion, and context-loss fallback. Fresh browser session: no runtime errors. `pnpm check`: 0 errors, 20 existing warnings in 4 files. Build passes with the existing adapter-auto deployment-target notice.

Files: `main.js` owns controls/clock; `motion.js` readiness/edges; `field.js` sampling/reveal; `glyph-atlas.js` batched paint/fallback. The local `window.surgeStudy` probe exposes `snapshot`, `ready`, `replay`, `pause`, `step` (paused only), and `selectVariant`.
