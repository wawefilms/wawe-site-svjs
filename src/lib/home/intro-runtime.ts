import opening from '../landing/approved-opening.json';
import { createField } from '../landing/field.js';
import { createMotion, defaults } from '../landing/motion.js';
import { createCleanup } from './playback';
import { INTRO_DEADLINE_MS, waitForFrame, waitForArtwork, type Artwork } from './readiness';

export interface IntroOptions {
	host: HTMLElement;
	video: HTMLVideoElement;
	water: HTMLCanvasElement;
	logo: HTMLCanvasElement;
	reveal: HTMLCanvasElement;
	artworks?: readonly Artwork[];
	onopening(): void;
	onfinish(): void;
}

/** The accepted wave kernel, with native video as the only reveal painter. */
export function mountIntro({ host, video, water, logo, reveal, artworks = [], onopening, onfinish }: IntroOptions) {
	const cleanup = createCleanup();
	const controller = new AbortController();
	const reduce = matchMedia('(prefers-reduced-motion: reduce)');
	const motion = createMotion(opening.speed, reduce.matches);
	let raf = 0, last: number | null = null;
	let ready = false;
	const viewport = () => ({ width: host.clientWidth, height: host.clientHeight });
	const contexts = [water, logo, reveal].map(canvas => canvas.getContext('2d'));
	let field: ReturnType<typeof createField> | null = null;
	function finish() { if (!cleanup.disposed) { cleanup.dispose(); onfinish(); } }
	cleanup.add(() => controller.abort());
	cleanup.add(() => cancelAnimationFrame(raf));
	cleanup.add(() => field?.dispose());
	const deadline = setTimeout(finish, INTRO_DEADLINE_MS);
	cleanup.add(() => clearTimeout(deadline));
	const changed = () => { if (reduce.matches) finish(); };
	reduce.addEventListener('change', changed);
	cleanup.add(() => reduce.removeEventListener('change', changed));
	const failed = () => finish();
	video.addEventListener('error', failed);
	video.addEventListener('emptied', failed);
	cleanup.add(() => { video.removeEventListener('error', failed); video.removeEventListener('emptied', failed); });
	const visibility = () => { if (document.hidden) finish(); };
	document.addEventListener('visibilitychange', visibility);
	cleanup.add(() => document.removeEventListener('visibilitychange', visibility));
	const intersection = new IntersectionObserver(entries => {
		if (entries.some(entry => !entry.isIntersecting)) finish();
	});
	intersection.observe(video);
	cleanup.add(() => intersection.disconnect());

	function frame(now: number) {
		if (cleanup.disposed) return;
		try {
			const dt = last === null ? 0 : Math.min(.1, Math.max(0, (now - last) / 1000));
			last = now;
			motion.tick(dt, defaults);
			const snapshot = motion.snapshot();
			if (snapshot.state === 'settled' || (ready && snapshot.firstLapComplete)) { finish(); return; }
			field?.render(snapshot.clock, snapshot.segment ? { ...snapshot.segment, variant: 'erosion' } : null, false);
			raf = requestAnimationFrame(frame);
		} catch { finish(); }
	}

	void (async () => {
		try {
			if (reduce.matches || document.hidden || contexts.some(ctx => !ctx)) { finish(); return; }
			field = createField(opening, ...contexts,
				(ctx: CanvasRenderingContext2D, width: number, height: number) => {
					// Fullscreen wave reveals the actual contained DOM film, not a second
					// fullscreen/cropped player. The final frame aligns without a size jump.
					ctx.fillStyle = getComputedStyle(video).backgroundColor;
					ctx.fillRect(0, 0, width, height);
					if (video.readyState < 2) return;
					const film = video.getBoundingClientRect(), overlay = host.getBoundingClientRect();
					ctx.drawImage(video, film.left - overlay.left, film.top - overlay.top, film.width, film.height);
				}, viewport);
			// Keep the first painted breaker (~2.3s at the accepted speed), even on
			// cache hits. Slow readiness never resets the lap; failures still fail open.
			const readiness = Promise.all([waitForFrame(video, controller.signal), waitForArtwork(artworks, controller.signal)])
				.then(() => { ready = true; }).catch(finish);
			await field.load(controller.signal);
			if (cleanup.disposed) return;
			onopening();
			raf = requestAnimationFrame(frame);
			const resize = new ResizeObserver(() => {
				if (!cleanup.disposed) { try { field?.resize(); } catch { finish(); } }
			});
			resize.observe(host);
			cleanup.add(() => resize.disconnect());
			await readiness;
		} catch { finish(); }
	})();
	return { dispose: () => cleanup.dispose(), skip: finish };
}
