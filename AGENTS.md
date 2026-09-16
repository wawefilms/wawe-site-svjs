# AGENTS — wawe-site-svjs

SvelteKit 2 + Svelte 5 (runes) + Tailwind 4 + pnpm.
Consumes `wawe-payload` (Payload 3 + SQLite/R2) REST. Site lives at `https://wawefilms.com`.

## Commands

| Where | Command | Purpose |
|---|---|---|
| `wawe-payload/` | `pnpm dev` | Payload admin at `:3000/admin` + REST at `:3000/api` |
| `wawe-payload/` | `pnpm migrate` | Apply drizzle migrations |
| `wawe-payload/` | `pnpm generate:types` | Regen `src/payload-types.ts` after collections change — **copy result to `wawe-site-svjs/src/lib/payload-types.ts`** |
| `wawe-site-svjs/` | `pnpm dev -- --port 5173` | SvelteKit dev server |
| `wawe-site-svjs/` | `pnpm check` (`svelte-check --threshold error`) | Type/template gate — must pass every phase |
| `wawe-site-svjs/` | `pnpm build` | Production build gate |
| `wawe-payload/scripts/` | `node scripts/backfill-dimensions.mjs` | One-off: probe R2 video URLs with ffprobe and backfill `media.width/height` |

## Env

`.env` (wawe-site-svjs): `PAYLOAD_API_URL` (default `http://localhost:3000`), `PUBLIC_SITE_URL=https://wawefilms.com`.
Server-only (read via `$env/dynamic/private`): `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_HOSTNAMES`, `RESEND_API_KEY`, `RESEND_EMAIL_SENDER`, `RESEND_EMAIL_RECEIVER`.

## Layout

- Root layout fixes nav + flexbox pins footer (playbook §3 — no sticky footer tricks).
- `min-h-svh`, safe-area footer padding, `nav-theme` context, view transitions via `onNavigate`.

## Search

- **Never** use grep/rg in pi sessions — use `fffind`/`ffgrep` (pi-fff, `pi install npm:@ff-labs/pi-fff` already applied globally).
- Dimension backfill: `scripts/backfill-dimensions.mjs` probes `R2_PUBLIC_URL/media/<filename>` over HTTP.

## Recent changes

- **2026-08-27** — `wawe-payload` rename `videos` → `projects` (migration `20260827_133000_rename_videos_to_projects`, regenerated types, purge hook now `wawefilms.com/project/{slug}` + `/`).
- **2026-08-27** — `wawe-site-svjs` Tailwind 4 wired (`@tailwindcss/vite`, `src/app.css`).
- **2026-08-27** — Backfilled 41/41 media dimensions via ffprobe over R2 (rerunnable on prod via `DATABASE_URL`).
- **2026-08-27** — Resynced prod DB via Litestream (`db:pull` restore) — 20 projects live.
- **2026-09-11** — `wawe-site-svjs` became its own git repo (was unversioned). Moved `docs/` and `CONTEXT.md` in from the parent dir; prototypes now live in `prototypes/`.
- **2026-09-11** — Brand palette 02-COLOUR adopted as `@theme` tokens with WCAG companions (ADR-0003). `wash-ink`/`riso-ember` exist because `wash`@4.25 and `riso`@2.9 fail AA on cream.
- **2026-09-11** — Type: Pangram Sans Rounded (trial, licence pending) + Archivo SemiCondensed (`font-stretch: 87.5%`, class `.stretch-semi`).
- **2026-09-11** — Intro/showreel co-architecture prototyped: `prototypes/prototype-intro-wave.html`, `prototype-goo.html`, `prototype-showreel.html` (real R2 footage). See `docs/handoff-intro-showreel.md`.
