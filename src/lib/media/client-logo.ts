import { sourceURL } from '../landing/sources.ts';

/** Raster logos only, on published media or the explicitly configured CMS file endpoint. */
export function clientLogoSource(raw: string, mime: string, cms: string): string | null {
	if (!/^image\/(png|jpeg|webp|avif)$/.test(mime)) return null;
	try {
		const url = new URL(raw), origin = new URL(cms);
		if (url.username || url.password || url.search || url.hash || !/\.(png|jpe?g|webp|avif)$/i.test(url.pathname)) return null;
		if (sourceURL(raw)) return raw;
		const prefix = `${origin.pathname.replace(/\/$/, '')}/api/media/file/`;
		if (url.origin !== origin.origin || !url.pathname.startsWith(prefix)) return null;
		const filename = decodeURIComponent(url.pathname.slice(prefix.length));
		return filename && !filename.includes('/') && !filename.includes('\\') && !filename.includes('..') ? raw : null;
	} catch { return null; }
}
