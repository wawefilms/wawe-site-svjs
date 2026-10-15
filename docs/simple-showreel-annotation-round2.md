# Annotation round 2 + fullscreen opening

## Implemented in source

- Play triangle geometry now has its area centroid at the SVG/circular button centre (`M8 5 20 12 8 19Z`), correcting the right-heavy optical offset.
- View all / Show five highlights moved into the Projects heading, before filters/cards; desktop separates title/action, mobile wraps above the grid. One toggle and the same keyed grid remain.
- Only `wawe-films-showreel` is excluded from the visible gallery and homepage ItemList. The full catalogue/media remain available for cue resolution. Preview now shows 24 gallery Projects, not 25.
- ASCII intro is a viewport-fixed 100dvh overlay, outside film clipping. Field size comes from that overlay; its reveal paints the actual DOM film rectangle, avoiding a fullscreen-to-contained jump. Original field/motion kernels, glyph/type/palette parameters are unchanged. Skip/reduced-motion/readiness deadlines/disposal/offscreen fail-open remain. The mobile test uses a fresh top-of-page entry; restored archive scroll intentionally skips the opening.
- CMS `Clients.ts` now groups the existing persisted `logo` field under a clear Client logo section. This is a presentational field group, not a new database field/migration. CMS artwork still takes precedence over code fallbacks.
- Prepared real official Outskill and Flow assets alongside Razorpay. Official SVG geometry/alpha are retained in transparent PNGs tinted warm-paper for the dark shell; provenance records source URLs/checksums/process. No reconstructed lettering or AI assets.

## User-supplied timestamps

The HEIC supplied with production authorization matches all 14 rows in the earlier transcription. The explicit import file is now `wawe-payload/docs/showreel-timings-approved.txt` (0–43.680s). All 14 exact slugs resolve uniquely against the current public production catalogue. Read-only local preview now uses this supplied map, **not the earlier synthetic cue windows**. Browser seeking confirms Outskill at 1s, Razorpay at 3s and Flow at 33s.

## Verified

- `pnpm build:workers`: **62 tests passed**, check **0 errors / 13 existing unused Intro warnings**, build passes.
- Expanded browser regression passes: active opening covers the viewport with one player; heading-level toggle, no montage card, full video ratio/equal gutters, tap/mute/Menu/Escape focus, same-key expansion and Project → browser Back. `BROWSER_TEST_APPROVED_CUES=1` verifies all three logos against the supplied timeline.
- Desktop 1512×815 and mobile 390×844 opening/heading captures inspected. Mobile overlay bounds exactly 0,0 / 390×844. First mobile capture attempt restored archive scroll and correctly skipped the intro; fresh-entry confirmation passes.
- CMS TypeScript, scoped ESLint/Prettier and both repositories' whitespace checks pass. Logo field's persisted shape stays unchanged. Raster provenance scan: **5 / 0 missing**.

## Local-first CMS verification (latest instruction)

The later instruction, “let’s do it locally first, then I git push to prod,” supersedes the earlier production execution plan. **No production login, mutation, deployment, commit or push was performed.**

- Isolated actual Payload CMS: `http://127.0.0.1:4320/admin`, SQLite/uploads under `/tmp/wawe-local-review-confirm/`. All five R2 variables are explicitly empty, with configuration guards preventing accidental remote storage or use of the normal database. Published films/posters are referenced read-only; uploads remain on scratch disk.
- Seeded the public catalogue with remapped relationships. Uploaded/linked all three official logos; saved the independent Showreel with the supplied 14 cues; verified it before deleting only the local montage Project. Final counts: **24 Projects / 3 Clients / 82 Media**. Movie/poster Media are retained.
- Authenticated normally as a generated local-only admin. Re-imported, applied, saved and reloaded the approved timeline through the actual admin UI. Readback is 0–43.680s with 14 valid Project references. SQLite REAL decoding exposed float32 noise; a millisecond afterRead hook now keeps editor/API values accurate without changing the stored schema.
- Client artwork is now a bounded same-origin raster endpoint keyed by verified client ID, not a URL supplied by the viewer. It supports approved published media or the configured CMS file endpoint, refuses redirects, checks MIME and caps bodies at 2 MiB. All three responses match the actual CMS-uploaded files byte-for-byte; browser tests require these CMS endpoints, not static fallbacks. The existing film/media origin policy stays unchanged.
- Latest gates: **66 site tests**, **25 scoped CMS tests**, site check **0 errors / 13 retained Intro warnings**, CMS TypeScript/scoped lint, Cloudflare build and desktop/mobile browser regressions pass.

Preview: `http://127.0.0.1:4185/`, now connected to the actual isolated CMS rather than the read-only fixture. Restart, evidence and the separate post-push content procedure are documented in [the local CMS handoff](../../wawe-payload/docs/local-showreel-review.md).

**Git push deploys source, not local SQLite records or uploaded files.** Production content needs a separately authorized admin/import step after deployment. Save/verify the independent Showreel before removing the production montage Project; retain its Media. Earlier release/device/caption/provider/content obligations and bounded reviewer verdict remain open.
