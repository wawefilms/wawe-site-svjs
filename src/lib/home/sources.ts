import { allowedUpstream, PLACEHOLDER_SHOWREEL, sourceURL } from '../landing/sources.ts';

/** Accept raw CMS URLs and already-normalized URLs, without widening the allowlist. */
export function heroSource(value: unknown, kind: 'video' | 'image'): string | null {
	if (kind === 'video' && value === PLACEHOLDER_SHOWREEL) return PLACEHOLDER_SHOWREEL;
	if (typeof value !== 'string') return null;
	let raw = value;
	if (value.startsWith('/api/landing-media?')) {
		const url = new URL(value, 'https://wawefilms.com');
		if (url.hash || [...url.searchParams.keys()].length !== 1) return null;
		raw = url.searchParams.get('src') ?? '';
		if (!allowedUpstream(raw)) return null;
	}
	const pattern = kind === 'video' ? /\.(webm|mp4|mov|m4v)$/i : /\.(webp|png|jpe?g|avif)$/i;
	return pattern.test(raw) ? sourceURL(raw) : null;
}
