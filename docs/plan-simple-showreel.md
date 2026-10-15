# Simplified Showreel + expandable Projects — next-session plan

Status: **implementation landed directly in the Svelte app; local code gates and bounded fix reviews pass; full release acceptance remains open**. No commit, push, CMS write or deployment is authorized. See the continuation record below before repeating work.

## Continuation record — 2026-10-13

**Latest annotation + fullscreen opening:** [round-2 record](simple-showreel-annotation-round2.md). Fullscreen 100dvh ASCII intro, optically centred play triangle, header-level catalogue toggle, redundant montage hidden from gallery (24 Projects), and official logos for all three verified clients are built. Supplied HEIC confirms the 14-segment map; `wawe-payload/docs/showreel-timings-approved.txt` is validated against production slugs and used by the local read-only preview. Gates: 62 tests, 0 errors/13 existing warnings, build + expanded browser regression pass; CMS type/lint/format gates pass; 5 rasters/0 missing. User explicitly authorized the named **production CMS content** operations, superseding earlier no-CMS-write language only for those operations. Actual writes remain blocked: production Showreel global 404, no authenticated admin session. No deployment was authorized and no production mutation made. Save/verify independent Showreel first; retain Media; never delete the source Project before that. Previous no-commit/push/deploy/email boundaries remain.

**User annotation follow-up:** [three-request implementation record](simple-showreel-annotation-feedback.md). The user's newer feedback overrides the former desktop height cap/native-bar presentation: centred full-width actual-ratio film, hydrated tap play/pause and bottom-right mute (native controls retained for SSR/no-JS), unboxed verified-client artwork. Menu works in the real app; the HTML-only annotation copy was inert. Next annotation uses live-app mode. New local gates: 61 tests, same 0 errors/13 retained warnings, build and expanded browser regression pass; 3 rasters/0 missing provenance. Razorpay logo is official, but preview cue windows remain explicitly synthetic—not approved editorial timing. Earlier gate counts and reviews below are historical evidence, not a fresh approval of these follow-ups.

- Built directly in `src/`: native Showreel + preserved ASCII field/motion kernel, below-film sticky identity/menu, one keyed five-to-all Project grid, filters/sorts/URL state, Contact/Footer, factual detail pages with sanitized rich text, unique SEO and sitemap/robots. Old stack/filmstrip modules and historical prototypes remain retained but are not homepage imports.
- P0/P1/P2 and A–E/P3/P4 implementation packets landed. The synchronous read-only subagent preflight and synchronous parallel waves succeeded. **Async** workers still hit the documented Pi package-resolution error; an interrupted P1 worker left partial files, which the coordinator inspected, finished and tested. Do not assume async was repaired.
- Baseline: Node 24.20.0; repo-local pnpm resolves its pinned 10.34.6 despite global 12.11.2. Original check had 0 errors/20 warnings; 9 landing tests and build passed. Dirty tracked diff/status snapshot: `/tmp/wawe-simple-baseline/` (ephemeral, not a release artifact). Existing unrelated dirty work was preserved; sibling Payload repo remained untouched.
- Final local gates: `pnpm test` **60 passed**, `pnpm check` **0 errors / 13 existing warnings in retained unused Intro.svelte**, Cloudflare-adapter `pnpm build` passes, `git diff --check` clean. `pnpm test:browser` requires a built preview with a read-only >=6-Project/Tag fixture; it reproduced Q1-01 red before the fix and passed afterwards, independently reverified. It is not an arbitrary-production-catalogue test.
- Q1: [functional report](simple-showreel-functional-qa.md), [bounded Back-fix verdict](simple-showreel-functional-verdict.md). Q2: [design review](simple-showreel-design-review.md), [implementation-fix verdict](simple-showreel-design-verdict.md). The reviewer’s `ship` word is **bounded to implementation fixes**, not full-surface/release approval. Source bugs addressed: shallow URL → Project → browser Back restoration, background animation finalization, identity crossfade, unavailable form copy/disabled fields, and native caption-track plumbing. No caption assets were fabricated.
- Chromium checks covered 320/390/768/1920 widths, one nav/footer, sticky containment, same-five DOM preservation, filtering/sorting/SSR/back, reduced motion and user pause, 404/unavailable CMS and metadata/sitemap. Real device, full stress/focus matrix and realistic cold performance remain unapproved. Mechanical detector ran once (`[]`); shipping badge-mask/OG provenance scan reports 2 assets / 0 missing. Do not rerun design polishing without new material evidence.
- Actual system is now documented in root `DESIGN.md`, `.impeccable/design.json`, [design-system.md](design-system.md) and [production-readiness.md](production-readiness.md), with ADR-0002 code-first authority and scoped ADR-0003 supersession. The user-pinned development contract is `.impeccable/surfaces/src-routes-page-svelte.md`.
- **External release blockers:** production Showreel global returned 404; QA used a read-only public catalogue snapshot and explicitly fixture-only reel/cues. Owner must provide/authorize real reel/poster/cues, clean existing CMS placeholder descriptions, supply approved WebVTT assets (`src/lib/media/captions.ts` manifests are empty), configure Turnstile/Resend and validated `PUBLIC_SITE_URL` + explicit `PUBLIC_SITE_INDEXING=index|noindex`, then verify actual host/crawlers/devices/performance. No production CMS writes or real QA emails were made.

