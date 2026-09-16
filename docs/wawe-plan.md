# Wawe Films Portfolio — Build Plan (rev 4)

Site: **wawefilms.com** · Backend API: `wawe-payload` (previously set up, collections live here) · Frontend: **`wawe-site-svjs`** (already set up — bare SvelteKit 2 + Svelte 5 scaffold)
Playbook: `/Users/tug/PPRO/anushkatidgam/PAYLOAD-SVELTE-PLAYBOOK.md`

**Division of labor:** you provide designs, creative direction, imagery, and instructions; I implement
to those designs. No visual decisions get invented on my side — placeholders stay neutral until your
designs arrive.

---

## 1. Architecture

```
/Users/tug/PPRO/wawe/
├── wawe-payload/      # Payload 3 + SQLite/R2 — previously set up, with collections.
│                      # Media dimension backfill DONE today (scripts/backfill-dimensions.mjs):
│                      # 41/41 rows now carry real width/height probed via ffprobe over R2 URLs.
├── wawe-site-svjs/    # ALREADY SET UP: SvelteKit 2 + Svelte 5, pnpm. We extend it
│                      # (Tailwind 4, env, AGENTS.md) rather than scaffolding new.
└── docs/              # plans + dated handoffs (this file)
```

**Current backend content (resynced from prod today):** 20 projects (collection being renamed to `projects`), 2 clients, 41 media with dimensions.

## 2. Stack decisions

| Choice | Value | Reason |
|---|---|---|
| Framework | Existing `wawe-site-svjs` — SvelteKit 2 + Svelte 5 (runes) | Already scaffolded by you |
| Styling | Add Tailwind CSS 4 | Playbook layout skeleton uses Tailwind utilities |
| Package manager | pnpm (already its lockfile) | One PM per repo |
| Data fetching | Server loads (`+page.server.ts`) hitting Payload REST | Playbook §3 |
| Site URL | `https://wawefilms.com` | Canonical base for SEO/og/sitemap |

## 3. Phases

### Phase B0 — Backend: rename `videos` collection → `projects` *(your feedback #2)*
Client-facing terminology starts at the CMS, no mental mapping left for visitors/editors. This is a real migration — done carefully, verified against a local prod copy BEFORE touching prod:
- [ ] Rename `Videos.ts` → `Projects.ts`, slug `videos` → `projects`; update `payload.config.ts`.
- [ ] Drizzle migration: `ALTER TABLE videos RENAME TO projects` (+ any internal Payload indexes referencing old name). Verify zero other tables/columns reference the old slug (confirmed: none do — the only relations point INTO `media`).
- [ ] Update Cloudflare purge hook URLs to `https://wawefilms.com/project/{slug}` + `https://wawefilms.com/`.
- [ ] `pnpm generate:types` → fresh `payload-types.ts` (now speaks "Project").
- [ ] Test: local DB copy → run migrate → `/api/projects` returns 20 rows with populated relationships.

### Phase 1 — Frontend foundations *(extend existing repo)*
- [ ] Add Tailwind 4 to `wawe-site-svjs`; install pnpm deps.
- [ ] `.env.example`: `PAYLOAD_API_URL=http://localhost:3000`, `PUBLIC_SITE_URL=https://wawefilms.com`.
- [ ] AGENTS.md (stack, commands, conventions, env vars) — maintained every phase, per playbook §9.

