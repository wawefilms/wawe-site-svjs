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

export interface Artwork { src: string; fallback?: string }

/** Decode every required logo in parallel; failed CMS artwork may use verified local art. */
export async function waitForArtwork(assets: readonly Artwork[], signal: AbortSignal, createImage: () => HTMLImageElement = () => new Image(), timeout = 4000): Promise<void> {
	const decode = (src: string) => new Promise<void>((resolve, reject) => {
		if (signal.aborted) { reject(signal.reason); return; }
		const image = createImage();
		const done = (error?: unknown) => {
			clearTimeout(timer); signal.removeEventListener('abort', abort);
			if (error) { image.src = ''; reject(error); } else resolve();
		};
		const abort = () => done(signal.reason ?? new Error('Artwork loading aborted'));
		const timer = setTimeout(() => done(new Error('Artwork loading timed out')), timeout);
		signal.addEventListener('abort', abort, { once: true });
		image.src = src;
		void image.decode().then(() => done(image.naturalWidth ? undefined : new Error('Artwork has no decoded pixels')), done);
	});
	await Promise.all([...new Map(assets.map(asset => [asset.src, asset])).values()].map(async asset => {
		try { await decode(asset.src); }
		catch (error) {
			if (signal.aborted || !asset.fallback || asset.fallback === asset.src) throw error;
			await decode(asset.fallback);
		}
	}));
}
