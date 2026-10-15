/** Playback intent is independent of automatic visibility/offscreen suspension. */
export function createPlaybackPolicy(reduced = false) {
	let wanted = false;
	let blocked = false;
	return {
		userPlay() { wanted = true; },
		userPause() { wanted = false; },
		setReduced(value: boolean) { reduced = value; if (value) wanted = false; },
		setBlocked(value: boolean) { blocked = value; },
		autoplay() { if (!reduced) wanted = true; },
		shouldPlay() { return wanted && !blocked; }
	};
}

/** Idempotent teardown, including late-registered resources. */
export function createCleanup() {
	let disposed = false;
	const callbacks: (() => void)[] = [];
	return {
		get disposed() { return disposed; },
		add(callback: () => void) { if (disposed) callback(); else callbacks.push(callback); },
		dispose() {
			if (disposed) return;
			disposed = true;
			for (const callback of callbacks.reverse()) callback();
			callbacks.length = 0;
		}
	};
}
