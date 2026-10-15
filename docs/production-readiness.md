# Homepage release checklist

## CURRENT — simplified Showreel implementation packet (2026-10-13)

**Built implementation documented; release NOT approved.** The fresh design verdict
is `disposition: ship` for the **bounded implementation fixes only**, not the full
surface, production content or an operational watch → explore → enquire path.
Original material findings 1–3 remain partial external obligations; identity finish
is resolved. [Q1-01](simple-showreel-functional-verdict.md) is resolved for its tested
built-preview Back regression only. Other Q1 gaps remain open.

### Current implementation and recorded gates

- Newest [round-2/fullscreen record](simple-showreel-annotation-round2.md): 100dvh opening and header-level View all; redundant montage hidden; official Outskill/Flow/Razorpay artwork and supplied 14-cue map verified locally. **62 tests**, same 0 errors/13 retained warnings, build/browser pass; CMS type/lint/format pass; **5 rasters/0 missing provenance**. User authorized the specific production content writes, but none were applied: Showreel global 404 and admin authentication absent; CMS release/migration needs separate authorization. Earlier counts/synthetic fixtures/no-write statements below are historical, superseded only as stated in this record.

- Latest [user annotation follow-up](simple-showreel-annotation-feedback.md): centred full-width uncropped actual-ratio Showreel, tap/keyboard play-pause + bottom-right mute, native SSR fallback, official unboxed Razorpay logo for verified cue relationships, and actual Menu regression. **61 tests pass**, same 0 errors/13 retained Intro warnings; build/browser pass; provenance scan **3 rasters/0 missing**. This supersedes earlier 60-test/2-raster counts below, not their historical evidence. Preview logo windows are explicitly synthetic; approved production timing and other release blockers remain open. Use live-app Plannotator, not an inert HTML copy.

- Coordinator final rerun: frozen-lockfile install passes; `PUBLIC_SITE_URL=https://wawefilms.com PUBLIC_SITE_INDEXING=noindex pnpm build:workers` now runs **check → all 60 tests → build** and passes (0 errors / the same 13 retained Intro warnings). The browser regression passes again on final built preview `http://127.0.0.1:4185`; it remains fixture-backed, not production-media approval. Final provenance scan: 2 rasters / 0 missing. Ephemeral command logs: `/tmp/wawe-simple-baseline/final-install.log` and `final-workers.log`.

- Homepage now imports `src/lib/home/ShowreelHero.svelte`, shared Nav, one keyed
  ProjectBrowser and Contact CTA; layout owns one Footer. Old Landing stack/fan/
  filmstrip recipes and unused `Intro.svelte` are retained history, not shipping
  homepage imports. Accepted wave calculations/palette remain unchanged.
- Final supplied gate logs: **`pnpm test`: 60 passed, 0 failed; `pnpm check`:
  0 errors, 13 existing warnings, all in retained unused `Intro.svelte`;
  `pnpm build`: passes** with Cloudflare adapter. Environment: **Node 24.20.0 /
  pnpm 10.34.6**. These are implementation gate evidence, not hosted CI/release
  sign-off; this documentation pass does not claim to have rerun them.
- Fresh independent bounded browser pass:
  `BROWSER_TEST_URL=http://127.0.0.1:4184 pnpm test:browser` exited 0. It preserves
  original keyed nodes on expansion and restores shallow-created filtered/sorted
  archive URL, IDs, heading and selected controls after Project → browser Back.
  Rerun against a **built preview** backed by a read-only fixture with **at least
  6 Projects and a populated Tag producing a non-empty subset**, not an arbitrary
  production catalogue. See `scripts/test-simple-showreel-browser.mjs`.
- Q1 recorded Chromium widths **320 / 390 / 768 / 1920**: no horizontal overflow;
  one nav/footer, video scrolls away, sticky bar survives deep scroll; same-node
  expansion, GET SSR browsing, unique route metadata and valid sitemap checked.
  Snapshot sitemap had 27 URLs (25 Projects + homepage/contact). Small-catalogue
  SSR and CMS-unavailable/404 behavior also checked. These are bounded fixture/
  browser evidence, not a complete device, focus or stress matrix.
