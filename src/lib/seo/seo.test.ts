import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import type { ProjectSummary } from '../projects/model.ts';
import { homeMetadata, projectMetadata, contactMetadata, siteConfiguration, routeURL, posterShareImage, serializeJsonLd } from './metadata.ts';
import { sitemapXML, sitemapResponse, robotsResponse, escapeXML } from './crawlers.ts';

const origin = 'https://wawefilms.com';
const env = { PUBLIC_SITE_URL: origin, PUBLIC_SITE_INDEXING: 'index' };
const project: ProjectSummary = { id: 1, title: 'A "film" </script>', slug: 'a/"film"', shortDesc: 'Real description', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-02-03T00:00:00Z', video: 1 };

test('explicit public HTTPS origin and indexing configuration', () => {
	assert.deepEqual(siteConfiguration(env), { siteURL: origin, indexing: 'index' });
	for (const url of [undefined, 'http://wawefilms.com', 'https://localhost', 'https://127.0.0.1', 'https://x.localhost', 'https://wawefilms.com/path', 'https://user@wawefilms.com', origin + '?q=x']) {
		assert.throws(() => siteConfiguration({ ...env, PUBLIC_SITE_URL: url }));
	}
	assert.throws(() => siteConfiguration({ PUBLIC_SITE_URL: origin }));
	assert.equal(contactMetadata(origin).robots, 'noindex, nofollow');
	assert.equal(homeMetadata([], origin, { indexing: 'index' }).robots, 'index, follow');
	assert.equal(routeURL(origin, 'project', project.slug), origin + '/project/a%2F%22film%22');
	assert.throws(() => routeURL(origin, 'project', '..'));
});

test('checked-in Cloudflare Worker vars satisfy the SSR site configuration contract', async () => {
	const config = JSON.parse(await readFile(new URL('../../../wrangler.jsonc', import.meta.url), 'utf8'));
	const site = siteConfiguration(config.vars);
	assert.equal(site.siteURL, origin);
	assert.ok(site.indexing === 'index' || site.indexing === 'noindex');
});

test('poster safety: MIME and allowed public upstream, never film as OG', () => {
	const poster = { id: 2, createdAt: project.createdAt, updatedAt: project.updatedAt, url: 'https://media.wawefilms.com/media/still.webp', mimeType: 'image/webp', width: 900, height: 600, alt: 'Actual still' };
	assert.equal(posterShareImage(poster, project.title)?.url, poster.url);
	assert.equal(projectMetadata({ ...project, poster }, origin).image.alt, 'Actual still');
	for (const bad of [
		{ ...poster, mimeType: 'video/mp4' }, { ...poster, mimeType: null },
		{ ...poster, url: 'https://media.wawefilms.com/media/film.mp4' },
		{ ...poster, url: 'https://evil.example/media/still.webp' },
		{ ...poster, url: poster.url + '?token=secret' },
		{ ...poster, url: 'https://media.wawefilms.com/media/../still.webp' }
	]) assert.equal(posterShareImage(bad, 'Film'), null);
	assert.equal(projectMetadata(project, origin).image.url, origin + '/og/wawe-films.png');
	assert.equal(posterShareImage(2, 'Film'), null);
	assert.equal(posterShareImage({ ...poster, url: '/api/media/file/still.webp' }, 'Film')?.url, 'https://cms.wawefilms.com/api/media/file/still.webp');
});

test('truthful schema and safe JSON-LD', () => {
	const home = homeMetadata([project], origin);
	assert.equal(home.jsonLd[0]['@type'], 'Organization');
	assert.equal(home.jsonLd[1]['@type'], 'ItemList');
	const detail = projectMetadata(project, origin);
	assert.equal(detail.jsonLd[0]['@type'], 'BreadcrumbList');
	assert.ok(!serializeJsonLd(detail.jsonLd).includes('<'));
	assert.deepEqual(JSON.parse(serializeJsonLd(detail.jsonLd)), detail.jsonLd);
	assert.ok(!serializeJsonLd(detail.jsonLd).includes('VideoObject'));
	assert.equal(detail.description, project.shortDesc);
});

test('sitemap XML, valid timestamps, no variants, failures retry instead of empty success', async () => {
	const xml = sitemapXML([project, { ...project, id: 2, slug: 'another', updatedAt: '2025-02-31' }], origin);
	assert.ok(xml.includes('/project/a%2F%22film%22'));
	assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1);
	assert.ok(xml.includes('2025-02-03T00:00:00.000Z'));
	assert.ok([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].every(match => !match[1].includes('?')));
	assert.equal(escapeXML('"<&\'>'), '&quot;&lt;&amp;&apos;&gt;');
	assert.equal((await sitemapResponse(env, async () => ({ projects: [], unavailable: false }))).status, 200);
	for (const load of [async () => ({ projects: [], unavailable: true }), async () => { throw new Error('CMS offline'); }]) {
		const response = await sitemapResponse(env, load);
		assert.equal(response.status, 503);
		assert.equal(response.headers.get('Retry-After'), '300');
		assert.ok(!(await response.text()).includes('urlset'));
	}
	assert.equal((await sitemapResponse({}, async () => ({ projects: [], unavailable: false }))).status, 503);
});

test('robots environment controls crawling and canonical sitemap origin', async () => {
	assert.equal(await robotsResponse(env).text(), 'User-agent: *\nAllow: /\nSitemap: https://wawefilms.com/sitemap.xml\n');
	const staging = robotsResponse({ PUBLIC_SITE_URL: 'https://staging.wawefilms.com', PUBLIC_SITE_INDEXING: 'noindex' });
	assert.ok((await staging.text()).includes('Disallow: /'));
	assert.equal(staging.headers.get('X-Robots-Tag'), 'noindex, nofollow');
	assert.equal(robotsResponse({}).status, 503);
});

test('Seo SSR emits one canonical/OG field, Twitter and escaped JSON-LD per route', async () => {
	const source = await readFile(new URL('../components/Seo.svelte', import.meta.url), 'utf8');
	const result = compile(source.replace("'$lib/seo/metadata'", "'../src/lib/seo/metadata.ts'"), { generate: 'server', filename: 'Seo.svelte' });
	const file = new URL('../../../.svelte-kit/seo-test-component.mjs', import.meta.url);
	await writeFile(file, result.js.code);
	try {
		const { default: Seo } = await import(file.href);
		for (const meta of [homeMetadata([project], origin), projectMetadata(project, origin), contactMetadata(origin)]) {
			const { head } = render(Seo, { props: { meta } });
			for (const field of ['og:url', 'og:title', 'og:image', 'og:image:alt', 'og:image:type']) {
				assert.equal((head.match(new RegExp(`property="${field}"`, 'g')) ?? []).length, 1);
			}
			assert.equal((head.match(/rel="canonical"/g) ?? []).length, 1);
			assert.ok(head.includes('name="twitter:card" content="summary_large_image"'));
			assert.ok(!head.includes('content="https://media.wawefilms.com/media/film.mp4"'));
			assert.equal((head.match(/<script type="application\/ld\+json">/g) ?? []).length, meta.jsonLd.length);
			assert.equal((head.match(/<title>/g) ?? []).length, 1);
			for (const match of head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
				assert.doesNotThrow(() => JSON.parse(match[1]));
				assert.ok(!match[1].includes('<'));
			}
		}
	} finally { await unlink(file); }
});