### Phase 2 — Content plumbing
- [ ] Typed REST client `$lib/server/payload.ts`: **`getProjects(depth=2)`, `getProjectBySlug(slug)`, `getClients`, `getTags`, `getDomains`** (your feedback #3).
- [ ] Copy regenerated `payload-types.ts` into svjs repo; document regen-sync step in AGENTS.md.

### Phase 3 — Layout skeleton *(playbook §3 verbatim)*
- [ ] Root layout: fixed nav / `grow` main / shrink-0 footer, `min-h-svh`, safe-area footer padding.
- [ ] `nav-theme` context + IntersectionObserver flips for scroll-sensitive heroes.
- [ ] Global view-transition wiring via `onNavigate` (every navigation, no route skips).

### Phase 4 — Projects list ON THE HOME PAGE *(your feedback #1/#4: no separate /projects route)*
- [ ] Home `/` = landing (top) + full project grid with tag + domain filters below it — **load ALL projects once per request, filter entirely client-side** (20 rows; filter axes just narrow the visible array, extensible later).
- [ ] Tiles sized from real CMS metadata: inline `aspect-ratio: ${width}/${height}` — dimensions exist since backfill; see §5 for the one gap left.
- [ ] Verification (§6): back-nav round-trip checks on the home grid.

### Phase 5 — Landing intro *(machinery only; you direct the choreography)*
- [ ] Intro-latch contract in root layout (state machine + mount point + preloading gate) — details and tools discussion in §7.
- [ ] Sequence visuals/text/reveal = built exactly to your designs when provided.
- [ ] `prefers-reduced-motion` renders settled state regardless of design.

### Phase 6 — Project detail pages
- [ ] **`/project/[slug]`** — hero video, rich-text body (`content_html`), parts/carousel rendering.
- [ ] View-transition morph: list tile ⇄ detail hero wrapper (`view-transition-name: project-{slug}`, one element per side).

### Phase 7 — Contact & logos
- [ ] Client logos strip fed by Clients collection.
- [ ] Contact form mirroring `at-site-svjs`: SvelteKit form action + **zod server-side validation + Cloudflare Turnstile** (siteverify on the server) + Resend delivery. Env keys `$env/dynamic/private`.
- [ ] SEO defaults: full og/twitter set declared in layout, JSON-LD org schema.

### Deferred
- Grid hover interaction: revisit to design ONE model covering touch + mouse.
- Interactive showreel: top-down breakdown together; mounts into the Phase 5 hook.
- Permanent CMS-side dimension capture (e.g., ffmpeg upload hook writing width/height automatically) — replaces periodic backfill runs.

## 4. Parallelization map
- Phase B0 migrations ↔ Phase 1 frontend setup: independent repos → parallel.
- Phases 4–7 page tasks fan out after Phase 3 lands (shared layout files serialize).
- Each phase gate = Plannotator review of the diff before proceeding.

## 5. Scroll integrity strategy — updated after backfill

The original problem: 41/41 media rows had NULL `width`/`height` (Payload stores image dims only; every row here was a video). Undimensioned tiles collapse and grow late → Chrome scroll anchoring shifts restored scroll positions during back-navigation (playbook's "+150px" bug).

Current state after `scripts/backfill-dimensions.mjs`: all 41 rows have true dimensions, so **grid tiles size themselves from metadata immediately** (`aspect-ratio` from depth-populated media) — the root cause is gone without the global `overflow-anchor: none` opt-out.

Remaining gap until the permanent fix lands: a newly uploaded video won't self-report dimensions. Two safety nets meanwhile:
1. Every tile still carries a default aspect-ratio fallback attribute, never raw `<video>` auto-sizing.
2. Keep `overflow-anchor: none` as a one-line global insurance — cheap, reversible, masks nothing while metadata exists. Decision left explicit here rather than silent.

## 6. Back-nav verification procedure (no test suite exists)

Driving the real site after building the grid:
1. On `/` scrolled into the project grid, scroll to offsets (~1000px, ~3000px); record `Math.round(scrollY)` and `scrollHeight`.
2. Click tile → detail loads → press back (SPA return).
3. After settle: pass = identical `scrollY` AND identical `scrollHeight` (growth between measurements is what triggers anchoring compensation).
4. Repeat across viewports: desktop 1440×900, ultrawide, mobile 360×800 (iOS toolbar heights are classic offenders).
Numbers, not screenshots — playbook §8 discipline.

## 7. Intro orchestration — what the latch is, what it isn't (your feedback #8/#10/#11 + round-2 #5)

**State coordination vs. animation sequencing — they need different tools.**

The context latch (from feedback rounds above) is a tiny state machine owned by the root layout:
```ts
const intro = $state({ playing: false, revealed: false, done: false });
setContext('intro', intro);
```
Its jobs: survive client-side navigation (skip on nav-return, reset on reload), flag handoff moments (`revealed` → showreel area takes over), force settled rendering for reduced-motion/nav-returns (read synchronously in component construction — never post-paint, or the intro flashes for a frame).

It is NOT the right tool for chaining multiple animations. Choreography belongs to an actual timeline engine:

| Option | Fit |
|---|---|
| **GSAP timelines** | Purpose-built for multi-scene sequences: labeled segments, overlapping tweens, pause/seek/reverse, `onComplete` hooks that flip latch fields. Industry standard for cinematic landing intros; ScrollTrigger if any scene ever becomes scroll-driven. |
| **anime.js v4** | Fully capable alternative (your suggestion): modern TS-first rewrite, `createTimeline` composes sequences cleanly, smaller bundle than GSAP. Perfectly sufficient for the intro/reveal scope. |
| Motion One / WAAPI | Lighter still; fine for reveal-transition moments, weaker authoring ergonomics for long multi-scene work |
| Svelte tweened/spring | Value-level transitions inside components — useful within scenes, wrong granularity between scenes |

Choice between GSAP and anime.js is yours to direct (both plug identically into the latch boundary) — decide at showreel breakdown time. Neither is load-bearing for the site itself.

So the recommended split: **latch = source-of-truth boundary; GSAP timeline (or whichever you prefer to direct with) = scene playback**, calling back into the latch at boundaries (`timeline.onComplete → intro.done = true`). You orchestrate the timeline; pages and routes never know how many scenes exist — they read only the three latch flags. Assets preload gate (all promises settle OR last — whichever later) wraps whatever your sequence consumes.