- Detector ran **once**, returned `[]`; no second detector run. Seven updated
  route screenshots in `.impeccable/review/` were reviewed. No comp approval or
  randomized visual direction is claimed.
- Shipping badge-mask and static OG PNG have embedded origin metadata; derivation
  is recorded in `static/og/wawe-films.provenance.json`. Supplied scan: **2 assets,
  0 missing provenance, no AI generation**. Provenance does not approve rights.
- Root [DESIGN.md](../DESIGN.md), schemaVersion-2
  [sidecar](../.impeccable/design.json) and [design-system.md](design-system.md)
  extract actual code. ADR-0002 remains code-first; ADR-0003's paper/rounded-display
  guidance is superseded only for homepage/Contact/Project shared shell, not wave.
  Actual self-hosted Archivo Narrow source/OFL notices are retained in
  `static/fonts/ArchivoNarrow-SOURCE.md` and `ArchivoNarrow-OFL.txt`.
- Project rich text is newly sanitized server-side with `sanitize-html`; this
  hardening is not a complete security audit. Hero/detail native caption tracks
  have tested plumbing; `src/lib/media/captions.ts` approved manifests are empty.

### Evidence boundaries and remaining release gates

QA used a **read-only public CMS snapshot of 25 Projects**. The production Showreel
**global returned 404**; review reel/poster/cues were fixtures, not approved
production footage or client associations. Missing/placeholder footage uses
`SHOWREEL` without invented Project/client claims. No public CMS records were
written. Current content/configuration blockers are external handoffs:

- [ ] Supply authorized approved Showreel, poster and saved cues; verify cue/client
  identity against the full real catalogue, gaps, seek/loop and multi-client cases.
  Review actual film/logo/music rights. Fixtures are not production claims.
- [ ] Owner-clean existing public CMS placeholder descriptions (e.g. `ssssss`,
  `SCaxc`, `ss`, `....`) and review Project titles/order/posters/renditions/Spec Ad
  disclosures and resulting SEO. Q1-02 remains open; no CMS writes authorized.
- [ ] Supply approved self-hosted **WebVTT** assets in `static/captions/` and populate
  approved manifests, then verify native track loading/language/default selection
  for Showreel and meaningful-audio Project/additional films. Empty manifests do
  not mean captioned access. Caption/audio rights and accessibility sign-off remain.
- [ ] Configure `PAYLOAD_API_URL`, public HTTPS origin **`PUBLIC_SITE_URL`**, and
  **`PUBLIC_SITE_INDEXING=index|noindex` explicitly**. Both are now referenced and
  validated by source; old claims below that they are unused/no sitemap exists are
  superseded. Verify DNS/redirects, unique canonical/OG/Twitter tags, public image
  retrieval, deployed robots/sitemap and intended staging indexing policy.
- [ ] Configure server **`TURNSTILE_SITE_KEY`**, **`TURNSTILE_SECRET_KEY`**, optional
  **`TURNSTILE_HOSTNAMES`** allowlist, **`RESEND_API_KEY`**, verified
  **`RESEND_EMAIL_SENDER`** and **`RESEND_EMAIL_RECEIVER`**. Hostname enforcement
  applies when configured; verification also checks action `contact`. Secrets
  remain server-side. Current form fails closed when required configuration is
  absent; no bypass, pretend success or submission logging. Unavailable controls
  are disabled and Turnstile is not mounted. Mock provider coverage is not proof of
  live delivery. Authorized integration/service sign-off is still required;
  **no real QA email is authorized by this packet**.
- [ ] Actual-host media/proxy validation: allowed origins, Range/HEAD, seeking,
  streaming, cancellation, cache/CDN limits/costs and tested security headers.
  Local proxy/fixture passes do not certify the deployed edge.
