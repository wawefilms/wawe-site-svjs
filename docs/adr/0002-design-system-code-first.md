# ADR 0002 — design system: code-first tokens + side doc, site + motion scope

Date: 2026-09-11
Status: Accepted

## Context

The intro co-architecture (wave wash → withdraw, card stack → filmstrip)
produced validated values — palette, beats, stagger, scale floor — that only
lived in a throwaway prototype and chat history. The next piece of work
(portfolio animation) needs a shared system to build on, and the team is two
people (human + agent) collaborating async with occasional live sessions.

Grilled options for the home of the system: Figma-first (visual but drifts
in translation), docs-first (clear but slow to see), code-first (always
shippable, reviewable in browser). Token formats: Tailwind theme + CSS vars
vs standalone JSON (portability we don't need). Scope: site + motion vs full
brand (poster/video grade — premature). Loop: prototype + issue (traceable,
matches how the intro was designed) vs live-only (fast, unrecorded).

## Decision

1. **Code-first, docs on the side.** `wawe-site-svjs/src/app.css` `@theme`
   tokens are the source of truth; `docs/design-system.md` records what we
   agreed (meaning, motion language, glossary). Change code first, update the
   doc in the same pass.
2. **Tailwind v4 theme + CSS variables.** Fits the existing stack
   (`@tailwindcss/vite`); one file rules the palette. No token pipeline.
3. **Scope: site + motion.** Intro language, palette, type, motion rules.
   Video/poster pipeline conventions stay out (see ADR-0001 context).
4. **Loop: prototype + issue, live on request.** Async by default; live
   co-design sessions when asked, always written up to an ADR after.
5. Site glossary lives in `docs/design-system.md`, not `CONTEXT.md` —
   `CONTEXT.md` stays scoped to the video-conversion pipeline.

## Consequences

- Every visual decision needs a prototype variant + issue trail before
  tokenizing; no drive-by hex codes in components.
- Open items tracked in the side doc: withdrawal easing curves,
  crest-lace softening, portfolio animation language.
- Live sessions are ephemeral by default — the write-up is the deliverable.
