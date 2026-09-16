# Session handoff — intro + showreel co-architecture

Date: 2026-09-11. Repo: `wawe-site-svjs` (initialised this session; `wawe-payload`
stays its own repo and was deliberately left untouched with its own uncommitted work).

Read this first, then `docs/design-system.md`, then the ADRs it references.

## What was decided

| Decision | Where it lives |
|---|---|
| Design system = code-first tokens + side doc | `docs/adr/0002-design-system-code-first.md` |
| Adopt logo palette 02-COLOUR + WCAG companions + goo restraint | `docs/adr/0003-brand-palette-goo.md` |
| Tokens (palette, type, motion) | `src/app.css` (`@theme`) |
| Palette audit, motion language, glossary, open items | `docs/design-system.md` |
| Intro beat sheet | `prototypes/prototype-intro-wave.html` |
| Showreel language | `prototypes/prototype-showreel.html` |

## The intro, as agreed

Title **"wawe films"** (navy on Paper Cream) → **wash**: a tight set of wave bands
enters (currently bottom→top, `?dir=BTT`, flippable to `?dir=LTR`) and wipes the
title, laying flood behind it → **withdraw**: the flood drains *toward the exit
side*, foam lace rides the **waterline**, and the card stack is revealed behind
it → **cascade**: showreel stays centre, projects spread out → **cinema**.

The illusion: water arrives from one side and leaves out the other — it never
moves backwards, and nothing dissolves in place. Two earlier attempts got this
wrong (a wave that faded in place; a second set that re-entered); both are
rejected. Do not reintroduce a "reset"/foam-flash beat — the wash lays flood
as it crosses so the withdraw can start immediately, off-screen left.

Sharp edges already fixed, do not regress:
- The waterline must enter from **off-screen** (`-0.35S`), never appear on screen.
- Title, stack and showreel share **one** clip edge so they wipe in lockstep.
- Card shadows compound into a halo when 20 cards stack — cards are shadowless.
- Easing is deliberately **linear** for now; curves are an open item.

## Prototypes — how to run

```sh
cd wawe-site-svjs && python3 -m http.server 8471
# then open:
#   http://127.0.0.1:8471/prototypes/prototype-intro-wave.html?variant=E&dir=BTT
#   http://127.0.0.1:8471/prototypes/prototype-goo.html?variant=goo
#   http://127.0.0.1:8471/prototypes/prototype-showreel.html?goo=0
```

The three files are throwaway per the prototype skill: keep the decisions, keep
the files out of the shipped bundle. `prototype-showreel.html` reads **real R2
footage** (`media.wawefilms.com`) with hardcoded URLs.

## Open items (in priority order)

1. **Withdrawal easing** — linear today; put candidate curves side by side in
   `prototype-intro-wave.html` and feel them back to back, then tokenize.
2. **Crest-lace softening** — crest lip renders as a near-solid dark wall; cap
   crest density (~70%) and push more mid-blue texture, per the drone reference.
3. **Pangram Sans Rounded licence** — trial now; purchase before launch.
   Confirm the intended display face: "Pilcrow" alone is a *different* (ITF,
   condensed, commercial) family.
4. **Showreel global file** — no dedicated showreel exists in R2 (45 objects,
   all project footage). Hero currently plays project 0; swap when uploaded.
5. **Goo verdict** — is it too playful for a serious house? `?goo=0` is the
   restraint control. Decide, then fold.
6. **Wire the intro into `src/lib/components/Intro.svelte`** — it is still a
   placeholder (`animate-pulse` text). `Showreel.svelte` already mounts at
   `#showreel-mount` in `+page.svelte` and observes `intro.revealed`.
7. **`+page.svelte` hero is `bg-white`** — board rule says never `#FFF`; move to
   `bg-paper`.
8. **Payload API is down locally** (`localhost:3000`); prototypes read R2
   directly. Production wiring must go through `$lib/server/payload`.

## Gotchas

- Extensionless R2 keys (`akasa air`, `blue`, …) are VP9 without a usable
  extension and were skipped. Re-upload with `.webm` to include them.
- Safari gets HEVC `_h265.mp4`; Chrome/Firefox get `.webm` (handled via
  `canPlayType` for the hero, `<source>` order for the grid).
- 8 videos all decoding at once will melt the page — only the hero plays,
  thumbs are `preload="metadata"` stills.
- Never use grep/rg in pi sessions here; use the `fffind`/`ffgrep` tools.
