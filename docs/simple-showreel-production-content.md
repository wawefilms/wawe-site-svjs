# Showreel CMS publication — 14 October 2026

## Shipped scope

CMS repository only, `main`:

- `44c0286`: client-logo editor, verified Showreel workflow and isolated review support.
- `50aeac5`: pin pnpm 10.34.6 in `package.json` and the shared Docker base. The unpinned Node 22.17/Corepack build selected pnpm 12 and failed on its absent `bin/pnpm.cjs`. The old-Corepack CLI reproduction fails with pnpm 12 and passes with the pin; fresh frozen install, 26 scoped tests and production Next build pass. Render subsequently reported the service live, and the deployed Showreel API returned 200.

Frontend source, including adaptive fit, has **not** been pushed or deployed.

## Production content verified

Authenticated through the normal CMS admin session. Backed up before modification. No local IDs or scratch database were transferred.

| Client | Production client | Uploaded logo Media |
| --- | ---: | ---: |
| Razorpay | 1 | 80 |
| Outskill | 2 | 81 |
| Wispr Flow | 3 | 82 |

Independent Showreel saved with the 14 approved, uniquely resolved project cues from `wawe-payload/docs/showreel-timings-approved.txt`, spanning 0–43.680s. Readback matched every project ID and millisecond timestamp. Movie **79** and poster **77** retained.

Only after that readback and production-backed playback/logo browser tests passed, deleted Project **42**, slug `wawe-films-showreel`. Verified the remaining project-ID set exactly equals the previous set minus 42. Final state: **24 Projects, 3 Clients with logos, 82 Media, 14 Showreel cues**. Unrelated Projects and original movie/poster Media remain.

## Evidence and review

Private durable backup directory:
`~/Library/Application Support/wawe-backups/cms-showreel-20261014-204021/`

Contains the pre-deploy SQLite restore, pre/post content snapshots, upload/link receipt, applied timeline and saved Showreel readback. Do not commit private operational backups or authentication state.

Current local artifacts supersede vanished `/tmp/wawe-local-review-confirm/` paths in earlier review notes:

- Isolated local CMS: `/tmp/wawe-release/local/`, port 4320.
- Local-only CMS-backed preview: `http://127.0.0.1:4185`.
- **Production-CMS-backed frontend preview:** `http://127.0.0.1:4186`.
- Final browser log: `/tmp/wawe-release/prod-backed-browser-final.log`.

Both pre/post deletion browser runs passed fullscreen ASCII intro, playback/mute, all three timeline-driven official logos, Menu, keyed archive expansion and archive → Project → Back restoration. They tested local frontend code against the real production CMS, not a deployed frontend.

Adaptive desktop layout preserves decoded aspect ratio while reserving navigation and an explicit bottom gap. At 1512×864, opening bottom measured 863.984px and breathing room 32px. Mobile stays width-first. Existing fullscreen ASCII calculations remain unchanged.

Site gates: 66 unit tests; Svelte check 0 errors/13 retained warnings; Cloudflare build; desktop/mobile browser checks. CMS: 26 scoped tests, fresh pinned-version frozen install and production build. CMS worktree clean after publication.

## Still outside acceptance

Frontend deployment authorization, physical Safari/Android checks, approved captions/factual copy/trademark sign-off, live contact-provider configuration and hosted frontend crawler/performance acceptance remain separate release work. No QA email sent. Implementation and CMS publication do not constitute full-site release approval.
