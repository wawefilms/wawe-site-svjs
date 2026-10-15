import opening from './approved-opening.json';
import { createField } from './field.js';
import { createMotion, defaults } from './motion.js';
import { createScene, sceneDefaults } from './scene.js';
import { backgrounds } from './backgrounds.js';
import { loadMedia } from './media';
import type { Project } from '$lib/payload-types';
import { observePlayback } from './cues';

export interface LandingRuntime {
	dispose(): void;
	replay(): void;
	pause(value: boolean): void;
	settings(bottomPadding: number | null, spreadSpeed: number): void;
}
export interface LinkRect { x: number; y: number; w: number; h: number }
export interface IdentityRect extends LinkRect { font: number }
interface Options {
	host: HTMLElement;
	water: HTMLCanvasElement;
	logo: HTMLCanvasElement;
	reveal: HTMLCanvasElement;
	projects: Project[];
	heroURL: string;
	onLayout?(cards: LinkRect[], identity: IdentityRect): void;
	onPlayback?(time: number): void;
	onState(state: 'opening' | 'settled' | 'fallback', placeholder?: boolean): void;
}
/** Browser-only, independently disposable mount. No globals or study tooling. */
export function mountLanding(options: Options): LandingRuntime {
	const { host, water, logo, reveal, onState } = options;
	const controller = new AbortController();
	const reduce = matchMedia('(prefers-reduced-motion: reduce)');
	const viewport = () => ({ width: host.clientWidth, height: host.clientHeight });
	const scene = createScene(viewport);
	const motion = createMotion(opening.speed, reduce.matches);
	let settings: { arrival: number; morph: number; stackSpeed: number; unfurl: number; viscosity: number; wobble: number; logoInStack: boolean; bottomPadding: number | null } = { ...sceneDefaults, logoInStack: true };
	let runSettings = { ...settings };
	let initialized = false, loaded = false, disposed = false, paused = false, settled = false;
	let time = -1, raf = 0, last: number | null = null;
	let layoutKey = '';
	let hero: HTMLVideoElement | undefined;
	let stopPlayback: (() => void) | undefined;
	const contexts = [water, logo, reveal].map(canvas => canvas.getContext('2d'));
	const field = contexts.every(Boolean) ? createField(opening, ...contexts,
		(ctx: CanvasRenderingContext2D, width: number, height: number) => scene.paint(ctx, width, height, time, 'recede', runSettings, backgrounds.midnight.color), viewport) : null;
	const end = () => scene.duration(runSettings, viewport().width, viewport().height);
	function dispose() {
		if (disposed) return;
		stopPlayback?.();
		disposed = true; clearTimeout(deadline); cancelAnimationFrame(raf); controller.abort();
		observer.disconnect(); document.removeEventListener('visibilitychange', playback);
		reduce.removeEventListener('change', reduced); scene.dispose(); field?.dispose();
	}
	function fail() { if (!disposed) { dispose(); onState('fallback'); } }
	function draw() {
		if (!initialized || disposed) return;
		scene.sync(time, 'recede', runSettings, loaded && !paused && !document.hidden && !reduce.matches, 1);
		if (hero) options.onPlayback?.(hero.currentTime);
		const s = motion.snapshot();
		field?.render(s.clock, s.segment ? { ...s.segment, variant: 'erosion' } : null, s.state === 'settled');
		if (loaded && time >= end()) {
			if (!settled) { settled = true; onState('settled'); }
			const { width, height } = viewport();
			const key = `${width}:${height}:${runSettings.bottomPadding}`;
			if (key !== layoutKey) {
				layoutKey = key;
				const layout = scene.model(end(), width, height, 'recede', runSettings).layout;
				options.onLayout?.(layout.cards.map((r: LinkRect) => ({ x: r.x / width * 100, y: r.y / height * 100, w: r.w / width * 100, h: r.h / height * 100 })),
					{ x: layout.identity.x / width * 100, y: layout.rowY / height * 100, w: layout.identity.w / width * 100, h: layout.rowH / height * 100, font: layout.identity.font });
			}
		}
	}
	function frame(now: number) {
		if (disposed) return;
		const dt = last === null ? 0 : Math.min(.1, Math.max(0, (now - last) / 1000)); last = now;
		try {
			const before = motion.snapshot(); motion.tick(dt, defaults); const after = motion.snapshot();
			if (after.segment) time = before.state === 'settled' ? Math.min(end(), time + dt) : Math.min(end(), after.age - after.segment.washSeconds);
			draw();
			if (!paused && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
		} catch { fail(); }
	}
	function playback() {
		cancelAnimationFrame(raf); last = null;
		if (disposed) return;
		try { draw(); } catch { fail(); return; }
		if (initialized && !paused && !document.hidden) raf = requestAnimationFrame(frame);
	}
	function reduced() { if (reduce.matches) fail(); }
	const observer = new ResizeObserver(() => {
		if (!initialized || disposed) return;
		try { field?.resize(); if (settled) time = end(); playback(); } catch { fail(); }
	});
	// A bounded wait always exposes the server-rendered player/links on failure.
	const deadline = setTimeout(fail, 25000);
	observer.observe(host); document.addEventListener('visibilitychange', playback); reduce.addEventListener('change', reduced);
	if (reduce.matches || !field) queueMicrotask(fail);
	else void (async () => {
		try {
			await Promise.all([field.load(controller.signal), document.fonts.load('600 24px "Pilcrow Rounded"')]);
			if (disposed) return;
			initialized = true; onState('opening'); playback();
			const media = await loadMedia(options.projects, options.heroURL, controller.signal, () => { if (!disposed) { try { draw(); } catch { fail(); } } });
			if (disposed) { media.dispose(); return; }
			scene.load(media, playback); loaded = true; clearTimeout(deadline);
			onState('opening', media.placeholder);
			hero = media.hero; stopPlayback = observePlayback(hero, time => options.onPlayback?.(time));
			motion.signalReady(); playback();
		} catch { fail(); }
	})();
	return {
		dispose,
		pause(value) { paused = value; playback(); },
		replay() {
			if (!loaded || disposed) return;
			scene.reset(); runSettings = { ...settings }; motion.reset(false); time = -1;
			settled = false; paused = false; onState('opening'); motion.signalReady(); playback();
		},
		settings(bottomPadding, spreadSpeed) {
			settings = { ...settings, bottomPadding, unfurl: 1.8 / Math.max(.5, Math.min(6, spreadSpeed)) };
			runSettings.bottomPadding = bottomPadding; playback();
		}
	};
}
