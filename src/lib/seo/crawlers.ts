import type { ProjectSummary } from '../projects/model.ts';
import { routeURL, siteConfiguration, type SiteEnvironment } from './metadata.ts';

type Catalogue = { projects: readonly ProjectSummary[]; unavailable: boolean };
export function escapeXML(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function lastmod(value: string): string | null {
	// Only an actual ISO calendar date/timestamp; never coerce arbitrary numbers/text.
	if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return null;
	const time = Date.parse(value);
	if (!Number.isFinite(time) || new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
	return new Date(time).toISOString();
}
export function sitemapXML(projects: readonly ProjectSummary[], siteURL: string): string {
	const urls = [routeURL(siteURL, 'home'), routeURL(siteURL, 'contact')].map(url => `<url><loc>${escapeXML(url)}</loc></url>`);
	const seen = new Set<string>();
	for (const project of projects) {
		const url = routeURL(siteURL, 'project', project.slug);
		if (seen.has(url)) continue;
		seen.add(url);
		const date = lastmod(project.updatedAt);
		urls.push(`<url><loc>${escapeXML(url)}</loc>${date ? `<lastmod>${escapeXML(date)}</lastmod>` : ''}</url>`);
	}
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}
export async function sitemapResponse(env: SiteEnvironment, getCatalogue: () => Promise<Catalogue>): Promise<Response> {
	try {
		const { siteURL, indexing } = siteConfiguration(env);
		const catalogue = await getCatalogue();
		if (catalogue.unavailable) throw new Error('Catalogue unavailable');
		return new Response(sitemapXML(catalogue.projects, siteURL), { headers: {
			'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300',
			...(indexing === 'noindex' ? { 'X-Robots-Tag': 'noindex, nofollow' } : {})
		} });
	} catch {
		return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' } });
	}
}
export function robotsResponse(env: SiteEnvironment): Response {
	try {
		const { siteURL, indexing } = siteConfiguration(env);
		return new Response(`User-agent: *\n${indexing === 'index' ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${siteURL}/sitemap.xml\n`, {
			headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300',
				...(indexing === 'noindex' ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}) }
		});
	} catch {
		return new Response('User-agent: *\nDisallow: /\n', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '300' } });
	}
}
