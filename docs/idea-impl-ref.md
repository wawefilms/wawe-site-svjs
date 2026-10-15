# Implementation reference for `idea.md` — do not treat as spec

Everything the fresh implementation may consult, and nothing it must obey.
`idea.md` is the brief; this file is only an index of what was already tried,
with exact pointers. Palette, fonts, and inspiration references are excluded
here too — they will be re-prompted in the new session.

## Prior art (read in this order)

- `docs/handoff-wash-ascii-rebuild.md` — the last text-intro session: locked
  decisions, diagnosed defects (missing-title root cause, multi-wave overlap,
  wavefront suspects, loop→outro gap pattern), retain/discard split, §6
  rebuild order (S1–S8), §7 pixel-probe verification toolkit, §8 open questions.
- `prototypes/prototype-intro-wash-ascii.html` (~540 lines, FROZEN reference,
  do not extend) — ascii title + loop → surge → recede, DialKit curves,
  scrubber, contact physics, `?shot=` determinism. Decisions and params live
  in its header comment.
- `prototypes/prototype-intro-wash-v2.html` (frozen ancestor, never mutate) —
  earlier set-1/set-2 sequencing, p1/p2/p3 modes, DOM-title hole-punch.
- `prototypes/prototype-intro-wave.html` (`?variant=D|E`, `?dir=BTT|LTR`) —
  earliest wash→recede→cascade→filmstrip beat sheet.
- `prototypes/prototype-showreel.html` (`?goo=0`) and
  `prototypes/prototype-goo.html` (`?variant=goo|clean`) — showreel settle
  sketches (stack→fan→cinema; blob spread).
- `docs/handoff-intro-showreel.md`, `docs/handoff-fresh-start.md`,
  `docs/design-system.md`, `docs/adr/0002-design-system-code-first.md`,
  `docs/adr/0003-brand-palette-goo.md` — co-architecture, rejected slices,
  motion language, palette/type history (kept out of `idea.md` on purpose).
- `src/lib/components/Intro.svelte`, `src/lib/intro/gate.ts`,
  `src/lib/showreel/Showreel.svelte`, `src/routes/+page.svelte` — current
  Svelte slices (two earlier slices were reviewed and rejected; see
  `docs/handoff-fresh-start.md` before reusing).

## Accumulated values (grilled, parked here per approval)

- Handoff: last loop wave completes (`breakT0 = ceil(loadedAt / LOOP_S) *
  LOOP_S`), pixel-identical takeover, no dead-water gap.
- Timings (speed=1): ready 4s / loop 3.6s / run-up 3.2s / recede 2.2s; title
  gone ≈9s; done ≈12.6s. Gate: hero ≥30% buffered or `canplaythrough`, min
  display ~1.4s, fallback 12s.
- Title: offscreen mask sampling, `RAMP=' .·:;+*oO0@█'`, mid density
  (keep 0.78, ink `0.52+n*0.33`); envelope fast attack + slow tail
  (`[0.22,1,0.36,1]`, 3.2s); contact shove/churn/spume behind `?agit=1`
  (0 = pure melt); logo leading 0.93.
- Water: triple-harmonic `waveUnd`, `amps [52,28,12]`, trail `0.16×2.2`,
  lace `0.10→0.95`; flood == bg colour (reads through density only);
  `waterEase [0.45,0,0.35,1]`, `recedeEase [0.4,0,0.6,1]`, reveal band
  `?fade=110px`; `GRID` default 1.35 (2.0 perf unknown).
- Showreel sketches: scale 0.36→1 on `titleLatched='gone'`; stack→fan→cinema
  with real R2 footage (hero = project 0; no dedicated showreel file in R2);
  goo ≤12px, ≤1s, mid-flight only, crisp landing; stagger 30–80ms (cascade
  45ms); entrances scale from ≥0.9, never `scale(0)`.
- Tooling: `?shot=<ms>` frozen frames (2000/7300/9000/11000/14000),
  `?speed/?shore/?loop/?tdur/?tease/?wease/?rease/?agit/?fade/?grid/?tstyle`
  URL surface, DialKit panel, `scrubTo()` re-simulation, `node --check`,
  `hash2` determinism (no `Math.random`), mask/type probes in handoff §7.

## Open questions carried over

Single vs grouped loop breakers; the real load event; single-file vs modules;
GRID ceiling; URL-surface prune; withdrawal easing; crest-lace softening; goo
verdict; missing R2 showreel file. See handoff §8.
