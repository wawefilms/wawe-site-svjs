# Handoff — wash intro rebuild (ascii title + waves + showreel reveal)

Date: 2026-09-25. Author: previous session (Muse Spark). Audience: a cold model continuing
this work — assume NO session memory. Everything you need is below.

## 1. Where things stand

- Site repo: `/Users/tug/PPRO/wawe/wawe-site-svjs` (own git repo, **no remotes** — commit locally).
- Working file (THIS session's prototype, now **FROZEN as reference — do not extend it**):
  `prototypes/prototype-intro-wash-ascii.html` (~540 lines, single self-contained file).
- Frozen ancestor (never mutate): `prototypes/prototype-intro-wash-v2.html`.
- Vendored UI lib: `prototypes/vendor/dialkit/{browser.global.js,styles.css}` (DialKit 2.0.2 vanilla).
- Serve: `python3 -m http.server 8471` from the repo root → the file + vendor + `?shot=` work.
- New build goes in a **new file**: recommended `prototypes/prototype-intro-wash-v3.html`,
  built section-by-section in the order of §6.

### Run / verify cheat sheet
- Live: `http://localhost:8471/prototypes/prototype-intro-wash-ascii.html`
- Frozen frames: `?shot=<ms>` (deterministic re-simulation, 100ms steps).
- Key deep links: `?shot=2000` (loop) · `?shot=7300` (break/surge) · `?shot=9000` (run-up over text) ·
  `?shot=11000` (recede) · `?shot=14000` (done). All params combine (`?grid=2&shot=8000`).
- `node --check` the extracted `<script>` after every edit (anchor edits can unbalance braces).
- **Screenshots do not display in this environment** (image pipeline broken all session).
  Verify with pixel probes via agent-browser eval instead — see §7 for copy-paste snippets.

## 2. What was decided (locked, carry into the rebuild)

- p3 behavior, `sea:same`, `trail:below`, `title:ascii`, mid density, gradient reveal (never hard carve).
- Timeline: LOOP (lapping breakers, title untouched) → assets load → last wave completes →
  ONE surge bottom→top washing the title → RECEDE (v2 rising illusion: edge runs bottom→top,
  showreel exposed below) → showreel scale-up at title-gone → done freeze.
- Title fade envelope: starts at first crest touch (`tHit`), fast attack + very slow tail via
  DialKit curve, guaranteed completion by the edge eating everything.
- Title↔water contact physics (shove + churn + spume, `?agit=`, default 1).
- Title leading tightened to the logo lockup: `line-height 0.93` (gap/cap ≈ 0.30, measured §5).
- Global `?speed=` clock; `?shot=` counts scaled ms. All dial values sync to the URL.
- No randomness anywhere (`Math.random` forbidden — kills `?shot=` exactness). All noise is
  `hash2(gx, gy, tt)` with `tt = floor(t*9)`.

## 3. Current defects (diagnosed — read before rebuilding)

1. **Title was completely missing (ROOT-CAUSED + fixed 2026-09-25).**
   `buildMask` sampled the mask canvas with FLOAT indices (`gx * 7.4 + 3.7`) after the GRID
   change; typed arrays return `undefined` for float indices, so the mask grid came back empty
   (3 cells of 14,878). Old integer step (10) masked this. Fix: `Math.floor` sample coords.
   Lesson for rebuild: after ANY grid change, probe `maskFill` (§7) — never trust code inspection.
2. **Multiple waves overlap instead of one clean wave (BY DESIGN, user rejected it).**
   Run-up draws the 3-band surge PLUS up-to-3 loop stragglers PLUS spray = visual mush.
   Rebuild requirement: **one wave at a time** (or fully separated systems, never composited).
3. **Weird wavefront.** Prime suspects: flood-body top = `min()` over mixed loop+surge fronts
   (jagged top edge), bands hard-capped at `shoreY+4`, surge = 3 fixed-offset bands reading as a
   triple edge. Rebuild with ONE coherent front (S3/S6).
4. **Loop→outro gap (fixed structurally, keep the pattern).** Old: loop stopped, sweep edge
   started below screen → beat of dead water. Fix pattern: every handoff must be pixel-identical
   by construction (shared water body, takeover from exact positions, alpha-0 removals).

## 4. Retain vs discard (recommended split)

RETAIN (proven, user-approved feel):
- ASCII title core: offscreen mask sampling, `RAMP=' .·:;+*oO0@█'` + `ink()` palette, per-cell
  paint UNDER the water. Density endpoints solid/mid/foam (mid default: keep 0.78, ink 0.52+n*0.33).
- Contact physics: proximity `energy`, deterministic jitter shove, ramp churn, contact-line spume.
- Gradient reveal band (`destination-out` per-column erase following `waveUnd`, `?fade=` depth).
- DialKit integration pattern: vendored vanilla, `titleFade`/`waterline`/`recede` easing graphs +
  `speed/shore/loop/agit/grid` dials, subscribe→live vars + URL sync.
- Scrubber pattern: `scrubTo()` full re-simulation + play/pause + playhead (exact frames).
- Wave math: triple-harmonic `waveUnd`, `CFG` amps/phases/gains, trail-below foam language.
- Timeline phase MODEL + param names: `?shore=140 ?ready=4000 ?sweep=3.2 ?recede=2.2 ?speed=1
  ?loop=3.6 ?tdur=3.2 ?tease= ?wease= ?rease= ?agit=1 ?fade=110 ?grid=1.35 ?tstyle=mid`.
- Logo leading ratio 0.93 (§5).

DISCARD / REWORK:
- Multi-front compositing (the overlap). Single wave per phase.
- `frontListLoop` post-break straggler logic, `runY0/runA0` capture (dead since the fresh-surge change).
- Dead mode branches if copied over: p1/p2, `title:dom` hole-punch, `trail:above`, `?fade=0` path,
  `TITLE_HOLD`, `frontPos`/set-1/set-2 sequencing, `clipTitleFromBelow`.
- `Math.random` anywhere near the timeline (none currently — keep it that way).

## 5. Facts measured this session (no need to re-derive)

- Logo lockup (`/tmp/wawe-logo.png`, 2048², black bg): two lowercase rounded-sans lines;
  x-height ≈560px, baseline₁→capTop₂ gap ≈170px → ratio ≈0.30 → prototype `line-height 0.93`.
  (Measured with PIL row-mass profiles; image viewer was down.)
- Fresnel-free palette: flood `#f2f6fb` == page bg (water reads through foam density only).
- Timing (defaults, speed=1): load 4.0s → break ≈7.2s (loop boundary) → title gone ≈9s
  (`tHit`≈8.3) → recede ≈10.4s → done ≈12.6s.
- Perf: GRID 2.0 ≈ 4× glyphs; fine on desktop, unknown on weak hardware.

## 6. Rebuild order (one section at a time, each demoed via ?shot= before moving on)

- **S1 — Water body + single wavefront.** Flood below ONE front + crest + trail + spray switch.
  Paint-order law: water body first, title second, foam/spray last. No second system on screen.
  Params: `CFG` amps/phases, trail depth. Accept: clean edge at `?shot=` steps, no dust
  (guard d≥1 tails: skip cells with keep-probability ≤ 0).
- **S2 — Loop.** One breaker: rise (fade in) → break at `shoreY` (foam burst) → dissolve forward
  (fade out, slight upward creep). `?shore=` offset, `?loop=` period. Accept: periodic, no pops
  at wrap (probe: pixel-diff consecutive loops ≈ 0).
- **S3 — Title.** Mask + mid-density paint, full strength, kissed (not eaten) by breakers.
  Accept: `maskFill` in the hundreds; title-band dark fraction ≈6% at `?shot=2000`.
- **S4 — Melt + envelope.** Proximity melt from first touch + `titleFade` curve to ghost.
  Accept: wash-free rows lighten pre-contact (was 729.9→733.4), no step at any latch.
- **S5 — Contact physics.** Shove/churn/spume behind `?agit=` (0 = pure melt fallback).
- **S6 — Break + run-up.** Last wave completes; ONE surge bottom→top on the waterline curve;
  title eaten at its lead. Accept: handoff thirds within a few points across the break.
- **S7 — Recede + showreel.** Rising illusion, gradient band, scale-up at title-gone, done freeze.
  Accept: bottom→top darkening sequence across recede frames; `done=true` at end.
- **S8 — Chrome.** DialKit panel (3 curves + dials), scrub + play/pause, readout, replay, URL sync.
  Accept: every state linkable; dials → URL → `?shot=` reproduces exactly.

## 7. Verification toolkit (screenshots broken — use these)

```js
// mask health (want: hundreds). Run at ?shot=2000:
maskGrid.reduce((a,b)=>a+b,0) + ' ' + maskW + 'x' + maskH
// title-band ink fraction (want ≈0.05–0.07 full title, rising lighter as it melts):
(() => { const c=document.getElementById('sea'), x=c.getContext('2d'), W=c.width;
const rr=title.getBoundingClientRect(), d=x.getImageData(0,0,W,c.height).data;
let k=0,n=0; for(let y=rr.top;y<rr.bottom;y+=2) for(let px=0;px<W;px+=4){
const o=((y|0)*W+px)*4; if(d[o]+d[o+1]+d[o+2]<600)k++; n++; } return (k/n).toFixed(3); })()
// thirds brightness (water≈739, showreel≈200–300, erased-transparent≈0):
// sample rows 0–H/3, H/3–2H/3, 2H/3–H means; rising reveal = bottom darkens first.
// timeline state:
[t, breakT0, tHit, fadeQ, titleLatched, done].join(' | ')
```
Harness pattern (node stub, addEventListener stubs required): extract `<script>`, stub DOM/canvas,
`node --check` first, then step `?shot=` values and assert phases.

## 8. Open questions for the new session (ask the human)

1. Loop: strictly ONE visible breaker at a time, or breaker groups (current: 3 staggered)?
2. Assets loading is FAKE (`?ready=` + button). What is the real load event (fonts? footage?
   how many assets)? Wire the break trigger to it in S6.
3. Keep single-file prototype convention, or split modules now that DialKit/scrub exist?
4. GRID 2.0 perf on target hardware — acceptable ceiling?
5. The `?shot=`/URL param surface is large — prune for production, or keep?