- [ ] Actual public social-crawler retrieval and share previews, not just preview
  GET/HEAD. Do not use video URLs as OG images or staging/localhost canonicals.
- [ ] Physical **iPhone Safari and Android**: touch, safe areas, rotation/browser
  chrome, playback policy and navigation. Chromium viewport emulation is not this.
- [ ] Complete keyboard/screen-reader/focus-disappearing-control checks, rapid
  toggles/resize during expansion, image/media failures, background-tab/lifecycle,
  cue overlaps/multi-client and additional-media browser matrix.
- [ ] Realistic cold-cache/throttled-network **LCP/INP/CLS/transfer** and mobile
  main-thread/GPU/battery budgets. Existing vitals had null LCP/FCP/INP and cached
  transfer zeros; cold performance is **incomplete, not measured/approved**.
- [ ] Reviewed full dirty diff and explicit source/assets/docs inclusion, hosted CI,
  staging smoke test, monitoring and rollback plan, then separate release approval.
  No commit, push or deployment permission is granted here.

Evidence: [design verdict](simple-showreel-design-verdict.md),
[original design review](simple-showreel-design-review.md),
[Q1 report](simple-showreel-functional-qa.md),
[bounded Q1 verdict](simple-showreel-functional-verdict.md). Original plan checkboxes
and old readiness evidence are not updated source-of-truth acceptance status.

## HISTORICAL — prior stack packaging and Workers checks

**All sections below are preserved historical evidence**, including older counts,
stack/debug recipes, former contact vulnerabilities, configuration gaps and
checklists. They do not describe the current simplified homepage and must not
contradict or override the CURRENT packet above. Prior checks are not new-release
proof; any still-relevant obligations are carried explicitly above. No historical
dirty documentation was deleted.

The accepted opening → surge → recede → perspective stack was packaged into the
previous SvelteKit homepage. That successful build was not production approval.
No deployment has been performed by this scoped documentation handoff.

## Local verification

- [x] Homepage mounted through `src/lib/landing/Landing.svelte`; browser runtime/assets live in `src/lib/landing/`, with no production prototype imports or DialKit dependencies.
- [x] Development-only Bottom Padding slider updates both the paused raster and clickable Project rectangles immediately (18 → 100 px checked). Spread Speed and Replay retained.
- [x] `pnpm test:landing`: six tests pass (source allowlist, independent Showreel fallback, media cancellation, layout/timing, readiness, SSR deadline signal).
- [x] `pnpm check`: zero errors; 20 existing warnings in four files. `pnpm build` passes.
- [x] Production preview: top-flush hero, automatic animation, six positioned Project links, no debug global or development controls; no horizontal overflow.
- [x] Mobile 390×844: live composition and reduced-motion native-player fallback; no horizontal overflow. These are emulated checks, not real-device approval.
- [x] Production-preview media-failure check exposes the native fallback and Project links instead of a permanent loading screen.
- [x] Real upstream Range request streams HTTP 206 with the requested 16-byte body; an untrusted proxy host is rejected. HEAD/Range also checked.
- [x] GPU regression `checkPaddingCache()` passes: old slot becomes transparent after padding changes and the relocated card remains opaque.

### Release-preparation recheck

The initial continuation review reran `pnpm check`, `pnpm test:landing`, `pnpm build` and `git diff --check`: all passed; type checking reported 20 warnings in four files and all six landing tests passed. That review preceded Workers configuration below. No fresh browser or real-device sign-off is implied.

Current configuration gaps and status:

