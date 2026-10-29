# UX/UI audit — AI-native production portfolio

Method: dual-agent (A: run_mvc7zthx_e75756 · B: run_mvc7zthx_07351e), independently followed by coordinator synthesis and local desktop/mobile proposal inspection. Target: live https://wawefilms.com/; source surface `src/routes/+page.svelte`, shared navigation, project catalogue, representative Project and Contact. This is a bounded observational audit, not customer research, accessibility certification or release approval.

## Intent and positioning

Owner-confirmed audiences: brand marketing teams and agency/producer partners, equally, seeking an **AI-native production house**. Recommended primary outcome: discuss a project/send a brief after assessing relevant work. Do not introduce an unsupported booking system.

Journey: **watch → judge relevance/craft → understand the available project context → enquire with a reference**.

Owner follow-up: restore the existing brief form; add socials and a public contact number. Contribution/process information is not currently available; proceed with existing facts and do not fabricate it. Exact public social URLs and number with country code are still needed. Source inspection found none. No guessed contact links were added.

## User stories and acceptance criteria

| Visitor and intent | Success criteria |
| --- | --- |
| Brand marketer: “Can this team make something right for my brand?” | Relevant real films, honest commissioned/spec distinctions, useful existing context, clear enquiry path. |
| Agency producer: “Can Wawe be our AI-native production partner?” | Judge craft and available experience quickly; enquiry can reference a specific film. Ask for missing responsibilities rather than inventing credits. |
| Creative director: “Show me the range quickly.” | Five priority-selected films, expandable full catalogue, shareable individual pages, filters/sort/Back preserve context. |
| Mobile visitor: “Let me watch without fighting the interface.” | First playable decoded frame plus all client logos and Wawe badge decoded before automatic reveal; usable muted player and no overflow. |
| Returning visitor: “Take me straight to the work.” | No mandatory animation lap or minimum duration; cached readiness may bypass the overlay entirely. |
| Slow-network/keyboard visitor: “Do not trap me in the loader.” | Verified static artwork fallback, bounded decode deadlines and overall timeout, Escape exit and immediate reduced-motion path. |
| Interested buyer: “I want to use this film as a reference.” | Existing project-aware enquiry URL retained; contact delivery must be enabled and verified before conversion readiness is claimed. |

## What works

- Accepted ASCII identity, dark midnight/warm-paper world and Archivo hierarchy feel authored.
- Native films lead rather than decorative interface scaffolding.
- Existing spec labels are honest and must stay.
- In-place expansion, individually linkable films and browser Back continuity support evaluation.
- Project-aware Contact URLs already exist.

## Priority findings

| Priority | Evidence and impact | Recommendation/status |
| --- | --- | --- |
| Release blocker | Contact says temporarily unavailable; form is disabled with no visible alternative. Visitors cannot complete the primary goal. | Owner chose restoring the brief form. Needs provider configuration and delivery verification; UI copy is not a delivery fix. No QA email sent. |
| P1 | Three live `/api/client-logo/…` responses are 502, although the original PNGs are healthy. Navigation falls back to text. | Local proposal uses validated public artwork directly; verified static fallback remains. No production fix/deploy claimed. |
| P1 | Existing intro waits for a decoded video frame but not logos, and finishes a scheduled motion lap; a visible Skip is offered. | Local proposal automatically dismisses on first decoded frame plus all required artwork, without a compulsory lap/Skip button. Escape, reduced motion, failure and timeout still fail open. “Ready” does not mean downloading the entire film. |
| P1 | No visible AI-native positioning; project contribution/process has to be inferred. Culture Circle title appears below the first desktop viewport. | Local homepage introduces only the owner-supplied positioning. Project title placement and richer factual context remain recommendations, not invented implementation. Owner says additional contribution facts are unavailable. |
| P2 | Expanded catalogue exposes `ssssss`, `SCaxc`, and repeated dots. Taxonomy contains only Spec Ads/showreel and offers limited useful narrowing. | Local cards suppress only observed placeholder forms; raw CMS records are unchanged. Keep existing filters/sort behavior; improve taxonomy only with approved editorial facts. |
| P2 | Highlight heading wraps heavily, count is detached, and five equal cards do not clearly lead. | Local proposal: Selected work, grouped count/action, same five IDs/order with two larger leads and three supporting films on desktop. Catalogue expansion keeps keyed nodes. |
| P2 | Puma frame mainly shows trouser legs; L’Oréal frame is blurred. Weak cover frames obscure what the films offer. | Editorial poster selection from actual footage, not automatic cropping or stock imagery. Current images unchanged. |
| P3 | Browser requests favicon.ico and receives 404. | Add an approved icon asset/routing separately. Not related to logo proxy failures. |

