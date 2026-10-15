# Q1 fresh functional QA — simplified Showreel

## Scope and verdict

Read-only review of the built app at `http://127.0.0.1:4181`, against `docs/plan-simple-showreel.md`. Chromium session: `wawe-simple-qa`. CMS: caller-owned read-only snapshot at port 4310 (25 real Projects, fixture-only Showreel/cue). No source/package/config/shared-document changes, production CMS writes, contact POSTs or emails. Only this report and `/tmp/wawe-qa-*` artifacts were written.

**Not acceptance-complete: one reproducible archive Back-restoration defect, plus outstanding production content/device gates.** Broad core interactions work; unit passes are not a substitute for the browser finding below.

## Findings

### Q1-01 — High: browser Back loses shallow archive state

Repro on the built preview:
1. Fresh-open `/` (not an initial external `?view=all` URL).
2. Click **View all projects**. Select **Spec Ads**, **Title A–Z**, then **Apply**.
3. Confirm URL `/?view=all&tag=2&sort=title#projects` and three cards.
4. Click the first card (Country Delight), wait for its Project route.
5. Use browser Back.

Actual: URL still `/?view=all&tag=2&sort=title#projects`, but the section becomes **Highlighted Projects**, five cards, with filters/sort controls missing. This persists after navigation settles. Independently, a prior run showed URL/UI disagreement during Back with stale selected filters. A direct external load of the same filtered URL → Project → Back **does** retain three cards; the failure specifically concerns state created through the in-page shallow updates.

Expected: expanded three-card filtered archive, Title A–Z, matching URL. Required explicitly by sections 4.4 and 7.

Relevant code: `src/lib/projects/ProjectBrowser.svelte:20–23` seeds state from `initialQuery`; `:67` uses shallow `replaceState`; `:86–90` unconditionally reassigns loader `initialQuery`; `:107–108` adds a mount-time `popstate` listener. A remounted browser after Back can receive cached pre-shallow loader data; its listener was not present for the event that returned to the route. Review restoration against the current route URL rather than solely cached loader query, and add a real navigation regression test. This is a diagnosis from source/surface, not a tested fix.

### Q1-02 — Content/release gap (not new UI logic): placeholder descriptions are public

Expanded real-catalogue cards visibly render e.g. **Avimee — `ssssss`**, **Phool — `SCaxc`**, **Traya — `ss`**, and several `....` descriptions. These are downloaded public CMS values, not invented fixture strings. Card and detail/SEO paths render supplied descriptions. Content needs owner review before release; no CMS edits were made or authorized.

## Executed test matrix