The specification below remains the acceptance contract, not a reason to rebuild completed packets. P5's local fixes/documentation are recorded, but its full acceptance close is intentionally unchecked while the external obligations remain open.

## 1. Authority and confirmed brief

This plan supersedes the homepage's stacking/fan/filmstrip choreography and older settled-layout handoffs. It does **not** supersede the accepted ASCII wave calculations. Read `AGENTS.md`, `CONTEXT.md`, `PRODUCT.md`, this plan and the two references before work.

Saved user references:

- `docs/references/simple-showreel-top.png` — large, top-flush video; rounded bottom corners; generous side gutters; WAWE badge / separator / current client / Menu beneath.
- `docs/references/simple-showreel-scroll.png` — video leaves the viewport; identity/navigation travels upward; Projects follow beneath.

Original references were Raycast clipboard files ending `5f523fc184f88fc206dcb5be48e73afa.png` and `6d7dd8c95045a12aaa2a452ae63adf65.png`. Use the saved copies, not ephemeral clipboard paths.

Explicit user requirements and answers:

- Keep intro ASCII wave.
- Simplify Showreel to a video at the page top, with `WAWE Films logo | client logo currently playing … Menu` directly beneath.
- **Only the nav sticks**. Video scrolls away normally; no scroll-pinned video, scrubbed playback or sticky-stage choreography.
- Start with the top five highlighted Projects. “View all projects” expands in this page, pushing Contact and Footer downward smoothly.
- Reuse existing filters; add sorting.
- Homepage Contact section/button, Footer, and a dedicated Contact page.
- Individual Project pages from real available information; proper OG tags and SEO.
- **Archivo Narrow headings**.
- Primary audience: prospective clients/agencies; watch → explore → enquire.
- User selected a complete archive and added: ideally the five highlights transition into that archive; highlighted order is priority-number order. **Resolution: one keyed Project grid, collapsed to five, expands into the complete catalogue; no duplicate highlights section.**

### Scope / anti-goals

No new branding tournament, ornamental goo, Project stack, filmstrip, ring renderer, new service claims, testimonials, invented credits/results or unnecessary CMS schema expansion. Preserve current source URL allowlists, streaming/cancellation and working content contracts. Do not overwrite dirty work or revert historical prototypes. Do not delete old rendering modules until imports and retained tests have been checked.

This is an Experience surface: the actual films lead; navigation is secondary. Contact is a clear close, not competing hero copy.

## 2. Impeccable setup and continuation

Installed official `pbakaus/impeccable@impeccable` locally in the parent workspace:

- Skill: `../.agents/skills/impeccable/SKILL.md` relative to the site repo.
- Launcher: `../.agents/skills/impeccable/scripts/impeccable`.
- Source checked via GitHub metadata and skills listing; installation reported Safe / one Socket alert / Low Risk. Read the skill before executing its scripts.
- Context command ran successfully with target `src/routes/+page.svelte`.
- Created `PRODUCT.md` after the user confirmed audience and behaviour. No `DESIGN.md` was written: it must describe the finished implementation, not imaginary tokens.
- Loaded Impeccable `init`, `shape`, `new-work` and Experience mode guidance. This session stops at the planning boundary: no UI edits, detector run or build-phase claims.

Next session, load the skill and run its context command **once for that new session**. The supplied layout/font/intro direction is pinned by the user: do not reopen it as a random concept choice. Before UI editing, read `reference/craft-floor.md`. Write the required development-only surface direction contract from this confirmed plan, using the skill's surface-brief tooling; document a user-pinned direction honestly, never invent a random seed or comp approval. No image-generation tool was available during planning; no standing comp/code workflow preference was recorded.

Preserve ADR-0002's **code-first tokens** (`src/app.css`) with side documentation. At finish, document the actual system and reconcile its relationship with `docs/design-system.md`, rather than creating contradictory authorities. The user-requested dark surface and Archivo Narrow headings replace older paper-default/Pilcrow-display guidance for these surfaces; note the scoped change against ADR-0003 in implementation documentation. Do not alter the ASCII intro's own typography/palette implicitly.

## 3. Existing implementation / content inventory

