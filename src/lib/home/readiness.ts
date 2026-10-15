import { waitFor } from '../landing/media.ts';

export const INTRO_DEADLINE_MS = 25_000;

/** Retained landing boundary: one decoded frame (loadeddata), not canplaythrough. */
export async function waitForFrame(video: HTMLVideoElement, signal: AbortSignal, timeout = INTRO_DEADLINE_MS): Promise<void> {
	if (signal.aborted) throw signal.reason;
	if (video.error) throw new Error('Showreel failed');
	if (video.readyState < 2) await waitFor(video, 'loadeddata', () => {
		// Do not reset the SSR source or a user's playback/seek position.
		if (video.networkState === 0) video.load();
	}, signal, timeout);
	if (!video.videoWidth || !video.videoHeight) throw new Error('Showreel has no decoded frame');
}
