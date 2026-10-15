import type { Media, Project } from '$lib/payload-types';
import { projectSources, PLACEHOLDER_SHOWREEL, sourceURL } from './sources.ts';

export function waitFor(target: EventTarget, event: string, action: () => void, signal: AbortSignal, timeout = 8000): Promise<void> {
	return new Promise((resolve, reject) => {
		let timer: ReturnType<typeof setTimeout>;
		const clean = () => { clearTimeout(timer); target.removeEventListener(event, success); target.removeEventListener('error', failure); signal.removeEventListener('abort', aborted); };
		const success = () => { clean(); resolve(); };
		const failure = () => { clean(); reject(new Error(`Media ${event} failed`)); };
		const aborted = () => { clean(); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); };
		if (signal.aborted) { aborted(); return; }
		target.addEventListener(event, success, { once: true });
		target.addEventListener('error', failure, { once: true });
		signal.addEventListener('abort', aborted, { once: true });
		timer = setTimeout(failure, timeout);
		try { action(); } catch (error) { clean(); reject(error); }
	});
}
const release = (video: HTMLVideoElement) => { video.pause(); video.removeAttribute('src'); video.load(); };
export async function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
	const image = new Image();
	try { await waitFor(image, 'load', () => { image.src = url; }, signal); return image; }
	catch (error) { image.removeAttribute('src'); throw error; }
}
async function loadVideo(url: string, signal: AbortSignal) {
	const video = document.createElement('video');
	video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true; video.preload = 'auto';
	try {
		await waitFor(video, 'loadeddata', () => { video.src = url; video.load(); }, signal);
		if (!video.videoWidth || !video.videoHeight) throw new Error('Video has no decoded frame');
		const sample = Math.min(.6, Math.max(0, video.duration - .1));
		if (sample > 0) await waitFor(video, 'seeked', () => { video.currentTime = sample; }, signal);
		return video;
	} catch (error) { release(video); throw error; }
}
function still(video: HTMLVideoElement) {
	const canvas = document.createElement('canvas');
	const scale = Math.min(1, 960 / video.videoWidth);
	canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
	canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
	return canvas;
}
function placeholder(title: string) {
	const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#0a1f38'; ctx.fillRect(0, 0, 640, 360);
	ctx.fillStyle = '#f0e3d1'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
	ctx.fillText(title.slice(0, 40), 320, 180, 580);
	return canvas;
}

export async function loadMedia(docs: Project[], heroURL: string, signal: AbortSignal, onUpdate: () => void) {
	const videos = new Set<HTMLVideoElement>();
	let disposed = false;
	const dispose = () => {
		disposed = true;
		videos.forEach(video => { video.removeEventListener('seeked', onUpdate); release(video); }); videos.clear();
		signal.removeEventListener('abort', dispose);
	};
	signal.addEventListener('abort', dispose, { once: true });
	async function video(url: string, loadSignal = signal) {
		const loaded = await loadVideo(url, loadSignal);
		if (disposed || signal.aborted) { release(loaded); throw new DOMException('Aborted', 'AbortError'); }
		videos.add(loaded); loaded.addEventListener('seeked', onUpdate); return loaded;
	}
	async function project(item?: Project) {
		// Optional cards get one shared budget across renditions/poster, not an
		// eight-second wait per candidate that could discard a ready Showreel.
		const projectSignal = AbortSignal.any([signal, AbortSignal.timeout(6000)]);
		let loaded: HTMLVideoElement | null = null;
		if (item) for (const url of projectSources(item)) {
			try { loaded = await video(url, projectSignal); break; }
			catch { if (signal.aborted) throw signal.reason; if (projectSignal.aborted) break; }
		}
		let poster: HTMLImageElement | HTMLCanvasElement = loaded ? still(loaded) : placeholder(item?.title ?? 'WAWE FILMS');
		const asset = item?.poster && typeof item.poster === 'object' ? item.poster as Media : null;
		const posterURL = asset?.mimeType?.startsWith('image/') ? sourceURL(asset.url) : null;
		if (posterURL && !projectSignal.aborted) { try { poster = await loadImage(posterURL, projectSignal); } catch { if (signal.aborted) throw signal.reason; } }
		return { id: item?.id, slug: item?.slug, title: item?.title ?? 'WAWE FILMS',
			ratio: loaded ? loaded.videoWidth / loaded.videoHeight : 16 / 9,
			video: loaded, poster };
	}
	try {
		// Six visual slots, not six required downloads: failed/missing projects use still title cards.
		// Only three project loads in flight; the independent Showreel loads alongside them.
		const projectsJob = async () => {
			const projects: Awaited<ReturnType<typeof project>>[] = [];
			for (let i = 0; i < 6; i += 3) projects.push(...await Promise.all([0, 1, 2].map(j => project(docs[i + j]))));
			return projects;
		};
		const heroJob = async () => {
			try { return { hero: await video(heroURL), placeholder: heroURL === PLACEHOLDER_SHOWREEL }; }
			catch (error) {
				if (signal.aborted || heroURL === PLACEHOLDER_SHOWREEL) throw error;
				return { hero: await video(PLACEHOLDER_SHOWREEL), placeholder: true };
			}
		};
		const [projects, hero, badge] = await Promise.all([
			projectsJob(), heroJob(), loadImage(new URL('./assets/badge.png', import.meta.url).href, signal)
		]);
		if (signal.aborted || disposed) throw new DOMException('Aborted', 'AbortError');
		return { projects, ...hero, badge, warnings: [],
			pause() { videos.forEach(v => v.pause()); },
			reset() { videos.forEach(v => { v.pause(); v.currentTime = Math.min(.6, Math.max(0, v.duration - .1)); }); }, dispose };
	} catch (error) { dispose(); throw error; }
}