| Area | Current source / finding | Plan consequence |
| --- | --- | --- |
| Homepage | `src/routes/+page.svelte` mounts `Landing`, introductory marketing text, whole grid, filters and LogosStrip | Replace orchestration; remove unsolicited middle marketing/logos sections from the new page, preserving components for other uses |
| Homepage data | `src/routes/+page.server.ts` fetches Projects, tags, clients, domains and Showreel in parallel | Existing small-catalogue SSR data can serve the new browser; no mandatory new endpoint |
| Ordering | `src/lib/server/payload.ts#getProjects` sorts numeric `priority` ascending, then `createdAt` descending | Reuse and centralize deterministic ordering; there is **no separate highlighted boolean** |
| Project schema | `wawe-payload/src/collections/Projects.ts` | `title`, `slug`, `shortDesc`, `priority`, `clients[]`, `tags[]`, `video`, optional `poster`, `content`/`content_html`/`content_output`, optional `carouselMedia[]`, `partMedia[]`, flags, timestamps |
| Client schema | `wawe-payload/src/collections/Clients.ts` | `title`, optional Media `logo`, `description`, `domains[]`; no explicit primary-client field |
| Available filters | `ProjectFilters.svelte` | Tags (`tag.tag`) and Domains (`domain.domain`), with Domain inherited through Project → clients → domains |
| Landing intro | `src/lib/landing/{approved-opening.json,field.js,motion.js,fluid.js,glyph-atlas.js}` plus `runtime.ts` | Accepted wave lives here, **not just** old `components/Intro.svelte`; isolate wave from stacked scene carefully |
| Current coupled scene | `src/lib/landing/{Landing.svelte,runtime.ts,scene.js,media.ts}` | Currently loads Project textures and draws Showreel/cards; replace settled scene, stop waiting for optional Project media to reveal hero |
| Cue resolution | `src/lib/landing/cues.ts` | `currentProject` validates unique cue/project, start inclusive/end exclusive; `observePlayback` covers seeking, loop and decoded frames. Reuse against **full catalogue**, independent of filters/visible five |
| Sources/proxy | `src/lib/landing/sources.ts`, `src/routes/api/landing-media/+server.ts` | Reuse safety policy and normalized media URLs; preserve Range/HEAD/cancellation tests |
| Root shell | `src/routes/+layout.svelte` | Currently mounts fixed Nav above all routes and adds 56px offset on inner routes; must remove duplicate homepage nav and hard-coded sticky offsets |
| Existing nav/footer | `components/Nav.svelte`, `Footer.svelte` | Fixed text nav; white footer. Replace treatment for new dark site shell |
| Project page | `src/routes/project/[slug]/{+page.server.ts,+page.svelte}` | Already fetches by slug, 404s, renders main media, HTML, extras. Extend rather than invent a new route |
| Contact | `src/routes/contact/{+page.svelte,+page.server.ts}`, `components/Turnstile.svelte` | Existing Zod/Turnstile/Resend flow; reuse and harden, not a new delivery backend |
| Existing SEO | Layout generic tags; Project tags; `static/robots.txt`; no sitemap found | Layout hardcodes homepage OG URL; Project currently prefers **video URL for og:image**, which is wrong; consolidate |
| Typography | `src/app.css`, `static/fonts/Archivo-Variable.woff2`, Pilcrow files | Archivo variable is **not the named Archivo Narrow family**. Add actual licensed/self-hosted Archivo Narrow; retain Archivo body/UI and logo artwork |
| Release history | `docs/production-readiness.md`, `docs/cloudflare-workers.md` | Cloudflare Workers target; Node 24.20.0 / pnpm 10.34.6; existing local checks are historical, not evidence for new changes |

Repository is already heavily dirty, including homepage, layout, tokens, landing modules, loaders and docs. Snapshot `git status --short` and inspect diffs before touching anything. The sibling Payload repo was clean at inspection. No secret files were read.

## 4. Composition and motion specification

### 4.1 Page sequence / visual grammar

```text
ASCII wave opening → reveal native Showreel
┌──────────────────────────────────────────┐
│         SHOWREEL, top-flush               │
└──────────────────────────────────────────┘
 WAWE badge  |  active client logo     MENU  ← flows upward, then sticky

 Highlighted Projects                 [5 / N]
 [Project 1] [Project 2] [Project 3]
 [Project 4] [Project 5]
              [View all projects]

 Contact us → /contact
 Footer
```

On expansion the **same** section becomes All Projects; filters/sort enter above the same keyed cards; remaining Projects append after the first five under default Highlighted sort. Contact/Footer move down. Filters or explicit sort may then move any Project, including former highlights.

- Keep the reference's Midnight Ink-derived dark ground / warm-paper foreground and real logo, with gutters aligned across video, bar and Project grid. The existing nav uses `#040e19`-derived colour; consolidate the actual chosen dark colour into a code token instead of scattering literals. Validate contrast rather than sampling screenshots blindly.
- First desktop viewport shows the film and identity bar, not giant marketing text. Hero height bounded by available `svh` minus bar/gaps so very wide screens do not push the bar away. On mobile use a usable video aspect ratio, not full-height forced cover. Main playback uses `object-fit: contain` unless supplied footage composition explicitly supports crop.
- Suggested gutters: fluid ~20px mobile to ~5vw desktop; constrain extremes. Gentle video/card corners matching reference, not decorative nested panels.
- Grid: 3 desktop / 2 tablet / 1 phone columns. Equal preview frames for calm sorting; contain portrait content or provide a deliberate crop only for preview. Show five naturally in 3+2, no blank sixth filler.
- Actual Archivo Narrow family for section headings, Project titles and Menu display label; Archivo for reading/form/filter UI. Self-host WOFF2 with licence notice, only needed weights, `font-display: swap`; preload at most the critical heading face. Keep logo as logo, and accepted wave type unchanged unless separately agreed.