## All-logo verification

The public CMS contains exactly three clients. All original files are SHA-256 byte-identical to the committed official artwork.

| Client | Client ID | Media ID | Public asset | Browser decode | Live proxy at baseline |
| --- | ---: | ---: | --- | --- | --- |
| Razorpay | 1 | 80 | 200 PNG, 29,999 bytes | Pass | 502, empty body |
| Outskill | 2 | 81 | 200 PNG, 13,030 bytes | Pass | 502, empty body |
| Wispr Flow | 3 | 82 | 200 PNG, 13,544 bytes | Pass | 502, empty body |

**All logos exist; their deployed display path is broken.** The proxy discards failure details, so public evidence cannot distinguish server-side upstream/network failure from its MIME/body checks. No specific Cloudflare infrastructure root cause is asserted.

Local proposal takes the approved published URLs directly, still validates allowed origins/raster types, and predecodes all three plus the Wawe badge. Local-disk review compatibility may still use its bounded proxy; production R2 client artwork does not. On a remote image error, navigation tries exact verified static artwork before text. No arbitrary image hosts, SVG or viewer credential forwarding were introduced.

## Baseline design health

0 poor → 4 strong; subjective observational scores, not conversion measurements. Agent A reported severity; this table consistently converts that to positive health scores.

| Nielsen heuristic | Health | Main reason |
| --- | ---: | --- |
| Visibility of system status | 2 | Readiness is unclear; logo failures invisible as text fallback. |
| Real-world match | 2 | Hiring fit and contribution require inference. |
| User control/freedom | 3 | Playback, return routes and escape affordances exist. |
| Consistency/standards | 3 | Coherent shared visual world. |
| Error prevention | 3 | Disabled form prevents false submission but blocks the goal. |
| Recognition over recall | 2 | Relevant experience/role requires interpretation. |
| Expert efficiency | n/a | Not an operational/expert tool. |
| Aesthetic/minimalist design | 2 | Strong presentation undermined by placeholder content. |
| Error recovery | 0 | No visible route around unavailable contact delivery. |
| Help/documentation | n/a | Standalone help unnecessary for this portfolio. |
| **Total** | **17/32** | Eight applicable heuristics; no claimed post-proposal score. |

### Cognitive load and emotional journey

Watching is simple; expanded filtering asks visitors to interpret a sparse internal taxonomy. Default selected work should stay curated, not expose all catalogue choices immediately. Existing filtering stays available when expanded.

Emotional arc: intrigue → visual proof → uncertainty from unfinished context → contact dead end. Restore the endpoint of this journey before spending release effort on decorative motion.

### Persona red flags

- Time-poor marketer on mobile: a loader must not consume attention after content is usable; labels and covers must convey relevance before a long scroll.
- Agency producer: an AI label is not proof of responsibility or collaboration fit. No unsupported AI/process claims should be added to individual projects.
- Keyboard/reduced-motion visitor: must reach ordinary film controls without waiting for animation or losing focus to a hidden overlay.

## Local interactive proposal

Review at **http://127.0.0.1:4190/**. It consumes the real public production CMS read-only; it is not a deployed frontend and is not a static/non-hydrated HTML snapshot.

Implemented locally:

