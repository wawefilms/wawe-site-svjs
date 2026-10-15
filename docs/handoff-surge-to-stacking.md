# Handoff: accepted opening / surge → card stacking

## Continuation now available

The next-session discussion and comparison are implemented in [`prototypes/ascii-stacking/README.md`](../prototypes/ascii-stacking/README.md). The user agreed to a bottom-left aspect-ratio morphing stack, beginning with recede, short liquid joins during a rightward unfurl, and the departing cards uncovering the logo. **The hero entrance is still undecided:** compare recede reveal, growth from a card, and emergence during unfurl in DialKit.

Latest media instructions: use real projects/images/videos from `https://cms.wawefilms.com`; use `static/showreel-mock.webm` for the hero (it is not in Payload). The study now does both. No production integration or cue mapping is implied. The accepted surge remains the reference below; its only code extension is an optional scene-painter hook into the existing reveal surface, with no water or timing retuning.

Follow-up feedback rejected rigid card outlines/connector-only goo and corner-origin scaling. The stacking study now uses an attributed Viscose-style WebGL2 distance-field surface with blended centre-origin arrivals, wavy edges and pinching joins. Mobile keeps a bottom-anchored logo and identity in the same row as 2–3 projects. The user explicitly chose **native media proportions**, not invented portrait crops; the current CMS contains only landscape media. See the stacking README for renderer checks and remaining visual decisions.

**Latest direction implemented, awaiting visual review:** the user clarified “Viscose, but linearly to the right,” starting at the existing bottom-left stack's shared centre (not viewport centre). The study now aligns stack/strip on one horizontal axis, removes orbital rotation and bobbing, removes broad per-card bending, reduces wobble, tightens material transitions and uses DPR-aware fluid/scene compositing. Centred growth, native proportions, reduced mobile project count, accepted water motion and hero-entrance options remain. See the stacking README for updated raster checks. This is not final visual approval.

**Confirmed follow-up implemented (still awaiting visual approval):** top-flush hero with bottom-only rounding; Pilcrow Rounded identity; logo/card row heights aligned; Ink Navy-derived dark background selector; Wobble in 0.01 increments; zero-wobble stacked-image rim fixed independently of viscosity. A visible circle-to-logo prelude now precedes faster, reverse-order stacking (Stack Speed defaults to 1.8×). Separation was reobserved frame by frame and rewritten as Viscose's cumulative neighbour-relative peel, not simultaneous independent target tweens. The last stacked project remains the first active preview; the separate local montage and lack of cue mapping were explicitly confirmed. See the stacking README for timing and tests.

**Latest separation correction:** user clarified that the initial build must remain unchanged. After the completed stack moves right to the first slot, it leaves the top card fixed and carries the remaining stack onwards, depositing one card at each stop. This now replaces the cumulative fan. Added optional **Logo in stack** / `?logoStack=1` (logo is a seventh fluid element) and replaced the independent identity wipe with text physically uncovered by the departing stack. The original final row is preserved. Await visual review of both variants.

**Perspective/contact refinement:** user confirmed perspective on moving cards only and logo staying behind first (not literal last-out). Logo is now a full-size base at its final centre, never tucked/shrunk to fit arrivals. Incoming native-ratio images reach first edge contact before reshaping the shared outline with a damped spring. Per-slot stop/start easing is replaced by a constant-speed, distance-based sweep; deposited cards stay flat and fixed. Bottom gutter now equals the side gutter, with row/hero geometry recomputed. GPU perspective, logo/coverage, mixed-ratio contact, constant-speed and gutter regressions pass; reduced motion and fallback checked. Visual approval remains pending.

**Accepted and packaged:** user called the study complete and requested homepage integration. Production-owned source/assets now live in `src/lib/landing/` and mount from `src/routes/+page.svelte`; the prototype remains a separate reference. Added live development-only bottom padding and retained Spread Speed. Defaults: recede, midnight, logo base enabled, 0.75-second sweep, bottom gutter matching sides. SSR content, allowlisted streaming media, accessible player/Project links, bounded loading and cleanup replace the demo harness. See `docs/production-readiness.md` for checks and remaining deployment sign-offs; no deployment or commit was performed.

## Start here

Work only in `wawe-site-svjs`. Preserve all existing uncommitted work. Read:

1. `AGENTS.md`
2. `docs/idea.md` — authoritative full arc and first-visible-frame requirement.
3. `prototypes/ascii-opening/README.md` and `approved-opening.json` — locked opening.
4. `prototypes/ascii-surge/README.md` — current continuation, controls, performance evidence and caveats.
5. This handoff.

