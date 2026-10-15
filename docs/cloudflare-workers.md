# Cloudflare Workers — GitHub integration

This site targets **Workers with Static Assets**, not Pages and not the deprecated Workers Sites adapter. Configuration is in `wrangler.jsonc`; SvelteKit uses `@sveltejs/adapter-cloudflare` 7.x because this project is on SvelteKit 2 (adapter 8 requires SvelteKit 3).

## Before connecting GitHub

- Review and approve the release files, then commit/push them yourself or explicitly authorize the agent. Nothing in this preparation commits, pushes or deploys.
- This repository currently has no Git remote. Cloudflare cannot read local/untracked changes; it builds the selected GitHub branch.
- Include `src/lib/landing/` and its assets/license, `src/lib/server/cms-fetch.ts`, `src/routes/api/landing-media/`, `static/fonts/`, modified site files, lockfile, `.node-version`, `pnpm-workspace.yaml`, `wrangler.jsonc` and release documentation. Review the mixed dirty workspace; do not blindly add everything.
- Never upload `.env`, `.dev.vars`, API keys, `node_modules`, `.svelte-kit` or `.wrangler`. Only public origin configuration is in Wrangler.
- First deploy to the Workers URL, without a production custom domain. A successful initial deployment is a staging test, not launch approval. Protect staging with Cloudflare Access or another explicit no-index policy before sharing it publicly; current robots defaults allow crawling.

## Workers Builds settings

Create/connect a Worker named **`wawe-site-svjs`** (must match `wrangler.jsonc`; change both names if desired), and connect the GitHub repository and intended branch.

| Setting | Value |
| --- | --- |
| Root directory | `/` when uploading this site as its own repository; `wawe-site-svjs` only if the GitHub repository actually contains that parent folder |
| Build command | `pnpm install --frozen-lockfile && pnpm run build:workers` |
| Deploy command | `pnpm exec wrangler deploy` |
| Node | `.node-version` pins `24.20.0`; optionally set build variable `NODE_VERSION=24.20.0` |
| pnpm | Set build variable `PNPM_VERSION=10.34.6`; matches `packageManager` |
| Dependency install | Set build variable `SKIP_DEPENDENCY_INSTALL=1`; the build command performs the frozen install |

There is no Pages “build output directory” setting to configure. Wrangler uploads the Worker entry `.svelte-kit/cloudflare/_worker.js` and static assets from `.svelte-kit/cloudflare`.

The build command gates deployment on type checks, six landing tests and the Cloudflare production build. Preview branch builds may use Cloudflare's default preview command; do not replace it with a production deploy command.

**Connecting GitHub/enabling builds may trigger an immediate deployment.** Configure variables and choose the branch deliberately; subsequent pushes to the connected deployment branch deploy automatically.

## Runtime variables and secrets

Build variables are **not** runtime variables. Configure the following in the Worker's **Settings → Variables & Secrets**, not only in Build settings:

- Public origins are versioned in Wrangler: `PAYLOAD_API_URL=https://cms.wawefilms.com`, `R2_PUBLIC_URL=https://media.wawefilms.com`, `PUBLIC_SITE_URL=https://wawefilms.com`.
- `PUBLIC_SITE_URL` is currently informational: metadata/canonical URLs do not automatically follow it.
- Contact configuration: `TURNSTILE_SITE_KEY`, `TURNSTILE_HOSTNAMES`, `RESEND_EMAIL_SENDER`, `RESEND_EMAIL_RECEIVER`.
- Encrypted secrets: `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`.
- Turnstile must allow the hostname being tested (Workers URL first, then the real domain). Confirm your Resend sender domain is verified.

`keep_vars: true` preserves dashboard-managed text variables during Wrangler deployment; values declared in Wrangler remain source-controlled. Secrets never belong in Wrangler or Git.

**Contact-form launch blocker:** current server code skips Turnstile verification when its secret is missing and reports success without sending email when Resend configuration is missing. Do not treat an unconfigured contact form as working. It also logs submitted contact data in that fallback path. Configure and verify it before public launch; fail-closed/PII-safe hardening remains a separate follow-up. The current action verifies Turnstile `success`, not the returned hostname.

## Local validation (does not deploy)

```sh
pnpm install --frozen-lockfile
pnpm run build:workers
pnpm run check:workers # wrangler deploy --dry-run; no upload
pnpm run preview:workers # local Workers runtime, not Vite preview
```

Wrangler may read `.env`/`.dev.vars` for local testing. Never print those files. To test only public configuration, supply `--env-file` pointing to a temporary file containing only the public origins above. Do not test successful email sends without approval.

Verify homepage SSR, fonts, Project detail pages, contact validation, proxy rejection, upstream HEAD/Range requests and video seeking. Repeat on the actual host: local workerd cannot prove Cloudflare edge/CDN behavior, request cancellation or video costs. Confirm provider limits and avoid buffering video bodies.

## Before production domain cutover

Complete `docs/production-readiness.md`: final Showreel/content/rights, real Safari/iPhone and Android, accessibility and performance, remaining routes/contact, SEO, security headers, monitoring and rollback. No production custom domain/routes are configured here. Record the previous good Worker version before promotion.

## Primary references

- [Cloudflare SvelteKit Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/)
- [SvelteKit Cloudflare adapter](https://svelte.dev/docs/kit/adapter-cloudflare)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers build image and version overrides](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