1. Decode first video frame and all artwork in parallel; automatic dismissal with a short fade, no artificial lap/minimum duration. Wave kernels, palette and glyph calculations unchanged; cached readiness can bypass the intro.
2. No visible Skip button. Escape exit/status text, reduced motion and timeout/failure behavior retained.
3. Direct approved public client images; verified static runtime fallback. Unnecessary Worker hop removed from their production rendering path.
4. Selected work heading plus concise owner-supplied AI-native positioning; count/action grouped together.
5. Two leading films/three supporting films on wide desktops, two/one columns responsively; same five priorities, no new claims, media cropping or poster substitutions.
6. Known placeholder summaries hidden on cards only; underlying records untouched.
7. More intent-led enquiry wording. Existing contact route/provider safeguards remain; delivery is **still blocked** until configured.

Deferred deliberately: contact provider production configuration, verified social/phone links, unavailable project contribution facts, editorial poster swaps, project-detail title relocation, richer taxonomy and favicon.

## Validation and evidence

- 71 tests pass, including all-artwork readiness/deduplication, fallback, abort/timeout/listener cleanup and placeholder suppression.
- Svelte check: 0 errors, 13 retained warnings in unused historical Intro.svelte.
- Cloudflare production build passes.
- Built preview browser checks: fullscreen overlay geometry; automatic finish without Skip; all three cue-matched logos decode; no client-logo proxy requests; uncropped video, playback/mute, Menu, keyed expansion, sorting/filtering and Project → Back restoration.
- Network-failure simulation aborts public logo PNG requests: intro settles and Outskill decodes from verified static fallback.
- Bounded desktop1512×864/mobile390×844 screenshots inspected. No horizontal mobile overflow; five selected cards remain.
- Baseline detector (three targets): two supplemental .875rem advisories. Proposal scan (seven targets): five font-size advisories and one Plex-font warning. These are inherited styles; Plex is explicitly retained for the accepted intro in DESIGN.md. No new display face was introduced.
- Browser overlay mutable preflight succeeded, but loading localhost detect.js from the live HTTPS page failed with onerror/zero transfer; **no reliable live overlay was presented**. Its temporary server was stopped. Screenshots, DOM measurements, detector CLI and network checks are the evidence instead.

Temporary evidence: `/tmp/wawe-ux-audit/` (before/after screenshots, logo-verification.json, logs and proposal-detector.json). Preview PID: `/tmp/wawe-ux-audit/preview.pid`; stop with `kill "$(cat /tmp/wawe-ux-audit/preview.pid)"`. Keep the app running for the user-requested Plannotator review.

## Questions resolved and still pending

Resolved: both audiences equally; first playable frame plus **all** logos; local interactive review only; restore brief form; existing project facts only, contribution first when information becomes available.

Pending owner facts: exact social profile URLs and public contact number with country code. Review their desired placement visually; never ship invented handles or a dummy phone number.

No source commit, push, deployment, CMS mutation or email submission was performed for this audit/proposal. Existing design contracts remain the accepted baseline; this local variant awaits annotation/approval before being promoted to canonical design documentation.

## Annotation round 1 — shared text and color styles

Owner annotation on the Culture Circle description: generate font/color styles and use a consistent type system. Implemented locally in `src/app.css`: named text styles bundle family, weight, size and leading; semantic color roles cover surfaces, primary/secondary text, borders, actions and focus. Applied across the eleven shared UI/Project/Contact components, with no change to the ASCII kernel or its Plex family. Card descriptions and section introductions now compute identically: Archivo 400, 16px/25.6px, Muted Stone. Titles use explicit Archivo Narrow 600 roles. `DESIGN.md` and `.impeccable/design.json` reflect the code-first styles.

Validation: 73 tests pass, including style-consumption and reading-contrast checks; check has 0 errors/13 retained warnings; build and browser regressions pass. Desktop/mobile render inspected; no mobile overflow. Preview build at 4190, live development review at 4191 (avoids the previous annotation proxy's compressed-HTML bridge warning). No push/deployment. Social/phone facts and brief-form delivery remain pending.
