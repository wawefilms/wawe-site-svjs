import type { Media } from '../payload-types.ts';
import { sourceURL } from '../landing/sources.ts';

export type MediaKind = 'video' | 'image' | 'unknown';
export type MediaRelationship = number | Media | null | undefined;
export interface NormalizedMedia {
	kind: MediaKind;
	/** Preferred safe URL; null for unpopulated, unsupported or disallowed assets. */
	url: string | null;
	videoUrl: string | null;
	imageUrl: string | null;
	/** Only an actual image can be used as a poster/share image. */
	posterUrl: string | null;
	/** Preferred smallFile video, then original video; deduplicated. */
	sources: string[];
	alt: string | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}

function asset(value: MediaRelationship): Media | null {
	return value && typeof value === 'object' ? value : null;
}

function kindOf(media: Media | null): MediaKind {
	if (!media) return 'unknown';
	const mime = media.mimeType?.split(';')[0].trim().toLowerCase();
	if (mime) return mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : 'unknown';
	const path = (media.url ?? media.filename ?? '').split(/[?#]/)[0];
	if (/\.(webm|mp4|mov|m4v)$/i.test(path)) return 'video';
	if (/\.(webp|png|jpe?g|avif)$/i.test(path)) return 'image';
	return 'unknown';
}

function safeURL(media: Media | null, kind: MediaKind): string | null {
	if (!media || kind === 'unknown' || kindOf(media) !== kind) return null;
	// Reject contradictory MIME/extension data, not just unsafe origins.
	const path = (media.url ?? '').split(/[?#]/)[0];
	const matches = kind === 'video' ? /\.(webm|mp4|mov|m4v)$/i : /\.(webp|png|jpe?g|avif)$/i;
	return matches.test(path) ? sourceURL(media.url) : null;
}

export function videoSources(value: MediaRelationship): string[] {
	const original = asset(value);
	if (kindOf(original) === 'image') return [];
	return [...new Set([asset(original?.smallFile), original]
		.flatMap(media => { const url = safeURL(media, 'video'); return url ? [url] : []; }))];
}

export function imageURL(value: MediaRelationship): string | null {
	return safeURL(asset(value), 'image');
}

/** Poster-safe alias; video, ID and missing relationships return null. */
export const posterURL = imageURL;

export function normalizedMedia(value: MediaRelationship): NormalizedMedia {
	const media = asset(value);
	const sources = videoSources(value);
	const imageUrl = imageURL(value);
	const videoUrl = sources[0] ?? null;
	const positive = (value: number | null | undefined) =>
		typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
	return {
		kind: videoUrl ? 'video' : imageUrl ? 'image' : kindOf(media),
		url: videoUrl ?? imageUrl,
		videoUrl,
		imageUrl,
		posterUrl: imageUrl,
		sources,
		alt: media?.alt ?? null,
		width: positive(media?.width),
		height: positive(media?.height),
		mimeType: media?.mimeType ?? null
	};
}
