import type { Media, Project } from '$lib/payload-types';

// The same fixed origins as the CMS/R2 deployment; never forward arbitrary hosts.
export const MEDIA_ORIGIN = 'https://media.wawefilms.com';
export const CMS_ORIGIN = 'https://cms.wawefilms.com';
export const PLACEHOLDER_SHOWREEL = '/showreel-mock.webm';

export function allowedUpstream(value: string): URL | null {
	try {
		if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(value) || /[\x00-\x1f]/.test(value) || /%(?:2f|5c|2e|25)/i.test(value) || value.includes('\\')) return null;
		const url = new URL(value);
		if (url.username || url.password || url.search || url.hash) return null;
		const prefix = url.origin === MEDIA_ORIGIN ? '/media/' : url.origin === CMS_ORIGIN ? '/api/media/file/' : null;
		if (!prefix || !url.pathname.startsWith(prefix)) return null;
		const file = decodeURIComponent(url.pathname.slice(prefix.length));
		if (!file || file.includes('/') || file.includes('\\') || /[\x00-\x1f]/.test(file) || file === '.' || file === '..') return null;
		if (!/\.(webm|mp4|mov|m4v|webp|png|jpe?g|avif)$/i.test(file)) return null;
		return url;
	} catch { return null; }
}

export function sourceURL(value: unknown): string | null {
	if (value === PLACEHOLDER_SHOWREEL) return PLACEHOLDER_SHOWREEL;
	if (typeof value !== 'string' || !value) return null;
	const absolute = value.startsWith('/api/media/file/') ? CMS_ORIGIN + value : value;
	const upstream = allowedUpstream(absolute);
	return upstream ? `/api/landing-media?src=${encodeURIComponent(upstream.href)}` : null;
}

const media = (value: unknown): Media | null => value && typeof value === 'object' ? value as Media : null;
export function projectSources(project: Project): string[] {
	const base = media(project.video);
	return [...new Set([media(base?.smallFile), base].flatMap(asset => {
		const url = sourceURL(asset?.url);
		return url && (!asset?.mimeType || asset.mimeType.startsWith('video/')) ? [url] : [];
	}))];
}
export function showreelSource(showreel: { videoUrl?: string | null } | null) {
	const value = showreel?.videoUrl;
	const cms = typeof value === 'string' && /\.(webm|mp4|mov|m4v)$/i.test(value) ? sourceURL(value) : null;
	return { url: cms ?? PLACEHOLDER_SHOWREEL, placeholder: !cms || cms === PLACEHOLDER_SHOWREEL };
}
