export interface ShowreelCue { slug: string; start: number; end: number }
export interface CueProject { slug: string; title: string }

/** Resolve against the full catalogue, never the six visual slots or cue order. */
export function currentProject<T extends CueProject>(
	cues: readonly ShowreelCue[] | undefined, projects: readonly T[], time: number, placeholder = false
): T | null {
	if (placeholder || !Number.isFinite(time) || time < 0) return null;
	const matches = (cues ?? []).filter(cue => Number.isFinite(cue.start) && Number.isFinite(cue.end)
		&& cue.start >= 0 && cue.end > cue.start && time >= cue.start && time < cue.end);
	// Ambiguous/invalid content must not claim that a particular Project is on screen.
	if (matches.length !== 1) return null;
	const catalogue = projects.filter(project => project.slug === matches[0].slug);
	return catalogue.length === 1 ? catalogue[0] : null;
}

/** Events cover paused seeks, looping and native controls; canvas frames sample too. */
export function observePlayback(video: HTMLVideoElement, update: (time: number) => void): () => void {
	const events = ['timeupdate', 'seeking', 'seeked', 'loadeddata', 'play', 'pause', 'ended', 'emptied'];
	const sample = () => update(video.currentTime);
	for (const event of events) video.addEventListener(event, sample);
	let frame: number | undefined;
	const nextFrame = () => {
		sample();
		frame = video.requestVideoFrameCallback(nextFrame);
	};
	// Native playback has no landing render loop. Sample decoded frames when supported.
	if (typeof video.requestVideoFrameCallback === 'function') frame = video.requestVideoFrameCallback(nextFrame);
	sample();
	return () => {
		if (frame !== undefined) video.cancelVideoFrameCallback(frame);
		for (const event of events) video.removeEventListener(event, sample);
	};
}
