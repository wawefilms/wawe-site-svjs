# WAWE Design System — shared agreement (side doc to the code tokens)

Source of truth is code: `wawe-site-svjs/src/app.css` (`@theme` tokens).
This doc is where we two agree on what the tokens mean and how motion behaves.
Change the system by changing code first, then updating this doc in the same pass.

## Palette — brand board 02-COLOUR (only five inks + paper)

| Token | Value | Use per board |
|---|---|---|
| `paper` | `#F0E3D1` | Default page background. Warm, slightly pink. Never `#FFF` |
| `wawe` | `#0E438E` | Brand: logo circle, sections, buttons, links, headlines on cream |
| `ink` | `#0A1F38` | Body copy on cream. Never pure black |
| `wash` | `#2E6BB8` | Hover states, dividers on blue, secondary UI. Sparingly |
| `riso` | `#E8552B` | Second ink: eyebrows, active states, **one detail per screen**. Fills only |

Tints are `color-mix` overprints of these inks (riso-print logic) — never new hues.

## WCAG audit (cream `#F0E3D1` base unless noted)

| Pair | Ratio | Verdict |
|---|---|---|
| Ink Navy on cream | 13.1 | AAA body copy — the workhorse |
| Wawe Blue on cream | 7.5 | AAA headlines, links |
| Cream on Wawe Blue | 7.5 | AAA reversed sections |
| White on Wawe Blue | 9.5 | AAA buttons |
| White on Wash Blue | 5.4 | AA buttons/large |
| Ink Navy on Riso Orange | 4.55 | AA — orange buttons take **navy** text, never white |
| Wash Blue on cream | 4.25 | **Fails** AA normal — see companions |
| Riso Orange on cream | 2.9 | **Fails** even large — fills/graphics only |
| White on Riso Orange | 3.6 | **Fails** normal — never white text on orange |

Companions (same hues, accessibility depths): `wash-ink` `#275C9E`
(5.3, AA text/links on cream), `riso-ember` `#A93B1B` (5.0, AA eyebrows
and small text on cream). `riso` `#E8552B` stays for fills and large graphics.

## Type

- Display: rounded geometric (Pangram Sans Rounded — trial now, **license
  before launch**; fallback stack in token). Headlines, `wawe films` wordmark.
  NOTE: "Pilcrow" alone is a different face (Indian Type Foundry, condensed,
  commercial) — confirm which rounded face was meant if not Pangram.
- Body/UI: Archivo SemiCondensed — Google Fonts variable (`wdth` 62–125),
  `font-stretch: 87.5%` (MS SemiCondensed), class `.stretch-semi`.
  Eyebrows: Archivo bold, caps, letterspaced, `riso-ember`.

## Motion language

- Intro beats: **wash → withdraw** — water arrives from one side, drains out
  the other (the sea-switches-sides illusion). Nothing moves backwards.
- Prototypes (`prototypes/`): `prototype-intro-wave.html` (variants D/E, `?dir=BTT|LTR`),
  `prototype-goo.html` (variants goo/clean), `prototype-showreel.html` (stack → fan →
  cinema, real R2 footage; `?goo=0` disables metaballs).
- Goo verdict (open): metaball bridges mid-flight, crisp landing; restraint
  control in prototype. For a serious house: goo ≤12px, ≤1s, once per visit.
- Groups that enter together stagger 30–80ms (cascade uses 45ms).
- Entrances scale from ≥0.9 with opacity — never from `scale(0)`.
- Reduced motion: skip to end state, keep fades (`Intro.svelte` pattern).

## Glossary (site + motion scope)

- **Wave Wash** — waves entering and covering the title.
- **Withdraw / Recede** — flood draining toward the exit side, uncovering behind its waterline.
- **Waterline** — the foam-lace edge of the withdrawing flood; the uncovering edge.
- **Card Stack** — showreel + project containers stacked center mid-intro.
- **Filmstrip** — the bottom horizontal scroll-strip of project thumbnails.
- **Showreel** — the hero video container; stays center while projects cascade out.
- **Goo Bridge** — transient metaball merge between separating cards (SVG goo filter).

## Open items

1. Easing curves for withdrawal (prototype side-by-side, then tokenize).
2. Crest-lace softening (cap crest density, more mid-blue texture).
3. Pangram Sans Rounded license purchase before launch.
4. Portfolio animation language (next grill).
