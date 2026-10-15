# WAWE Design System — shared agreement (side doc to the code tokens)

> **CURRENT — simplified Showreel packet (2026-10-13).** This section and root
> [DESIGN.md](../DESIGN.md) supersede the historical recipes below for the homepage,
> Contact and Project shared shell only. No full release approval is implied.

## Current authority and scope

ADR-0002 remains code-first: `src/app.css` (`@theme` and `:root`) plus component
styles own implemented values. `DESIGN.md` is the normative **documented extraction**
for design consumers; `.impeccable/design.json` schemaVersion 2 adds extension metadata
and self-contained component previews, not another primitive token store. Change
code first and refresh both extracts together. No token pipeline was introduced.

The user pinned Midnight Ink / warm-paper surfaces, actual Archivo Narrow headings,
Archivo UI and the existing badge. This is scan mode, code-led, with no generated
comp, random seed or renewed mood interview. See
[the direction contract](../.impeccable/surfaces/src-routes-page-svelte.md) and
[PRODUCT.md](../PRODUCT.md). The plan's original planning status is historical;
its requirements remain the pinned brief, not current implementation status.

ADR-0003's paper-default and rounded-display guidance is superseded **only** for
this route family. Accepted wave palette, glyph type and calculations remain
unchanged (`src/lib/landing/approved-opening.json`, `field.js`, `motion.js`).
No ADR history or unrelated prototypes were rewritten.

## Current implementation map

- `src/routes/+page.svelte`: native Showreel → one below-film sticky Nav → one
  keyed five-to-all ProjectBrowser → Contact CTA. Root layout supplies one Footer;
  inner routes receive the same Nav at their top.
- `src/lib/home/`: progressive ASCII intro adapter over the same native player;
  playback-driven full-catalogue cue lookup and honest `SHOWREEL` fallback.
  Old `Landing.svelte`, scene stack/fan/filmstrip and retained `Intro.svelte` are
  historical modules, not current homepage imports.
- `src/lib/projects/` and shared cards: deterministic priority highlights, in-place
  measured expansion, native Tag/Domain selects, Highlighted / Recently added /
  Title A–Z sorting, GET SSR and shallow URL/Back restoration. Preview images are
  lazy and contained; missing previews stay explicit, not playing thumbnails.
- `src/routes/project/[slug]/`: real native media, supplied descriptions/clients/
  tags, optional extras/parts and server-sanitized rich text via `sanitize-html`
  (`src/lib/server/richtext.ts`). No invented credit/result sections.
- Contact has associated fields, pending/errors and initial unavailable copy;
  missing provider configuration fails closed and disables composing/sending.
- Native `<track>` paths exist for hero/detail media through
  `src/lib/media/captions.ts`; approved manifests are empty. Plumbing is not
  caption availability or audio-access sign-off.

## Current type and asset record

Archivo Narrow is not renamed Archivo SemiCondensed. The separate normal variable
WOFF2 is self-hosted, declared 400–700 with swap; the homepage preloads it.
`static/fonts/ArchivoNarrow-SOURCE.md` records the Google Fonts source, whole-font
conversion and hashes; `ArchivoNarrow-OFL.txt` retains SIL OFL 1.1. Body/UI keeps
Archivo variable; the accepted opening uses its own Plex glyph configuration.
Pilcrow remains registered for retained history, not current shared-shell display.

The shipping badge-mask and static OG PNG carry embedded origin metadata;
`static/og/wawe-films.provenance.json` records badge-derived OG preparation.
The supplied shipping-raster scan found **2 assets, 0 missing provenance**, with
no AI generation. This establishes asset origin, not film/logo rights approval.
The OG artwork's recorded foreground differs from the UI paper token; do not
silently add it as a shared palette token.
The JSON's SHA256 entries match the PNG bytes before the added
`impeccable:prompt` text chunk (verified by excluding that chunk); current whole-file
hashes therefore differ. Embedded text records the metadata-only origin edit.

