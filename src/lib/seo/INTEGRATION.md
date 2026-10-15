# Packet E integration

Owned changes: `metadata.ts`, `crawlers.ts`, `seo.test.ts`, `components/Seo.svelte`, `routes/sitemap.xml/+server.ts`, `routes/robots.txt/+server.ts`, `static/og/wawe-films.png` and its JSON provenance. Removed `static/robots.txt`; do not restore a competing static response.

## Required runtime public configuration

```dotenv
PUBLIC_SITE_URL=https://wawefilms.com
PUBLIC_SITE_INDEXING=index
```

Staging must explicitly use its public HTTPS origin and `PUBLIC_SITE_INDEXING=noindex`. Missing/invalid indexing or origin fails validation; crawler routes return retryable 503 (robots additionally disallows everything). No localhost or request-derived canonical, HTTP, credentials, ports, paths, queries or fragments. Factories default to noindex when no options are passed, avoiding accidental indexing.

## Exact exports (`$lib/seo/metadata`)

- `siteConfiguration(env: SiteEnvironment): { siteURL: string; indexing: 'index' | 'noindex' }`
- `homeMetadata(projects: readonly ProjectSummary[], siteURL: string, options?: SeoOptions): RouteMetadata`
- `projectMetadata(project: ProjectSummary, siteURL: string, options?: SeoOptions): RouteMetadata`
- `contactMetadata(siteURL: string, options?: SeoOptions): RouteMetadata`
- Supporting exports: `validateSiteURL`, `routeURL`, `fallbackImage`, `posterShareImage`, `organizationSchema`, `serializeJsonLd` and types `SiteEnvironment`, `SeoOptions`, `ShareImage`, `RouteMetadata`.

`ProjectSummary` is the existing structural Payload subset in `$lib/projects/model`; populated `poster` Media is used only with an approved raster MIME + matching extension + existing public CMS/R2 origin policy. Direct upstream URL is intentional, not the playback proxy. Missing/unpopulated/unsafe poster uses the real 1200×630 WAWE badge PNG. Poster dimensions are emitted only when factual positive integers. VideoObject is intentionally omitted: CMS record createdAt is not evidence of film uploadDate.

## Coordinator wiring (not applied by this worker)

Read `$env/dynamic/public` in server loader(s), validate with `siteConfiguration(env)`, and expose the validated config or computed route metadata through loader data. Do not infer from `event.url.origin`.

```ts
const config = siteConfiguration(env);
const meta = homeMetadata(projects, config.siteURL, config);
// Detail: projectMetadata(project, config.siteURL, config)
// Contact: contactMetadata(config.siteURL, config)
```

Render exactly once per route:

```svelte
<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>
<Seo meta={data.meta} />
```

Remove competing title/description/canonical/OG/Twitter/robots tags from layout and detail heads. Keep unrelated icons/verification tags. The homepage factory already includes Organization plus ItemList; do not add a second Organization in the root. Homepage query/filter variants use the same homepage factory/canonical. Supply the full sorted catalogue, not only the five visible cards.

Sitemap automatically calls shared `getProjectCatalogue(): {projects, unavailable}`; CMS unavailable/throw/malformed slug/config => 503, Retry-After 300 and no-store. Successful empty catalogue still has home/contact. Only validated actual updatedAt dates become lastmod, no invented home/contact dates or browsing query variants. Robots automatically reads the same explicit runtime config and declares that origin's sitemap.

## Tests

```sh
node --experimental-strip-types --test src/lib/seo/seo.test.ts
pnpm check
pnpm build
```

Unit tests include compiled component SSR uniqueness, encoded quoted/slashed slug, poster source/MIME rejection, schemas and safe serialization, XML escaping/date validation, CMS retry responses and staging robots. Coordinator must still test composed route HTML after removing old tags and mount integration; the component test cannot guarantee root/page tag uniqueness before wiring. No external crawlability/deployment claim is made; direct media and share image need deployed social-crawler verification.
