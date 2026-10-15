# Handoff — fresh start (2026-09-17)

New session: read this first, then `docs/handoff-intro-showreel.md`, `docs/design-system.md`,
ADRs 0002/0003. Repo tree is clean at `5a80588`; prototypes untouched since 2026-09-11.

## Where things stand

- Two SvelteKit intro slices were built, reviewed, and **rejected by the human — do not
  rebuild them without new direction**. History (not a plan): closed spec
  `wawefilms/wawe-payload#1` + two slice reports in its comments.
- Current decision: go back to the prototypes and restart intro design from there.
- Prototypes (frozen, committed): `prototypes/prototype-intro-wave.html` (`?variant=E&dir=BTT`,
  variants D/E, `?dir=BTT|LTR`), `prototypes/prototype-goo.html` (`?variant=goo`, `?goo=0`
  restraint control), `prototypes/prototype-showreel.html` (real R2 footage).
  Serve with `cd wawe-site-svjs && python3 -m http.server 8471`.

## Locked decisions (grilled, keep these)

- **Display face = Pilcrow Rounded** (ITF Fontshare, FFL 2.0 — free commercial, self-host;
  ship files whole, no subsetting/conversion). "Pangram Sans Rounded" was a misattribution,
  retired. Source (outside repo): `/Users/tug/Downloads/PilcrowRounded_Complete`
  (variable TTF + 5 statics, woff2/woff in `Fonts/WEB/fonts/`).
- **Logo = blue circle + cream type.** Master is a 2048px RGBA PNG with real transparency
  (viewers render it black — the corners ARE transparent). It lived in an OS temp dir;
  **re-request it from the human if missing** (was
  `/var/folders/px/6g7fd20d765d6_3g_lynyfxr0000gn/T/pi-clipboard-1f6f0561-…png`, 3.8MB).
  Variants seen: blue/cream (canonical), black/cream, blue/black.
- **Reference = Shopify Editions Winter '26 torn edge** (`shopify.com/editions/winter2026`,
  sidekick→agentic section boundary). Forensics: hand-authored Rive art, zero procedural
  noise in their bundles. Measured character: 2–3 broad smooth swells across the width,
  fine fibrous spray in patches only, near-white halo pooling thicker in the valleys,
  revealing flat cream carrying text. Uniform zigzag was explicitly rejected as "too jagged".
- **Intro title = `WAWE FILMS`, Archivo SemiCondensed all caps, centered.**
  (Archivo variable `wdth` was referenced but never loaded — no Google Fonts link exists yet.)
- **Beat sheet**: text-wave loading loop (water bands washing back and forth through the
  letterforms, aerial-beach feel) until showreel assets load → clean-crested wash rises
  (BTT) and covers the text → full flood swaps paper for page → torn Shopify waterline
  recedes the SAME direction it came in, revealing the showreel. Never backwards, nothing
  dissolves. Only the recede carries the torn look.
- **Gate**: showreel atlas completion (`intro.assetsReady` pattern was prototyped and
  reverted — reuse the idea, not the code), 12s fallback, ~1.4s minimum display.

## Open / contested

- Withdrawal easing still linear (open item).
- Fibrous spray detail deliberately skipped once (risked reading as dirt) — offer, don't assume.
- Easing, halo amplitude, and any brand-palette deviations stay open items in
  `docs/design-system.md`.
