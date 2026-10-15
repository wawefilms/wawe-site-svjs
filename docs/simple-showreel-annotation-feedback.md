# Showreel annotation follow-up

User's three annotations were submitted through Plannotator v0.28.19 against an HTML copy of the preview.

## Applied

1. **Centred, uncropped film; no native play bar:** removed the viewport-height cap that narrowed the aspect-ratio wrapper against the full container. The film now fills equal-gutter width and adopts decoded dimensions. The native video remains the playback engine; hydration replaces its bar with a semantic full-film play/pause button and a 44px bottom-right mute button. Space/Enter work; Left/Right seek ten seconds. Safe supplied captions have a language/off selector. SSR/no-JS keeps native controls. Intro skipping now focuses the play button; wave calculations are unchanged.
2. **Real, cue-matched client logo:** fetched Razorpay's official white asset from its newsroom brand-assets page. Original pixels/colours retained; embedded provenance and sidecar under `static/clients/`. Valid CMS artwork takes precedence; exact verified Razorpay client relationships have this fallback. Removed the pale backing/padding so the mark sits directly on the identity bar like the reference. Unknown clients/relationships and cue gaps never acquire a logo by guesswork.
3. **Menu not opening:** reproduced the inert HTML-copy environment, then verified the actual running Svelte Menu opens, reveals links, closes with Escape and restores trigger focus. No Menu source workaround was needed. Further feedback uses Plannotator's **live-app mode**, not the unhydrated HTML copy. Press Escape in Plannotator to interact rather than annotate.

## Evidence and boundaries

- `pnpm build:workers`: 61 tests pass, check has 0 errors / the same 13 retained unused Intro warnings, build passes.
- Browser regression checks equal gutters/full wrapper width/decoded ratio/no crop/no overflow at 390 and 1512px, tap playback/mute, actual Menu/escape focus, keyed expansion and Project → browser Back restoration.
- Optional fixture logo checks: `BROWSER_TEST_URL=http://127.0.0.1:4185 BROWSER_TEST_RAZORPAY_TIME=1 BROWSER_TEST_CUE_GAP_TIME=12 pnpm test:browser`.
- Desktop/mobile captures inspected in one bounded round. Official Razorpay logo loads at a synthetic test cue and clears in the gap. Provenance scan: 3 rasters / 0 missing.
- The local read-only fixture now has a **synthetic** Culture Circle (verified Razorpay relationship) window at 0–5s, then the reel Project at 5–10s. These windows exercise identity changes only; they are **not approved editorial timing or a claim that this montage segment belongs to that Project**. Production Showreel/cues still need owner supply/authorization; no real CMS record was changed.
- Original release blockers and bounded-review scope remain unchanged. This follow-up is implementation/test evidence, not new full-surface or release approval. No commit, deployment, real email or CMS write.