- Workers target is selected: `@sveltejs/adapter-cloudflare` 7.2.9 and `wrangler.jsonc` replace adapter-auto; Node `24.20.0` and pnpm `10.34.6` are pinned. Adapter 8 requires SvelteKit 3, so it is deliberately not used.
- Workers Builds GitHub settings and runtime variables are documented in [cloudflare-workers.md](cloudflare-workers.md). CI runs the frozen install and local gates when configured; no hosted CI run or deployment has occurred.
- `PUBLIC_SITE_URL` is not referenced by application source; configuring it alone does not establish canonical URLs or social metadata.
- No sitemap route/file was found in the inspected route/static directories. `static/robots.txt` allows all crawling, so staging needs a separate indexing policy.
- Production landing source, assets, font files, CMS deadline helper and the streaming endpoint remain untracked. They must be explicitly included in an approved release commit. No Git remote is currently configured.
- Contact-form configuration is mandatory before launch: missing Turnstile secret bypasses verification, missing Resend configuration reports success without sending and logs contact data. See the Workers guide for the remaining hardening concern.

The user selected **Cloudflare Workers through GitHub integration**. This selection is not permission to commit, push or deploy. Credentials, final content/rights, actual-host validation and release approval remain open.

### Workers-specific local verification

- [x] `pnpm install --frozen-lockfile` succeeds with pnpm `10.34.6`; only required esbuild/workerd install scripts are allowed.
- [x] `pnpm build:workers` passes: zero type errors / 20 existing warnings, six passing landing tests and Cloudflare adapter output.
- [x] `pnpm check:workers` completes `wrangler deploy --dry-run` without upload; bundle is approximately 219 KiB gzipped with 43 static assets discovered.
- [x] Local workerd smoke test using only public configuration: homepage SSR contains 25 distinct Project links, a Project detail route and contact page respond successfully, a bundled font loads, and development controls are absent from SSR.
- [x] Local workerd rejects an untrusted proxy host; real CMS Showreel Range request returns HTTP 206 with exactly 16 requested bytes, and HEAD returns no body.
- [x] Invalid contact submission returns the expected SvelteKit action failure (`status: 400` in its JSON envelope); no email was sent.

These are local runtime checks, not browser/device QA or actual Cloudflare edge validation. The temporary local Worker server was stopped. No commit, push or deployment was performed.

The runtime has an overall 25-second loading deadline; optional Projects have separate six-second budgets per batch member, so slow Project renditions do not exhaust the Showreel budget. SSR CMS requests also have an eight-second deadline, covering response-body reads. Native playback explicitly takes ownership of the visible player so loading cannot hide an already-playing video.

### Current-Project interaction verification

The approved current-Project title/link is implemented for settled canvas playback and the native player. Cue ranges are start-inclusive/end-exclusive and resolve against the full Project catalogue. No card highlighting/reordering, accepted motion changes, CMS writes or deployment are included.

- `pnpm build:workers` passes with nine landing tests, zero type errors and the same 20 existing warnings.
- Isolated local fixture QA (14 Projects, local video fixture) verified canvas/native paused seeks at 0 / 2.2 / 5 / 6 seconds, backwards seeking, gaps, a missing Project and a Project outside the featured six. Placeholder fallback removes the Project claim. Reduced-motion native controls work after a user gesture; initial programmatic playback was correctly blocked by browser autoplay policy.
- Mobile emulation at 390×844 and 320×568 has no horizontal overflow. Long identity titles are clamped to three visible lines with the complete title retained as the link's accessible name and `title`.
- Scoped landing axe checks found zero violations; contrast over canvas and the montage's missing caption track remain manual review items. This is not real-device, production-CMS content or deployed-edge approval.
- Temporary fixture servers and browser session were stopped. No original/production CMS records were accessed or modified.

```sh
pnpm check
pnpm test:landing
pnpm build
pnpm preview
```

To rerun the browser-only padding/cache regression on the development site:

```js
(await import('/src/lib/landing/raster-check.js')).checkPaddingCache();
```

## Required before deployment

### Hosting and configuration