### 4.2 ASCII opening → native Showreel

Keep accepted field parameters and temporal wave behaviour. Extract a small intro-only runtime that paints the wave over the real DOM video/poster; remove dependence on scene card textures, deposited logo, stack/unfurl and matching invisible canvas video. One native video must own readiness, playback and identity.

- Server renders real video/poster, nav and Project links. Intro overlay is a progressive enhancement; failures cannot leave an opaque permanent loader.
- Reuse bounded readiness/failure behaviour and lifecycle cleanup; do not wait for all Project videos. Document whichever existing readiness boundary is retained, rather than inventing thresholds from old handoffs.
- Reduced motion, JS disabled, unavailable canvas and failed media show a usable settled page; reduced motion does not autoplay a moving montage without consent.
- Muted/playsinline autoplay is optional and policy-safe; always offer pause/play and explicit sound/native controls. Rejecting autoplay exposes Play, not a stuck gate. No hover-only controls.
- Pause offscreen/background media; resume only if previously playing automatically, not if user paused. Keep current cue identity tied to actual visible player time and clear it on source reset.
- Dispose all RAF/frame callbacks, observers, video listeners and requests on navigation; dispose the intro renderer after reveal. Keep wave libs/licence if still used.

### 4.3 Sticky identity bar and menu

Bar lives **after** video in normal document flow with `position: sticky; top: 0`. It must be a child of the long homepage content container, **not trapped inside a short hero section**. No scrolling ancestor with unintended overflow; no transform on the sticky parent. Inner routes use the same bar at their top, without Showreel-client claims.

- Left badge links home; separator; current client's true logo or legible name fallback. Identity may link to the uniquely resolved current Project.
- Cue gaps, invalid/overlapping cues, missing Projects and placeholder reel show `SHOWREEL`, with no invented client link. One client → logo/name. Multiple clients → display verified names compactly (or paired logos if they fit), not arbitrarily claim the first is primary. Unpopulated relationships resolve from `data.clients` by ID. Missing logos use text. Do not blindly invert colourful client art; use approved monochrome assets or a neutral logo backing.
- Keep an identity slot with bounded dimensions so logo changes do not shift Menu. Crossfade at ~120–160ms; no assertive live announcements on every film cut. Long names truncate visually but retain accessible name.
- Sticky bar may reduce padding subtly once stuck, but prefer stable height to avoid layout jumps. Anchor targets use the **actual** bar height (`scroll-margin-top`), not old 56px assumptions.
- Menu button opens a quiet anchored panel below the bar: `Showreel`, `Projects`, `Contact`. No invented About page. Desktop panel right-aligned; mobile spans content width. The sticky bar remains visible; panel overlays rather than expanding document height or replaying intro.
- Use a semantic button + ordinary navigation links, not ARIA application-menu roles. Toggle label Menu/Close, `aria-expanded`/`aria-controls`; Escape/outside click/route selection close. Keep keyboard focus inside if implemented as modal; otherwise a non-modal disclosure with natural tab order. Choose **non-modal disclosure** as default, so no scroll-lock or focus-trap is needed. Restore focus to trigger on Escape.
- Opening: ~180–220ms opacity and small translateY (≤8px), exit ~140ms; reduced motion immediate. Never animate `top`/full-screen blur. Projects menu item on homepage expands archive before targeting it; inner routes link to `/?view=all#projects`.

### 4.4 Unified highlighted → archive interaction

States: `collapsed`, `expanding`, `expanded`, `collapsing`; separate filter/sort state and loading/failure only if a real deferred fetch is introduced.

Data rule:

1. Highlighted order = finite numeric priority ascending (zero valid; missing/invalid last).
2. Ties = `createdAt` descending, then stable ID/slug tie-break. Do not mutate loader arrays.
3. Collapsed = first `min(5, N)` in that order. No separate flag/schema migration needed.
4. Expanded default = full catalogue in **that same** order. Header becomes All Projects, controls become usable; first five keep keyed DOM identity.
5. Sort options: **Highlighted**, **Recently added** (`createdAt`, not a claimed production/release date), **Title A–Z**. Do not invent duration, budget or production-year sorts absent fields.
6. Filters: Tag OR within a selected Tag choice, Domain via any related client, and Tag + Domain intersection. Retain current single-choice-per-group behaviour initially. “Clear filters” resets both; sorting is explicit and stays selected.

Use one keyed `{#each ... (project.id)}` grid and shared card component. No duplicate copy of the same Project or view-transition name. When collapsing, reset to highlighted sort / no filters before taking the five, and tell the user via labels/count. Keep expanded state in the URL (`?view=all&tag=…&domain=…&sort=…#projects`) so Project → Back restores it; replace query history for filter churn, avoid dozens of history entries. Validate unknown parameters harmlessly.