For extracted colors, type roles, corners, gutters, focus and motion, use
[DESIGN.md](../DESIGN.md). For the bounded ship verdict, final gates and outstanding
content/configuration/device/performance obligations, use
[production-readiness.md](production-readiness.md). Documentation does not reopen
settled direction or upgrade fixture evidence into production claims.

## Historical reference — not current shipping instructions

Everything below preserves prior dirty documentation and design history. Its
paper-default, Pilcrow display, stack/fan/filmstrip, legacy readiness thresholds,
prototype recipes and open design items do **not** override the current packet.
The old "accepted homepage package" is specifically superseded for the shared
shell; accepted wave calculations alone remain retained.

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

- Display: Pilcrow Rounded (ITF Fontshare, FFL 2.0 — free commercial, self-hosted whole
  files in `static/fonts/`: variable TTF + 5 static woff2. "Pangram Sans Rounded" was a
  misattribution, retired). Headlines, wordmark.
- Body/UI: Archivo variable (`wdth` 62–125, `wght` 100–900), self-hosted woff2 converted
  from the desktop variable TTF — no Google Fonts link. `font-stretch: 87.5%`
  (MS SemiCondensed), class `.stretch-semi`. Intro title `WAWE FILMS` is Archivo
  SemiCondensed all caps, centered.
  Eyebrows: Archivo bold, caps, letterspaced, `riso-ember`.

## Motion language

- Intro beats: **hold → wash → withdraw** — full-screen oscillating sea (zero net travel) holds under `WAWE FILMS` until the hero video gates ready (≥30% buffered or canplaythrough, 1.4s min / 12s fallback); clean-crested flood covers the text; torn waterline recedes the SAME direction it came in (the sea-switches-sides illusion). Nothing moves backwards. `?dir=BTT|LTR` compares axes. Seafoam-tweak consts live atop `Intro.svelte` (`SWELL_1/2`, `TEETH`, `SPRAY_N`).
- Prototypes (`prototypes/`): `prototype-intro-wave.html` (variants D/E, `?dir=BTT|LTR`),
  `prototype-goo.html` (variants goo/clean), `prototype-showreel.html` (stack → fan →
  cinema, real R2 footage; `?goo=0` disables metaballs).
- Goo verdict (open): metaball bridges mid-flight, crisp landing; restraint
  control in prototype. For a serious house: goo ≤12px, ≤1s, once per visit.
- Groups that enter together stagger 30–80ms (cascade uses 45ms).
- Entrances scale from ≥0.9 with opacity — never from `scale(0)`.
- Reduced motion: skip to end state, keep fades (`Intro.svelte` pattern).

## Historical accepted homepage package — superseded shared shell

The accepted `ascii-stacking` study is now the basis of `src/lib/landing/`, rather than the historical intro/showreel recipes above. The homepage uses the recede entrance, a Midnight Ink-derived surface and Pilcrow Rounded Semibold identity. The accepted opening/water calculations are preserved.

- Logo is a full-size base, deposited first; incoming native-ratio Projects reach an edge before the outline reshapes with a spring.
- The Project stack spreads right in one constant-speed sweep (0.75 seconds by default). Deposited Projects stay fixed and flat; only moving cards receive subtle perspective.
- Bottom gutter matches the side gutter by default. Development-only Bottom Padding and Spread Speed sliders support further tuning; no public study panel.
- Showreel remains independent from Project ordering. After settlement the identity is a semantic current-Project title/link synchronized to actual Showreel playback (canvas or native). It resolves cues against the full catalogue, not only the six cards; card order/highlights and accepted choreography are unchanged. Gaps, missing/ambiguous Projects, absent/invalid cues and placeholder footage show `SHOWREEL` without a Project link. The local mock remains fallback content pending release approval.
- Production packaging includes semantic links/playback and static fallback content, reduced-motion handling and lifecycle cleanup. Packaging is not deployment approval: see [production-readiness.md](production-readiness.md).

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
3. ~~Pangram Sans Rounded license purchase~~ — retired with the misattribution; Pilcrow Rounded (FFL, self-hosted) needs no purchase.
4. Portfolio animation language (next grill).