| Area | Result / evidence |
|---|---|
| Automated tests | Independently ran `pnpm test`: **56 passed, 0 failed**, `/tmp/wawe-qa-test.log`. An initial `pnpm test:simple` probe failed because that script does not exist; corrected to the documented package script. |
| Type/build | Inspected supplied `final-check.log`: **0 errors, 13 warnings** in retained `Intro.svelte`; `final-build.log`: successful Cloudflare adapter build. Not independently rebuilt while caller preview was active. |
| Diff whitespace | `git diff --check` returned clean, `/tmp/wawe-qa-diff-check.txt`. |
| Shell / sticky containment | One `.identity-bar`, one footer. Bar ancestors through HTML have `overflow: visible`, `transform: none`. At Projects and deep Contact/footer scroll, bar top **0**, Showreel outside viewport. No short hero containing-block trap. |
| Menu | Open/close, outside heading click closes, Escape closes and focuses trigger. Panel exposes ordinary nav links after its CSS entrance. Homepage Projects opens all 25 and closes panel; heading is below bar. No modal trap observed. Full keyboard tab sequence was not exhaustively audited. |
| Keyed archive | Retained references to five original `[data-project-id]` nodes, expanded via Menu Projects: **all five same DOM objects**, 25 cards / 25 unique IDs. Original IDs `1,42,41,40,39`. One video total even with expanded archive. |
| Filters / sorts | Tag 1 yields Showreel only; Tag 2 yields three Spec Ads. Title A–Z gives alphabetical 25-card catalogue; Clear filters keeps explicit Title sort. Form Apply updates URL. Domain controls absent because real fixture domains are empty; browser intersection not exercised. |
| Collapse | From deep archive, centered toggle then clicked: five highlights restored, URL `/#projects`, heading top **131.36px**, bar bottom **115.19px**. Playwright-style auto-scroll first tried clicking a toggle beneath sticky bar and correctly reported coverage; centering it resolved this automation positioning issue, not treated as an app defect. Rapid-toggle/resize races not independently stress-tested. |
| URL / Back | External filtered GET URL and invalid query are safe. Direct filtered-load Back passes. Shallow-created archive Back **fails Q1-01**. |
| SSR / no-JS HTML | Parsed fresh HTTP HTML, no browser JS: default five Project anchors; filtered GET gives three; expanded GET form and noscript nav exist; invalid `view=bogus&tag=999&sort=wat` gives safe five. Native Showreel source/controls are SSR. This is HTML verification, not an emulated JS-disabled device session. |
| 0 / 1 / 5 / 6 Projects | Independent temporary read-only fixture on 4311 plus alternate preview on 4182 (same built app; no rebuild). SSR: 0 honest empty/contact path; 1 and 5 All Projects with no redundant toggle; 6 five highlights with toggle. Browser transition behavior for these small cases not claimed. |
| CMS unavailable | Alternate fixture returns 503: homepage HTTP 200 with honest unavailable copy; Project route **503**; sitemap **503**, not empty-success XML. Caller fixture/preview untouched. |
| 404 | `/project/qa-nonexistent-123`: **404**. |
| Reduced motion | Emulated reduce before fresh load: ready native player **paused**, no autoplay. Intro canvases exist but overlay hidden. Not asserting that merely present canvases imply active rendering. |
| Playback lifecycle | Normal-motion initial reel played automatically; after scrolling offscreen it paused. Explicit user pause + offscreen/back leaves player paused. Source has observer/listener/frame callback teardown. Background-tab and long-running RAF profiling remain unmeasured. |
| Cue seek / boundary | Ready/seek-complete checks at 1s give `Wawe Films Showreel`, at **5s** give `SHOWREEL`, backwards to 1s restores identity. Fixture cue is `[0,5)` and Project has no clients. Real client logo/multi-client/bad-cue/loop browser cases not represented; pure suite supplies some coverage, not device proof. |
| Project media | Puma portrait detail uses native controls, paused, actual **1080×1920**, measured CSS ratio `1080 / 1920`, WebM video source and JPEG poster via safe proxy; no image-as-video source. Showreel detail landscape also loaded. Numeric/image-parts/rich-text attack cases remain pure-test/source coverage rather than a browser matrix. |
| Contact | `/contact?project=puma-spec-ad` safely seeds message; associated Name/Email/Message inputs; Send disabled; honest unavailable/not-sent text with missing configuration. No POST. Provider success/failure and validation were exercised only by existing pure tests in the 56-test run. |
| Metadata / SEO | Fresh HTML for `/`, filtered `/`, invalid query `/`, `/contact`, `/project/puma-spec-ad`: exactly one title, canonical, OG title/URL/image each. Filter variants canonical to homepage. Detail OG is JPEG poster, not film. Sitemap XML parses, **27 URLs** (25 Projects + home/contact). Robots staging: `Disallow: /`, canonical sitemap, `x-robots-tag: noindex, nofollow`. Static share PNG GET/HEAD reachable on preview, 200 `image/png`. Public social-crawler retrieval not claimed. |
| Automated a11y | Fresh axe 4.12.1 home/contact audits **0 violations**. Home incomplete checks: four contrast nodes requiring visual confirmation and captions on reel. Project audit captured separately. Zero violations is not captions/device sign-off. |

## Responsive measurements and artifacts

Measured settled homepage DOM with reduced motion, viewport height 900. No horizontal overflow at tested sizes:

| Width | document/body scrollWidth | Grid | Hero height / bar bottom |
|---|---|---|---|
| 320 | 320 / 320 | 1 column | 157.50 / 237.50px |
| 390 | 390 / 390 | 1 column | 196.55 / 276.55px |
| 768 | 768 / 768 | 2 columns | 387.06 / 467.06px |
| 1920 | 1920 / 1920 | 3 columns | 756 / 884px |

Video `object-fit: contain` throughout. Expanded archive at 390×844 also scrollWidth 390, one column, one video; portrait detail likewise 390 without overflow. Screenshots: `/tmp/wawe-qa-{320,390,768,1440,1920}.png`. These are Chromium viewport checks, not physical touch/Safari proof.

Additional evidence: `/tmp/wawe-qa-html-results.txt`, `/tmp/wawe-qa-sitemap.xml`, `/tmp/wawe-qa-{home,contact,project}-axe.json`, `/tmp/wawe-qa-404.html`. Temporary fixture/script: `/tmp/wawe-qa-fixture.mjs`, `/tmp/wawe-qa-html.py`; alternate preview logs `/tmp/wawe-qa-preview.log`.

## Performance limitations / remaining sign-off

`agent-browser vitals` returned TTFB **55.4ms**, CLS **0**, but **null LCP/FCP/INP**, reused browser, with reduced motion; this is **not a realistic cold-load performance pass**. A later buffered observer likewise had no LCP/paint entries and cached resource transfer zeros. Do not turn those missing observations into guessed vitals or transfer budgets. Fixture-local CMS latency, real remote media/proxy cache, reuse, and automation timing limit the result. Evidence: `/tmp/wawe-qa-vitals.json`.

Still outstanding: Q1-01 fix + confirming browser regression; real production Showreel/cue/client configuration and content cleanup; contact/spam/email configuration plus authorized mocked integration coverage; captions/audio review; actual iPhone Safari / Android devices; cold cache/network-throttled LCP/INP/CLS/transfer; complete keyboard and focus-disappearing-controls cases; browser stress cases (rapid toggle, resize during expansion, failed media, cue overlaps/multi-client and image/video parts). This report does not authorize deployment.