**Loading contract:** current SSR already fetches the full small catalogue for cue resolution. First version expands from that dataset and lazily loads newly visible **preview images/media**, not another redundant Project request. The UI says “View all projects”, not fake “Loading” for existing data. Never eagerly mount N playing thumbnail videos. If CMS scale later warrants deferred metadata, add a validated endpoint with loading/retry/abort; keep cue identity resolution independent. Do not add that complexity by default.

**Smooth expansion implementation:**

- Measure old and new section height around the keyed update; animate measured height from old to new over ~320ms `cubic-bezier(.22,1,.36,1)`, then remove fixed height. This is a bounded, user-triggered layout animation that genuinely pushes Contact/Footer, not absolute-positioned content.
- Reuse first-five DOM nodes; use FLIP/`animate:flip` for actual card position changes (~240ms), and fade/translate new cards ~160–200ms with at most a tiny capped stagger. No cascading two-second archive reveal.
- Disable/serialize repeat toggle during transition or cancel current WAAPI transition and continue from the current measured height. Resize/image/font changes must retarget/finalize gracefully. Reserve aspect ratios before images load; remove overflow clipping at completion.
- Controls/header enter without a large sudden jump; their space is part of measured height. Focus stays on the toggle (which moves into its expanded position) or an explicitly focused archive heading; never silently focus the first card.
- Collapse: if focus is in a disappearing card/control, move it to the surviving toggle; ensure the Projects heading/bar remains in view when closing a long archive. Reduced-motion: apply state instantly, no animated height/reorder, preserve focus.
- No forced scroll to the page top on expand. Avoid native scroll anchoring fighting the section animation; scope any anchoring suppression to the transition rather than leaving `html, body { overflow-anchor: none }` globally without review.
- `N ≤ 5`: omit redundant View All toggle; keep All Projects/filter affordance available when useful. Empty/failed CMS: honest empty/unavailable state with contact path, no permanent intro or fictitious count. Filter zero-results: explain, show Clear Filters.
- Progressive enhancement: a GET link/form query renders expanded/all state and filter/sort results on SSR without JS. Preserve semantic Project anchors for indexing and navigation.

### 4.5 Contact and Footer

Homepage: short `Contact us` heading, existing truthful invitation, strong link to `/contact`; add verified email/social details only if provided by current approved content. No form duplicated on homepage in first version. Footer: real copyright, Projects/Contact links, only verified socials/legal links, same dark/paper system and safe-area spacing.

Dedicated `/contact`: reuse existing name/email/message submission and delivery path; properly associate labels/IDs, autocomplete, inline errors, global error, pending and success feedback, accessible focus, retained values on failure and 16px minimum inputs on phones. Optional `?project=slug` seeds message/context safely; never silently submits.

**Existing release blockers must be addressed in this packet:** client currently needs a token even when no public site key; server bypasses verification without secret; missing Resend returns pretend success and logs personal data. Choose explicit production fail-closed behaviour and a clearly labelled local test mode if needed, never false “sent” success. Verify token hostname where configured, do not leak delivery errors/secrets/PII, mock email/spam calls in tests, and do not send real email during QA without permission.

### 4.6 Individual Project pages

Keep `/project/[slug]` and valid 404 behavior. Layout: shared top navigation → primary film with native controls/poster/real ratio → Archivo Narrow H1 + clients/tags + `shortDesc` → existing safe rich text → optional additional media/parts → contact CTA and next/back exploration → Footer.

- No empty credits/service/result modules. There are no structured director/crew/year/result fields in the current schema; render such information only if it already exists in factual rich text.
- Detect images vs video by MIME type, not only URL extension (`.mov`, query strings, image parts); numeric/unpopulated relationships must not crash. Use video rendition fallback and normalized URLs; **never use a poster image as a video src**.
- Poster missing: playable video remains usable; card may have honest preview fallback. Image missing: do not create broken `<img>` or label MP4 as a share image.
- Render CMS HTML through an established safe policy/server sanitization; do not inject arbitrary markup/scripts just because it is CMS-sourced. Preserve legitimate uploads/content formatting.
- Optional media controls load only visible/selected items; all useful links and text SSR. Parts labelled by actual available content, otherwise neutral numbering.
- Back to Projects restores expanded/filter/sort URL state, with `/#projects` fallback for external arrivals. Add related/next Projects only if inexpensive real catalogue data is available; not mandatory new relationships.

## 5. SEO and sharing contract

One SEO component/helper owns route-specific metadata. Avoid layout and page competing OG/title tags. Use `PUBLIC_SITE_URL` via an explicit, validated URL helper; HTTPS absolute canonical URLs, normalized media origins and encoded slugs. Layout retains global organization identity only where appropriate.

