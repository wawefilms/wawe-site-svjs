// Intro video gate — Cloudflare-safe hero preload measurement.
//
// The showreel videos route through Cloudflare, which does not serve
// byte-range (progressive) requests from cache the way R2-direct does.
// That makes `video.buffered` unreliable: it may sit at 0 and jump to
// full, or never populate until the whole file lands. So readiness is
// an OR of three signals — buffered fraction ≥ 30%, HAVE_ENOUGH_DATA,
// or the `canplaythrough` event — plus error/complete fallbacks so a
// broken video can never trap the intro on screen.

import { writable } from 'svelte/store';

export const READY_FRACTION = 0.3;

/** 0..1 measured buffered fraction of the hero video. */
export const videoProgress = writable(0);

/** True once the hero is watchable enough to wash away for. */
export const videoReady = writable(false);

let monitoring = false;

function markReady() {
	videoReady.set(true);
}

function bufferedFraction(el: HTMLVideoElement): number {
	try {
		const dur = el.duration;
		if (!dur || !isFinite(dur) || el.buffered.length === 0) return 0;
		return Math.min(1, el.buffered.end(el.buffered.length - 1) / dur);
	} catch {
		return 0;
	}
}

/**
 * Start (once) an offscreen preload of the hero video and flip
 * `videoReady` when it is ≥30% buffered, has enough data to play
 * through, or fails outright. Safe to call repeatedly; no-ops after
 * the first call or when given an empty src.
 */
export function monitorHeroVideo(src: string): void {
	if (monitoring || !src || typeof document === 'undefined') return;
	monitoring = true;

	const el = document.createElement('video');
	el.muted = true;
	el.playsInline = true;
	el.preload = 'auto';
	// Never inserted into the DOM — measurement only. The Showreel's own
	// atlas pass draws real frames separately.

	let done = false;
	const finish = () => {
		if (done) return;
		done = true;
		videoProgress.set(1);
		markReady();
		cleanup();
	};

	const poll = () => {
		if (done) return;
		const frac = bufferedFraction(el);
		videoProgress.set(frac);
		// HAVE_ENOUGH_DATA covers the no-range case where buffered stays 0
		// until the file completes but the decoder is already fed.
		if (frac >= READY_FRACTION || el.readyState >= 4) finish();
	};

	const onCanPlayThrough = () => finish();
	const onError = () => finish(); // broken video must not trap the intro
	const onSuspend = () => poll();

	const cleanup = () => {
		el.removeEventListener('canplaythrough', onCanPlayThrough);
		el.removeEventListener('error', onError);
		el.removeEventListener('suspend', onSuspend);
		el.removeEventListener('progress', poll);
		el.removeEventListener('loadeddata', poll);
	};

	el.addEventListener('canplaythrough', onCanPlayThrough);
	el.addEventListener('error', onError);
	el.addEventListener('suspend', onSuspend);
	el.addEventListener('progress', poll);
	el.addEventListener('loadeddata', poll);
	try {
		el.src = src;
		el.load();
	} catch {
		finish();
	}
}
