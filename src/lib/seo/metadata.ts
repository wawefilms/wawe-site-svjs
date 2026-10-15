import type { ProjectSummary } from '../projects/model.ts';
import type { MediaRelationship } from '../media/normalize.ts';
import { allowedUpstream, CMS_ORIGIN } from '../landing/sources.ts';

export interface SiteEnvironment { PUBLIC_SITE_URL?: string; PUBLIC_SITE_INDEXING?: string }
export interface SeoOptions { indexing?: 'index' | 'noindex' }
export interface ShareImage { url: string; alt: string; width?: number; height?: number; type: string }
export interface RouteMetadata {
	title: string; description: string; canonical: string; siteName: string;
	type: 'website' | 'article'; image: ShareImage; robots: string;
	jsonLd: Record<string, unknown>[];
}

/** Explicit configuration only: never infer a canonical from the request Host header. */
export function siteConfiguration(env: SiteEnvironment): { siteURL: string; indexing: 'index' | 'noindex' } {
	const siteURL = validateSiteURL(env.PUBLIC_SITE_URL);
	if (env.PUBLIC_SITE_INDEXING !== 'index' && env.PUBLIC_SITE_INDEXING !== 'noindex') {
		throw new Error('PUBLIC_SITE_INDEXING must explicitly be index or noindex');
	}
	return { siteURL, indexing: env.PUBLIC_SITE_INDEXING };
}

export function validateSiteURL(value: string | undefined): string {
	if (!value || value !== value.trim()) throw new Error('PUBLIC_SITE_URL must be an explicit HTTPS origin');
	const url = new URL(value);
	const host = url.hostname.toLowerCase();
	if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/' ||
		!host.includes('.') || host.endsWith('.') || host.endsWith('.localhost') || host.endsWith('.local') ||
		host.endsWith('.test') || host.endsWith('.invalid') || /^[\d.]+$/.test(host) || host.includes(':')) {
		throw new Error('PUBLIC_SITE_URL must be a public HTTPS origin, without path or credentials');
	}
	return url.origin;
}

export function routeURL(siteURL: string, route: 'home' | 'contact' | 'project', slug?: string): string {
	const origin = validateSiteURL(siteURL);
	if (route === 'project' && (!slug || slug === '.' || slug === '..')) throw new Error('A real Project slug is required');
	return origin + (route === 'home' ? '/' : route === 'contact' ? '/contact' : `/project/${encodeURIComponent(slug!).replace(/'/g, '%27')}`);
}

export function fallbackImage(siteURL: string): ShareImage {
	return { url: validateSiteURL(siteURL) + '/og/wawe-films.png', alt: 'WAWE Films badge', width: 1200, height: 630, type: 'image/png' };
}

/** MIME and extension must agree; only the existing public CMS/R2 allowlist is trusted. */
export function posterShareImage(poster: MediaRelationship, title: string): ShareImage | null {
	if (!poster || typeof poster !== 'object') return null;
	const type = poster.mimeType?.split(';')[0].trim().toLowerCase();
	const extensions: Record<string, RegExp> = {
		'image/png': /\.png$/i, 'image/jpeg': /\.jpe?g$/i, 'image/webp': /\.webp$/i, 'image/avif': /\.avif$/i
	};
	if (!type || !extensions[type] || !poster.url) return null;
	const upstream = allowedUpstream(poster.url.startsWith('/api/media/file/') ? CMS_ORIGIN + poster.url : poster.url);
	if (!upstream || !extensions[type].test(upstream.pathname)) return null;
	const positive = (n: number | null | undefined) => typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : undefined;
	return { url: upstream.href, alt: poster.alt?.trim() || `${title} — Poster Image`, type,
		width: positive(poster.width), height: positive(poster.height) };
}

function base(title: string, description: string, canonical: string, image: ShareImage, options: SeoOptions): RouteMetadata {
	return { title, description, canonical, image, siteName: 'WAWE Films', type: 'website',
		robots: options.indexing === 'index' ? 'index, follow' : 'noindex, nofollow', jsonLd: [] };
}

export function organizationSchema(siteURL: string): Record<string, unknown> {
	const url = routeURL(siteURL, 'home');
	return { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${url}#organization`, name: 'WAWE Films', url };
}

export function homeMetadata(projects: readonly ProjectSummary[], siteURL: string, options: SeoOptions = {}): RouteMetadata {
	const meta = base('WAWE Films — Projects & Showreel', 'Watch the WAWE Films showreel, explore our Projects and get in touch.', routeURL(siteURL, 'home'), fallbackImage(siteURL), options);
	meta.jsonLd = [organizationSchema(siteURL), { '@context': 'https://schema.org', '@type': 'ItemList',
		itemListElement: projects.map((project, i) => ({ '@type': 'ListItem', position: i + 1, name: project.title, url: routeURL(siteURL, 'project', project.slug) })) }];
	return meta;
}

export function projectMetadata(project: ProjectSummary, siteURL: string, options: SeoOptions = {}): RouteMetadata {
	const meta = base(`${project.title} — WAWE Films`, project.shortDesc?.trim() || `Watch ${project.title}, a Project by WAWE Films.`, routeURL(siteURL, 'project', project.slug), posterShareImage(project.poster, project.title) ?? fallbackImage(siteURL), options);
	meta.type = 'article';
	meta.jsonLd = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
		{ '@type': 'ListItem', position: 1, name: 'WAWE Films', item: routeURL(siteURL, 'home') },
		{ '@type': 'ListItem', position: 2, name: project.title, item: meta.canonical }
	] }];
	// Project.createdAt is a CMS record date, not a verified film upload date: omit VideoObject.
	return meta;
}

export function contactMetadata(siteURL: string, options: SeoOptions = {}): RouteMetadata {
	return base('Contact — WAWE Films', 'Get in touch with WAWE Films about your Project.', routeURL(siteURL, 'contact'), fallbackImage(siteURL), options);
}

export function serializeJsonLd(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