- `/`: truthful title/description, canonical homepage, website OG type, OG title/description/url/site_name, real **image** fallback, image alt/width/height/type when known, matching Twitter large-image tags.
- `/project/[slug]`: `<title>{title} — WAWE Films</title>`, description from `shortDesc`, canonical detail URL, route-specific OG/Twitter, **Poster Image** preferred, approved static fallback otherwise. **Never put main film URL in `og:image`.** Use a static share asset (e.g. 1200×630 PNG/JPEG) from real brand artwork for missing posters; no invented commercial claims. Verify crawlable media and MIME types.
- `/contact`: specific title/description/canonical, website OG, default share image.
- Expanded/filter query states are browsing variants: canonical to `/`, not thousands of filter pages; all real Project pages stay discoverable. Staging `noindex` policy must be environment explicit.
- JSON-LD: truthful Organization and homepage ItemList; BreadcrumbList for Projects. Add VideoObject only when required actual facts (name/description, usable thumbnail, real upload date/content URL) are present and policy-safe. Do not fabricate duration/uploadDate/production credits; escape `<` in serialized JSON-LD.
- Add `src/routes/sitemap.xml/+server.ts` with homepage/contact and real Project canonical URLs; XML escaping, valid content type, legitimate `updatedAt` lastmod, no filter variants, no placeholders. CMS failure must not silently replace a good sitemap with an empty success; retain a known-good cache if available or return retryable failure.
- Update `robots.txt`/route with canonical sitemap location and staging policy. Share URLs/images must be publicly fetchable without cookies; no localhost/staging origin in production metadata.
- Route HTML tests assert one canonical, one OG URL/title/image per route, correct detail image MIME, no video-as-image; test missing poster, quoted/slashed slug, CMS unavailable, robots/sitemap XML and safe JSON-LD.

## 6. Parallel execution plan

### Operating rules

Coordinator owns interfaces, orchestration, merges and gates. Workers get explicit file allowlists and do not edit outside them. Prefer shared workspace with disjoint ownership for this **dirty** repo. Do not start a clean worktree and assume it includes accepted uncommitted work. If worktrees are needed, first obtain an approved baseline snapshot that includes the dirty state; never stash/reset/commit implicitly.

Run at most three substantive workers concurrently. Each packet receives: this plan, `PRODUCT.md`, `AGENTS.md`, `CONTEXT.md`, reference paths, agreed contracts below, its exact write boundary and expected tests. Require a changed-files summary, tests actually run, open failures and no self-certified deployment approval.

**Subagent preflight blocker observed this session:** both read-only worker attempts failed before model execution with `Found pi at /Users/tug/Library/pnpm/bin/pi, but could not locate @earendil-works/pi-coding-agent.` Run a trivial read-only subagent at session start; diagnose package resolution through documented Pi setup if still broken. This is a harness issue, not application code. Do not claim parallel tasks ran successfully until the tool works. If unresolved, tell the user and retain the packets; serial work is a fallback, not silently labelled parallel.

### Dependency graph

```text
P0 baseline + harness + contracts
 └─ P1 content/media contracts + P2 tokens/type (coordinator gate)
      ├─ A Showreel + ASCII adapter ─────┐
      ├─ B Project browser ─────────────┤ → P3 homepage/shell integration
      └─ C navigation + Contact/Footer ┘
      ├─ D Project detail ──────────────┐
      └─ E SEO/sitemap ────────────────┴ → P4 route metadata integration
                                               ↓
                              Q1 functional QA + Q2 fresh design review
                                               ↓
                                 P5 one fix batch + documentation
```

D/E can run in wave two while coordinator integrates A/B/C. C covers contact route independently from D; coordinator alone mounts shared Nav/Footer/SEO into root/page files.

### Task packets / checklist

- [x] **P0 — Freeze boundaries and establish baseline** (coordinator)
  - Snapshot existing git status/diffs; verify Node/pnpm; capture current `pnpm check`, `pnpm test:landing`, `pnpm build` results without attributing old failures to new work.
  - Repair/verify subagent preflight. Load Impeccable context/reference floor. Confirm pinned plan, create surface brief contract before UI edits.
  - Read reference images; record accepted intro tests/boundary before refactor. No deployment commands.

- [x] **P1 — Define pure content contracts** (coordinator; prerequisite for all workers)
  - Own new `src/lib/projects/model.ts` and tests, new `src/lib/media/normalize.ts` and tests; own any needed changes to `src/lib/server/payload.ts`, `+page.server.ts` and query validation.
  - Define typed, client-safe `ProjectSummary`, `ClientIdentity`, `ProjectQuery` and canonical sort/filter functions; preserve full catalogue cue resolution and ID relationship lookups. Avoid imports from `$lib/server` in browser code.
  - Return exact exported APIs and sorting/missing-media tests to workers. No CMS migration by default. Distinguish upstream unavailable vs empty where practical.

- [x] **P2 — Establish shared tokens and actual heading font** (coordinator)
  - Own `src/app.css`, heading font files/licence, shared route container/spacing/motion tokens. Keep accepted intro type isolated.
  - Obtain actual Archivo Narrow from a verified official source, self-host and retain licence. Don't silently rename Archivo variable as Narrow. Validate dark/paper contrast.
  - Publish agreed CSS classes/tokens and bar-height contract. Keep code authoritative; final documentation follows implementation.