- [x] Choose hosting target and configure its adapter: Cloudflare Workers with Static Assets, `@sveltejs/adapter-cloudflare` 7.2.9 and `wrangler.jsonc`.
- [x] Pin Vite-compatible Node/pnpm in the repo: Node `24.20.0`, pnpm `10.34.6`. Apply the documented Workers Builds version overrides when connecting GitHub.
- [ ] Install with the committed lockfile, then run type checks, landing tests and the production build in CI.
- [ ] Configure `PAYLOAD_API_URL` to the production CMS origin, not localhost.
- [ ] Confirm `src/lib/landing/sources.ts` matches the deployed media origins/paths (`media.wawefilms.com/media/` and `cms.wawefilms.com/api/media/file/`). The new `/api/landing-media` proxy uses this fixed allowlist, not `R2_PUBLIC_URL`. Keep `R2_PUBLIC_URL` configured for any legacy media-proxy consumers. Test Range requests and cancellation on the actual host.
- [ ] Configure `PUBLIC_SITE_URL`, HTTPS, canonical domain redirects and DNS for the real deployment.
- [ ] For the contact form, configure and smoke-test Turnstile and Resend variables from `.env.example`. Never expose server secrets to the client.
- [ ] Verify serverless/CDN limits and costs for proxied video responses. Ensure the host streams responses instead of buffering entire videos; consider direct-media CORS/CDN delivery if needed.
- [ ] Set appropriate CSP/security headers after testing fonts, video, canvas, CMS/media requests and Turnstile. Do not enable cross-origin restrictions blindly.

### Content and rights

- [ ] Verify the CMS Showreel is the intended final montage. `/showreel-mock.webm` is a local placeholder fallback, not final content approval.
- [ ] Verify published Project order, titles, slugs, Poster Images and supported video renditions. Showreel cues now drive the current-Project title/link against the full catalogue; they do not reorder or highlight cards.
- The Payload CMS Showreel screen supports validated pasted/file timestamp imports; see `wawe-payload/docs/showreel-editor.md` in the CMS repo. This requires a separate CMS release, not merely the site's Workers deployment. The supplied 14-Project timing map is an import fixture, not saved production data; verify actual saved cues and montage on the intended CMS before release.
- [ ] Verify bundled font licence notices and media rights. The design-system doc identifies Pilcrow Rounded as Fontshare FFL 2.0 (free commercial); the earlier Pangram purchase requirement was retired. Confirm Archivo attribution and rights to every film, logo and soundtrack.
- [ ] Retain the bundled Viscose/noise MIT attribution.
- [ ] Ensure production metadata, social previews, robots and sitemap are correct; staging must not be indexed.

### Browser, accessibility and performance sign-off

- [ ] Test real Safari/iPhone and Android hardware, including portrait/landscape changes, safe areas and mobile browser chrome. Desktop emulation is not sufficient.
- [ ] Test keyboard navigation and a screen reader: skip/loading controls, Showreel playback, Project links, main navigation and the rest of the homepage.
- [ ] Test reduced motion, blocked autoplay, JavaScript disabled, WebGL unavailable/context loss, slow/offline CMS/media and an empty/partial catalogue.
- [ ] Test navigation away and back during loading/animation. Check for orphan audio/video playback, duplicate intros, leaked listeners and growing GPU memory.
- [ ] Measure cold-load transfer, LCP/INP/CLS, main-thread/GPU cost and battery impact on real mobile devices. Set budgets before launch; previous prototype frame measurements are not a production performance guarantee.
- [ ] Check that development sliders, debug globals and prototype/demo dependencies are absent from the production experience.
- [ ] Verify the rest of the site: filters, Project detail pages, contact form, navigation and footer.

### Release and rollback

- [ ] Review the full git diff, including pre-existing uncommitted work. Explicitly add the intended source/assets/docs; do not accidentally omit untracked runtime assets or include unrelated work.
- [ ] Create a reviewed commit/PR; deploy a staging preview first.
- [ ] Smoke-test the built deployment rather than only Vite dev: HTML/SSR fallback, video seeking, media proxy status codes, fonts, links and mobile layout.
- [ ] Add production error monitoring, CMS/media availability checks and logging that does not contain secrets.
- [ ] Record the known-good deployment/version and rollback procedure. Promote only after the above blockers are signed off.
