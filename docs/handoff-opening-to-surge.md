# Handoff: approved opening → readiness-driven surge

## Scope and sources

Work only in `wawe-site-svjs`. Preserve all uncommitted work. Read `AGENTS.md`, `docs/idea.md`, and `prototypes/ascii-opening/README.md` before implementing.

`docs/idea.md` remains authoritative for the full arc. Older implementations and `docs/idea-impl-ref.md` are references, not requirements.

## Opening is approved and locked for now

Exact preset: **`prototypes/ascii-opening/approved-opening.json`**.

This captures the current prototype defaults, including `logoMotion: "flow"`. Keep the fixed-grid alternative available in the existing opening study, but do not treat the two as an unresolved blocker for the transition. The approved baseline uses flowing texture.

Preserve:

- Whole, unclipped logo glyphs with the full selected palette; no silhouette clipping.
- A shared Global Cell Px for logo and water.
- Centred, undeformed logo silhouette with animated texture.
- Brand-dark treatment and all numerical values in the preset.
- Organic reach dissipation and current wavefront behaviour.
- The end-wave glow fix: residue replaces overlapping foam; only active foam gets cream highlights.
- Both motion modes and the current DialKit panel in the existing prototype as a reference.

The JSON is a snapshot of approved tuning, not a new runtime state machine. Existing opening-study controls and URL overrides remain usable for reference; they do not redefine the approved preset. Do not overwrite this snapshot or retune it without user approval.

## Critical loop/readiness contract

**Opening waves loop for as long as assets are loading. Assets becoming ready permits exactly one surge.**

- No timeout or minimum-display timer may pretend assets are ready.
- Waiting is an indefinite live loop, not a one-shot intro or a still frame.
- Readiness is latched: repeated signals must not trigger multiple surges.
- The handoff must preserve the live wave phase/appearance; do not visibly reset the field, jump the clock, pop in a new edge, or stack another wave system on top.
- Whether the surge takes over immediately or at the next suitable point in the active wave is a transition design decision. If a phase-aligned handoff is chosen, explain it and keep readiness—not an elapsed loading timer—as the prerequisite.
- Once the surge starts, the opening loop must not restart.

A manual **Assets Ready** control may simulate the readiness signal in the isolated prototype. It is not a timed auto-advance or production loading implementation. Include explicit replay/reset for testing this state machine.

## Next session's implementation scope

Build a separate isolated continuation:

`loop while loading → assets ready → one surge covers logo → same-direction recede → placeholder showreel frame`

The next **DialKit UI is for this new transition segment**: surge, logo contact/dissolution, soft reveal edge and recede. Consume the locked opening preset instead of copying all opening controls into the new panel. Keep the existing study intact as the approved comparison.

Ask about essential visual choices before implementation, especially how the logo is consumed and the revealed frame's proportions. Keep the reveal edge shared and soft, and preserve the same-direction water illusion. No second surge, backward wipe, playback, thumbnails or stacking animation in this pass.

Future context only: a large showreel frame dominates; below it, logo | current project identity | thumbnails in showreel order. Playback, interactions and stacking come later.

Reduced-motion viewers ultimately skip to the settled state. For the next isolated continuation, show the settled placeholder rather than running the loop/surge/recede.

## Continuation and follow-up feedback

The isolated continuation now lives in `prototypes/ascii-surge/`; see its README
for controls, readiness behavior, validation and performance probes. The user
found all three logo-contact treatments acceptable; no single treatment was selected.
All review controls, including state/readiness/replay/pause, belong in DialKit.
The approved opening snapshot remains untouched.

**Startup constraint:** minimize the opening's own critical assets and paint it
as early as possible, independently of showreel loading. An empty intro-loading
screen is not the intended experience. Keep nonessential fonts/artwork, media,
review tooling and heavy initialization off this path. Detailed optimization
and a lightweight first-frame fallback are later work; don't assume this is
already solved by the isolated prototype. See `docs/idea.md` → First visible frame.

## Existing study

```sh
pnpm exec vite --config prototypes/vite.foundation.config.ts --host 127.0.0.1 --port 5175
```

http://127.0.0.1:5175/prototypes/ascii-opening/

The current study intentionally has no readiness gate or transition yet. This handoff records the next behaviour; it does not claim it is implemented.