`docs/handoff-opening-to-surge.md` provides earlier context, not an instruction to restart that implementation.

## Latest user decision

The user reviewed the revised continuation and said: **“okay this looks good … we will fine tune if anything is needed later.”** Treat the current opening/surge/recede as the accepted working baseline. Do not reopen motion tuning, rebuild the opening, or optimize startup further without a concrete need in the next task.

All three logo-contact treatments were received positively; the user has not selected one exclusive winner. Preserve the selector. The default is local erosion, not a newly declared exclusive visual approval.

The placeholder rectangle's proportions remain deliberately undecided: it stands in for the stage where card stacking happens later.

## Current implementation

Isolated prototype: `prototypes/ascii-surge/`.

```sh
pnpm exec vite --config prototypes/vite.foundation.config.ts --host 127.0.0.1 --port 5175
```

http://127.0.0.1:5175/prototypes/ascii-surge/

- Locked opening JSON is consumed directly; original study is untouched.
- Opening loops indefinitely until manual **Assets Ready**.
- Readiness latches; the next off-screen entrance becomes exactly one surge, without resetting the live clock.
- Surge consumes the logo; the same-direction trailing edge reveals a placeholder rectangle.
- All review controls are in DialKit: state, contact treatment, pause, readiness, replay, transition tuning.
- Current transition defaults: 2.1 s wash + 1.7 s recede. The opening speed remains locked.
- Three contact treatments: local erosion, carried-away glyphs, soft contact fade.
- Reduced motion skips to the settled placeholder. Hidden tabs and pause do not accumulate catch-up time.
- No playback, real asset-loading gate, stacking, or production integration exists yet.

## Recommended next scope — confirm visual choices first

Design and implement the **card-stacking segment following the reveal**, leading into a static settled showreel composition, still as an isolated study.

Before implementation, ask for references or concrete choices about:

- What “stacking” means visually: card arrivals, overlap, direction, depth, and how the stack settles. The original brief intentionally leaves this undefined.
- The stage/frame proportions and its relationship to the viewport.
- Whether stacking begins while the recede is revealing the stage or only after that stage is exposed.
- The settled composition. Prior future context was a dominant showreel frame with a row below: logo | current project identity | thumbnails in showreel order. This is context to confirm, not a fully approved layout.

Use lightweight placeholder cards/stills initially. If the user is unsure, offer a small visual comparison study rather than choosing the entire interaction design silently. Keep the accepted transition available as the reference; extend it without retuning it. Put new segment controls in DialKit, not another floating panel.

Playback, thumbnail interactions, CMS wiring, real media readiness and production integration should remain later work unless explicitly requested. Do not silently broaden the next task into all of those.

## Contracts to carry forward

- Readiness, not a timeout, permits one surge. Repeated signals cannot restart it.
- Keep the live wave phase and shared soft reveal edge; no second water system or backward wipe.
- No premature card visibility ahead of the revealing water edge.
- Preserve the whole-glyph logo, palette, shared grid and locked opening preset.
- Keep replay/pause and reduced-motion settled-state behavior as the end state evolves.
- The intro is itself the loading experience. Its critical assets must be minimal, fast and independent of showreel media/CMS/tooling; an empty intro-loading screen is not the intended product experience.
- Detailed startup optimization is deferred. The prototype still awaits a ~417 KB reference badge mask and ~15 KB font; a compact representation and lightweight first-frame fallback are not yet implemented. Do not mistake localhost success for solved startup.

## Performance / checks

The slow/choppy renderer was revised: uncapped visible elapsed time, cached noise and reveal mask, and a runtime glyph atlas batched into one WebGL draw during the transition (Canvas2D fallback). No new external rendering dependency or downloaded atlas. DialKit loads after the first opening paint.

Measured warm rendering work now passes the probe at 1920×1080 and 2560×1440, DPR 2. Cold GPU initialization can still produce a brief stall; real-device performance and full asset optimization remain later review items. See the prototype README for exact measurements and limitations.

```sh
node prototypes/ascii-surge/check.mjs
node prototypes/ascii-opening/measure-water.mjs
pnpm check
pnpm build
```

Browser probes in the continuation:

```js
const probe = await import('./perf.js');
await probe.measure({ assertBudget: true });
await probe.measureClock();
```

Latest validation: contract/glow probes pass; browser controls, mobile overflow, reduced motion and WebGL context-loss fallback checked; `pnpm check` has 0 errors and 20 existing warnings; build passes with the existing adapter-auto deployment-target notice.
