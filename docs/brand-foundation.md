# WAWE — provisional site foundation

Status: working baseline, not a finished brand identity.

We are retaining the existing palette and fonts so work can move on to the
layout and intro animation. Brand personality is deliberately undecided;
this is not a commitment to a playful, cinematic, graphic, or analog direction.

## Sources and preview

- `src/app.css` owns the actual colour and font tokens. No new tokens this pass.
- `docs/design-system.md` explains the existing palette and typography in detail.
- **`docs/idea.md` owns the current intro brief.** Older motion recipes in the
  design system, ADRs, handoffs, and prototypes are historical references, not
  requirements. In particular, do not inherit their timings, goo effects,
  readiness thresholds, or stacking choreography automatically.
- Visual board: from `wawe-site-svjs`, run
  `pnpm exec vite --config prototypes/vite.foundation.config.ts --port 5174`,
  then open `http://localhost:5174/prototypes/brand-foundation.html`. It imports
  the actual site stylesheet and fonts. This isolated Vite preview bypasses
  SvelteKit routing; do not use the normal site server or `file://`.
  The board is a development artifact, not a production route.

## Keep for now

| Role | Existing token / font | Working rule |
| --- | --- | --- |
| Page surface | `paper` | Warm cream is the default canvas. |
| Brand colour | `wawe` | Blue for prominent type and primary controls; cream on blue for reversed surfaces. |
| Reading colour | `ink` | Navy for body copy and utility text. |
| Secondary graphics | `wash` | Decorative blue; use `wash-ink` for normal-size text on cream. |
| Accent | `riso` | Sparse orange fills or markers. Use `riso-ember` for small orange text on cream. |
| Display | Pilcrow Rounded | Existing rounded display option; not a redesigned logo. |
| Body / UI | Archivo | Existing variable font; SemiCondensed at 87.5% remains available. |
| Intro title | Archivo SemiCondensed | `WAWE FILMS`, uppercase, as the current starting point. |
| ASCII field | System monospace in the board | A specimen only; choose the rendering font when building the wave. |

Keep text readable at full opacity. Decorative mist/overprint tints are not
text colours. Never put white small text on orange; navy is the existing
companion. The board uses cream-on-blue and navy-on-cream controls.

## Layout defaults to test, not lock

- Let the work occupy the main stage; keep surrounding navigation and labels legible.
- Begin with generous space, simple alignment, and few competing elements.
- Use fluid typography and gutters; let content stack on narrow screens.
- Controls need visible keyboard focus and comfortably sized touch targets.
- The board's spacing, type sizes, borders, and proportions are local specimen
  choices, **not approved site-wide tokens or a homepage design**.

## Intro boundaries for future sessions

The brief is text → hold → wash → recede → showreel. The title stays still
until touched by water. A single surge passes through; wash and recede travel
in the same direction with one shared soft reveal edge. Readiness drives the
handoff. Reduced-motion viewers get the settled end state.

The visual board is intentionally static. Its ASCII marks illustrate colour
and type together; they are not a wave algorithm, storyboard, or animation test.

## Defer

Brand personality, final logo treatment, final type hierarchy, texture,
precise colour balance, stage shape, final layout, wave direction and density,
stacking choreography, durations, and easing curves.

## Next sessions

1. Establish the settled showreel layout and intro composition using this baseline.
2. Build and tune the continuous wash/recede handoff against `docs/idea.md`.
3. Design the stacking animation and test loading, reduced motion, and mobile behaviour.
4. Revisit brand personality and visual polish once layout and motion are nearly right.

These are a suggested work order, not additional animation specifications.
