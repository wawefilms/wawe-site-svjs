# WAWE Films — SvelteKit site

Svelte 5 / SvelteKit 2 portfolio backed by Payload CMS. The homepage includes the accepted opening, surge, recede and liquid perspective-stack experience; Projects, filtering and client content remain part of the site.

## Local development

```sh
pnpm install --frozen-lockfile
cp .env.example .env # only if you do not already have local configuration
pnpm dev
```

Set `PAYLOAD_API_URL` to your CMS and `R2_PUBLIC_URL` to its trusted public media origin. For the public CMS these are `https://cms.wawefilms.com` and `https://media.wawefilms.com`. Do not commit secrets or overwrite an existing `.env`.

Node is pinned to `24.20.0` in `.node-version`; pnpm is pinned to `10.34.6` in `package.json`.

## Homepage package

- `src/lib/landing/`: production-owned browser rendering, motion, media loading, approved opening settings and bundled assets/attribution. No production imports from the prototype folders.
- `src/routes/+page.svelte`: homepage integration alongside the existing Project filters/grid and client content.
- `src/routes/+page.server.ts`: server-loaded Payload content. The Showreel remains independent from Project ordering.
- `src/routes/api/landing-media/+server.ts`: allowlisted, same-origin streaming media delivery for the landing canvas/WebGL. Trusted origins and paths are defined in `src/lib/landing/sources.ts`; this is not an arbitrary URL proxy.
- `prototypes/ascii-stacking/`: retained comparison/tuning study, not a production entry point.

**Development controls only:** bottom padding, spread speed and replay. Production uses the accepted defaults and does not expose the study panel. Bottom padding defaults to matching the side gutter. Rightward spreading defaults to 0.75 seconds; initial stacking speed is independent.

The local `/showreel-mock.webm` is placeholder fallback content. Confirm the final CMS Showreel and media/font rights before launch.

## Check and build

```sh
pnpm check
pnpm test:landing
pnpm build
pnpm preview
```

The development server is not a production deployment. The site targets Cloudflare Workers with Static Assets using `@sveltejs/adapter-cloudflare` and `wrangler.jsonc`. See **[Workers GitHub setup](docs/cloudflare-workers.md)** for build/deploy settings, runtime secrets and local Workers testing. `pnpm build:workers` runs the release gates; `pnpm check:workers` bundles a dry run without deploying.

## Release

See **[production-readiness checklist](docs/production-readiness.md)** for verification results, environment variables, content/licensing checks, browser/accessibility/performance sign-off, staging and rollback. No deployment is implied by packaging the homepage.

Additional context: [design system](docs/design-system.md), [domain glossary](CONTEXT.md), [stacking study](prototypes/ascii-stacking/README.md).
