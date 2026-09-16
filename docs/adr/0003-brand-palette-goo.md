# ADR 0003 — adopt logo palette (02-COLOUR) + WCAG companions + goo restraint

Date: 2026-09-11
Status: Accepted
Supersedes: palette section of ADR-0002 (code-first loop and scope stand).

## Context

The brand board 02-COLOUR fixes five inks + paper: Wawe Blue `#0E438E`,
Paper Cream `#F0E3D1` (never `#FFF`), Ink Navy `#0A1F38` (never pure black),
Wash Blue `#2E6BB8` (sparingly), Riso Orange `#E8552B` (one detail per
screen, fills only). This conflicts with the prototype palette (near-white
blue sea `#f2f6fb`, Inter) and needs WCAG verification before tokenizing.
Separately, a gooey metaball spread was requested for the stack→grid moment,
which risks reading playful for a serious AI video house.

## Decision

1. **Adopt the board verbatim** as `@theme` tokens (`paper/wawe/ink/wash/riso`).
   Sea becomes Paper Cream — the intro flood and hero share one background,
   which is what makes the handoff seamless. Foam ramp remaps onto brand
   blues (lip `wawe`, body `wash`, lace `wash-mist` overprint tint).
2. **WCAG companions, same hues only.** `wash` on cream is 4.25 (fails AA
   normal) → `wash-ink` `#275C9E` (5.3) for text/links. `riso` on cream is
   2.9 (fails even large) → `riso-ember` `#A93B1B` (5.0) for eyebrows/small
   text; orange buttons take Ink Navy text (4.55), never white (3.6).
   Full audit table lives in `docs/design-system.md`.
3. **Tints are overprints, not colors.** `color-mix` of an ink over paper
   (riso-print logic) for decorative lace/mist — never for text.
4. **Type: rounded display + Archivo SemiCondensed body.** Pangram Sans
   Rounded on trial now, license before launch. Open question recorded:
   "Pilcrow" alone names a different (ITF, condensed) face — confirm if
   Pangram isn't what's meant. Archivo via Google Fonts variable `wdth`
   axis at 87.5% (`.stretch-semi`).
5. **Goo: allowed, restrained.** Prototype `prototypes/prototype-goo.html` carries both
   variants (goo / clean control). Rules for the serious tone: goo ≤12px
   blur, bridges live ≤1s mid-flight only, landing always crisp, once per
   visit, reduced-motion skips it.

## Consequences

- `+page.svelte` hero `bg-white` should move to `bg-paper` (board rule).
- Intro prototype needs a palette pass to the new tokens (open item).
- License purchase for the display face is a launch blocker (tracked).