- [x] **A — Simplify hero, preserve ASCII intro** (worker 1; after P1/P2)
  - Own `src/lib/home/ShowreelHero.svelte`, `src/lib/home/AsciiIntro.svelte`, intro-only runtime/adapters and their tests. May edit `src/lib/landing/runtime.ts`/`Landing.svelte` only if coordinator explicitly transfers ownership; prefer new adapter first.
  - Retain `approved-opening.json`/wave field without aesthetic recalculation. Reuse `cues.ts`/sources; refactor tests only for genuinely removed stack semantics. Do not edit `scene.js`/field libraries casually.
  - Contract: hero accepts real `showreel` source and emits visible playback-derived `activeProject`/identity state; no hidden second player; does not render Nav or Project cards. SSR usable, intro ends on failure; offscreen/reduced-motion cleanup tests.

- [x] **B — Build unified expandable Project browser** (worker 2; after P1/P2)
  - Own `src/lib/projects/ProjectBrowser.svelte`, `ProjectSort.svelte`, transition/state helpers, scoped tests; own `components/ProjectCard.svelte` and `ProjectFilters.svelte`.
  - Contract: accepts catalogue/tag/domain/client summaries + validated initial query, exports query-change/expansion state as agreed. Own entire Projects section, not root/homepage loader.
  - Build five → full keyed-grid transition, Highlighted/Recently added/A–Z sorts, Tag/Domain intersections, query restoration and SSR GET fallback, empty/error/focus/reduced-motion states. Preview loading only, no montage autoplay per card.

- [x] **C — Build sticky menu, Contact and Footer** (worker 3; after P1/P2)
  - Own `components/Nav.svelte`, new `components/MenuPanel.svelte`, new `components/ContactCta.svelte`, `components/Footer.svelte`, `routes/contact/+page.svelte`, `routes/contact/+page.server.ts`, relevant Turnstile fixes/tests.
  - Contract: Nav accepts `activeIdentity` and homepage/inner-page mode; supplies Projects-expansion request through agreed callback; component is sticky but coordinator controls its correct parent. It never fetches cue data or renders a second hero.
  - Implement accessible non-modal disclosure, logo fallbacks, all contact delivery states, fail-closed production configuration and privacy-safe errors. Preserve existing provider choices; do not send real mail.

- [x] **P3 — Integrate homepage and shell** (coordinator; after A/B/C)
  - Sole owner of `src/routes/+page.svelte`, `src/routes/+layout.svelte`, global context/routes composition and package/lock/config changes.
  - Compose video → nav → one browser → Contact → Footer; remove duplicate fixed nav, old landing canvas stack, intermediate marketing/logos section and hard-coded offset. Root renders Footer exactly once; homepage Nav is correctly positioned in long flow, inner Nav at top.
  - Pass active cue identity into Nav from visible hero; expanded menu links and Back restoration work. Confirm sticky containing block in browser, not just CSS inspection.

- [x] **D — Improve real Project detail pages** (worker 1 in wave two; after A and P1/P2)
  - Own `routes/project/[slug]/+page.svelte`, `+page.server.ts`, new `components/ProjectMedia.svelte`, optional rich-text adapter and detail tests.
  - Accept shared Nav/Footer/SEO contracts; do not edit root/layout or shared server helper. Render real clients/tags/description/content/extras and native player fallback, honest missing-media states, preserved back-to-archive context and Contact CTA.
  - Add accessible media type handling and secure rich text. Worker sends metadata input model to E/coordinator, rather than duplicating head tags.

- [x] **E — Implement SEO and sitemap primitives** (worker 2 in wave two; after B and P1/P2)
  - Own `src/lib/seo/*`, `components/Seo.svelte`, `routes/sitemap.xml/+server.ts`, robots file/route (choose one, no duplicate), approved static OG image/asset provenance and tests.
  - Contract: typed metadata factory accepts route/title/description/real image and returns absolute URLs; SSR component outputs unique tags. Organization schema separated from route schema.
  - No edits to homepage/layout/contact/detail files; give coordinator precise wiring patch/instructions. Reuse shared content fetch rather than duplicate secrets/config.

- [x] **P4 — Wire route SEO and finish integration** (coordinator; after D/E)
  - Remove stale layout competing tags; mount route-specific SEO for homepage, contact and Projects using worker primitives. Review route ownership transfer before changes.
  - Maintain node/test scripts and worker gates; remove unused live imports/dependencies only when verified, not historical prototypes as collateral.

- [x] **Q1 — Functional/accessibility/performance QA** (fresh read-only worker)
  - Run unit/type/build checks and browser matrix below, inspect actual built preview. No product edits; file exact reproducible defects with evidence.
  - Review executed and Q1-01 fix independently verified. The checked box means the review ran, **not** that the entire acceptance matrix/device/performance/content sign-off passed; see the two Q1 reports.

