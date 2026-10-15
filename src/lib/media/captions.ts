export interface CaptionTrack {
	/** Approved, self-hosted WebVTT file. Never an inferred transcript. */
	src: string;
	srclang: string;
	label: string;
	kind?: 'captions' | 'subtitles';
	default?: boolean;
}

// Asset handoff: populate only after approved WebVTT files exist in static/captions/.
// Empty manifests deliberately do not manufacture caption availability.
export const SHOWREEL_CAPTIONS: readonly CaptionTrack[] = [];
export const PROJECT_CAPTIONS: Readonly<Record<string, readonly CaptionTrack[]>> = {};

export function safeCaptionTracks(tracks: readonly CaptionTrack[]): CaptionTrack[] {
	const seen = new Set<string>();
	let hasDefault = false;
	return tracks.flatMap(track => {
		if (!/^\/captions\/[a-zA-Z0-9_-]+\.vtt$/.test(track.src) || !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(track.srclang) || !track.label.trim()) return [];
		const key = `${track.src}:${track.srclang}`;
		if (seen.has(key)) return [];
		seen.add(key);
		const isDefault = !!track.default && !hasDefault;
		hasDefault ||= isDefault;
		return [{ ...track, label: track.label.trim(), kind: track.kind === 'subtitles' ? 'subtitles' as const : 'captions' as const, default: isDefault }];
	});
}

export function projectCaptionTracks(slug: string): CaptionTrack[] {
	return safeCaptionTracks(PROJECT_CAPTIONS[slug] ?? []);
}
