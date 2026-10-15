# Simplified Showreel — bounded Q1-01 verification

## Verdict

**Q1-01 resolved for the tested built-preview regression. Overall release acceptance remains incomplete.**

Independently ran:

```sh
BROWSER_TEST_URL=http://127.0.0.1:4184 pnpm test:browser
```

Exit status: **0**. Output:

```text
PASS: keyed expansion and shallow archive → Project → browser Back restoration
```

## Precise scope and evidence

Reviewed `docs/simple-showreel-functional-qa.md`, `src/lib/projects/ProjectBrowser.svelte`, and `scripts/test-simple-showreel-browser.mjs`. Used the existing built preview on port 4184 and unchanged caller-owned read-only fixture on port 4310. No rebuild, source changes, CMS writes, contact POSTs, or emails. The regression script created and closed its isolated browser session; no extra browser QA was performed.

The script fresh-opens `/`, preserves references to the five highlighted card nodes, expands in-page, asserts those keyed nodes remain in the document, selects **Spec Ads** and **Title A–Z**, applies shallow query changes, opens the first Project, and invokes `history.back()`. It then asserts:

- Returned URL exactly matches the pre-navigation filtered URL.
- Ordered card IDs exactly match the pre-navigation filtered archive.
- Heading is **All Projects**.
- Selected Tag and sort remain the applied Tag and `title`.

All assertions passed. The prior original-build red result supplied for this verification was highlights `[1,42,41,40,39]` instead of filtered `[38,39,40]`. This fresh run confirms ordered-ID equality, but the passing script does not print the actual IDs; no separate ID capture is claimed.

Source review confirms the browser effect tracks `page.url` navigation and parses the actual `location.href`, rather than restoring state solely from potentially cached loader `initialQuery`. That source observation complements, rather than replaces, the built-preview navigation test.

Inspected existing baseline logs (not independently rerun):

- `/tmp/wawe-simple-baseline/final-tests.log`: **60 tests passed, 0 failed**.
- `/tmp/wawe-simple-baseline/final-check.log`: **0 errors, 13 warnings**, all in retained `Intro.svelte`.

## Unchanged gaps

Only Q1-01 was reverified. Q1-02 public placeholder descriptions and every other outstanding sign-off item in the original QA report remain unchanged: production Showreel/cue/client configuration and content cleanup; contact/spam/email configuration and authorized integration coverage; captions/audio review; physical iPhone Safari/Android testing; realistic cold-cache/network-throttled performance and transfer measurements; complete keyboard/focus cases; and browser stress/media/cue/multi-client cases. External social-crawler retrieval remains unverified.

This bounded pass is not a broad QA rerun, device/performance/content sign-off, or deployment authorization.