- [x] **Q2 — Impeccable finish review** (fresh independent reviewer, parallel with Q1 once evidence exists)
  - Use skill's shipped finish reviewer where available; otherwise explicit fresh review packet under the skill's documented fallback, not builder self-review.
  - Input: original requirements/confirmed answers, this plan/surface contract, actual desktop/mobile screenshots, reference images, changed targets, detector findings, code-led/no-approved-comp status, craft-floor path. No inherited builder optimism. Report disposition and material gaps.
  - Named shipped reviewer ran a full review then a bounded verdict over fixes. `ship` is scoped to implementation fixes; three original material obligations remain partial external release blockers, not full-surface approval.

- [ ] **P5 — Apply bounded fixes and record the built system** (coordinator)
  - Local source fix batch and shipped-documenter handoff are complete; full acceptance close stays open pending the content/configuration/device/performance handoffs listed in the continuation record and production readiness.
  - One consolidated fix batch for material findings; rerun relevant tests and recapture required views. Do not mark done with failures/open findings.
  - Follow Impeccable finish/documenter handoff. Update `DESIGN.md` and its skill sidecar as required from actual tokens; reconcile `docs/design-system.md` and old accepted-package wording, record scoped ADR conflict resolution, update production readiness without claiming deployment.
  - Return changed paths, real test outcomes, remaining content/device/release blockers and next action. Commit/push/deploy only with separate user authorization.

## 7. Verification / acceptance matrix

**Automated gates** (coordinator after each merge): `pnpm check`, `pnpm test:landing` with retained wave/source/cue coverage, new model/state/SEO/contact tests, `pnpm build`, `git diff --check`. Test command additions belong to coordinator. Existing scripts do not yet provide a general browser test suite; do not claim new tests ran until wired and executed.

**Browser automation:** load the `agent-browser` skill before browser work. Use fixture content/mocked contact provider calls; no production CMS writes. Inspect built preview, not only dev. Capture desktop 1440, mobile 390 and narrow 320; add tablet 768 and reference-like wide width to interaction checks.

Acceptance:

- Wave looks/behaves like accepted wave and reveals simple video; never stack/unfurl. Skip/reduced-motion/error/JS-disabled content stays usable.
- Scroll: video exits; identity bar naturally reaches top and sticks through Contact; one nav/footer, no parent overflow trapping, no horizontal overflow or layout jumps.
- Cue identity: boundary, seek backward, pause, loop, gaps, overlapping/invalid cue, missing Project, unpopulated client, multi-client, missing logo and placeholder tested; filter/sort never changes cue lookup.
- Menu: open/close/Escape/outside/tab order, anchors under sticky bar, Projects opens archive, route changes close; large touch targets and no trapped focus.
- Archive: 0/1/5/6/20+ Projects, null/duplicate/zero priorities, long titles, missing posters; first five persist on expansion; no duplicates, proper order/count/filter intersections; rapid toggles, resize mid-transition, image loading, reduced motion, collapse from deep scroll and focus on disappearing content.
- URL/back/SSR: external `?view=all` and filters work; invalid query safe; Project/back restores browser state; all anchors work without JS; no blank loading section.
- Contact: valid/invalid inputs, failed/missing spam config, missing email config, provider error, success mock, retries, retained values and label/error associations. Never log personal submissions or show false sent success.
- Project details: portrait/landscape, video/image parts, optional content absent, 404 and unavailable CMS, safe HTML, native controls and proper poster; no broken image-as-video source.
- SEO: rendered route HTML has unique metadata/canonical, absolute real image OG (never MP4), correct Twitter tags, valid/escaped JSON-LD and sitemap, staging noindex, canonical filter variants; social crawler can fetch image.
- Lifecycle/performance: no lingering wave RAF or hidden player after settle/navigation, no N-video autoplay archive, reserved preview geometry, no unbounded work on scroll. Measure LCP/INP/CLS/transfer in realistic cold preview; do not claim numbers from old stack tests.

Impeccable inspection discipline: one batched desktop/mobile capture round, one consolidated fix batch and at most one confirming round in the builder thread; fresh finish review handles remaining gaps. Run mechanical detector once on finished changed UI targets, not during planning. Real iPhone/Safari and Android tests remain explicit human/device sign-off, not emulation claims.

## 8. Restart prompt

> Continue `wawe-site-svjs/docs/plan-simple-showreel.md` from its continuation record, not P0. The simplified Svelte implementation and bounded code fixes already landed; do not rebuild the stack or restart a design tournament. Read `DESIGN.md`, current production readiness and the functional/design reports plus bounded verdicts. Resolve the explicitly open owner-supplied Showreel/cues/content/captions/provider-configuration handoffs and remaining actual-host/device/performance acceptance with separate authorization where needed. Preserve pre-existing dirty work; no CMS writes, real QA emails, commit, push or deploy without separate approval. Keep full acceptance open until the external blockers are genuinely verified.
