<script lang="ts">
	import { onMount } from 'svelte';
	import type { ProjectSummary } from '$lib/projects/model';
	import { currentProject, observePlayback, type ShowreelCue } from '$lib/landing/cues';
	import { PLACEHOLDER_SHOWREEL } from '$lib/landing/sources';
	import AsciiIntro from './AsciiIntro.svelte';
	import { createPlaybackPolicy } from './playback';
	import { heroSource } from './sources';
	import type { Artwork } from './readiness';

	import { safeCaptionTracks, SHOWREEL_CAPTIONS, type CaptionTrack } from '$lib/media/captions';
	let { showreel, projects, onactiveproject, onratiochange, artworks = [], captions = SHOWREEL_CAPTIONS }: {
		showreel: { videoUrl: string | null; posterUrl: string | null; cues: ShowreelCue[] } | null;
		projects: ProjectSummary[];
		artworks?: readonly Artwork[];
		captions?: readonly CaptionTrack[];
		onactiveproject?: (project: ProjectSummary | null) => void;
		onratiochange?: (ratio: number) => void;
	} = $props();
	const source = $derived(heroSource(showreel?.videoUrl, 'video') ?? PLACEHOLDER_SHOWREEL);
	const poster = $derived(heroSource(showreel?.posterUrl, 'image'));
	let host = $state<HTMLDivElement>();
	let video = $state<HTMLVideoElement>();
	let mounted = $state(false), failed = $state(false);
	let playing = $state(false), muted = $state(true), ratio = $state(16 / 9);
	let playbackMessage = $state('');
	let captionLanguage = $state('');
	const tracks = $derived(safeCaptionTracks(captions));
	function updateDimensions() {
		if (video?.videoWidth && video.videoHeight) ratio = video.videoWidth / video.videoHeight;
	}
	async function togglePlayback() {
		if (!video || failed) return;
		playbackMessage = '';
		if (!video.paused) { video.pause(); return; }
		try { await video.play(); }
		catch { playbackMessage = 'Playback could not start. Try again or open the video.'; }
	}
	function playbackKey(event: KeyboardEvent) {
		if (!video || !Number.isFinite(video.duration)) return;
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (event.key === 'ArrowRight' ? 10 : -10)));
	}
	function selectCaptions(event: Event) {
		captionLanguage = (event.currentTarget as HTMLSelectElement).value;
		if (!video) return;
		for (const track of video.textTracks) track.mode = track.language === captionLanguage ? 'showing' : 'disabled';
	}
	let sample = $state<{ source: string; time: number } | null>(null);
	const activeProject = $derived(currentProject(showreel?.cues, projects, sample?.source === source ? sample.time : -1, source === PLACEHOLDER_SHOWREEL || failed));
	$effect(() => { onactiveproject?.(activeProject); });
	$effect(() => { onratiochange?.(ratio); });
	onMount(() => { mounted = true; return () => { onactiveproject?.(null); }; });

	$effect(() => {
		const player = video;
		const currentSource = source;
		if (!mounted || !player) return;
		sample = null; failed = false; playing = !player.paused; muted = player.muted;
		ratio = 16 / 9; updateDimensions(); playbackMessage = ''; captionLanguage = tracks.find(track => track.default)?.srclang ?? '';
		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		const policy = createPlaybackPolicy(reduce.matches);
		let destroyed = false, automaticPause = false, pending = false;
		const rect = player.getBoundingClientRect();
		let offscreen = rect.bottom <= 0 || rect.top >= innerHeight;
		function suspend() {
			if (!player || player.paused) return;
			automaticPause = true;
			player.pause();
		}
		function sync() {
			if (destroyed || !player) return;
			policy.setBlocked(document.hidden || offscreen);
			if (!policy.shouldPlay()) { suspend(); return; }
			if (!player.paused || pending) return;
			pending = true;
			void player.play().catch(() => {
				if (!destroyed && !document.hidden && !offscreen) policy.userPause();
			}).finally(() => {
				pending = false;
				if (!destroyed && !policy.shouldPlay()) suspend();
			});
		}
		const play = () => {
			policy.userPlay();
			policy.setBlocked(document.hidden || offscreen);
			if (!policy.shouldPlay()) suspend();
		};
		const pause = () => {
			if (automaticPause) automaticPause = false;
			else policy.userPause();
		};
		const reset = () => { sample = null; policy.userPause(); };
		const error = () => { failed = true; reset(); suspend(); };
		const reduced = () => { policy.setReduced(reduce.matches); sync(); };
		player.addEventListener('play', play);
		player.addEventListener('pause', pause);
		player.addEventListener('emptied', reset);
		player.addEventListener('error', error);
		const stopPlayback = observePlayback(player, value => {
			if (!destroyed && currentSource === source) sample = player.readyState >= 2 ? { source: currentSource, time: value } : null;
		});
		const observer = new IntersectionObserver(entries => {
			offscreen = !entries.some(entry => entry.isIntersecting);
			sync();
		});
		observer.observe(player);
		document.addEventListener('visibilitychange', sync);
		reduce.addEventListener('change', reduced);
		player.muted = true;
		policy.autoplay(); sync();
		return () => {
			destroyed = true;
			stopPlayback(); observer.disconnect();
			document.removeEventListener('visibilitychange', sync);
			reduce.removeEventListener('change', reduced);
			player.removeEventListener('play', play);
			player.removeEventListener('pause', pause);
			player.removeEventListener('emptied', reset);
			player.removeEventListener('error', error);
			player.pause(); onactiveproject?.(null);
		};
	});
</script>

<section id="showreel" class="site-container" aria-label="WAWE Films showreel">
	<div class="film" style:aspect-ratio={ratio} bind:this={host}>
		{#key source}
			<!-- Film montage: no CMS caption track is currently available. -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={video} src={source} poster={poster ?? undefined} controls={!mounted} muted playsinline loop preload="metadata" onloadedmetadata={updateDimensions} onplay={() => playing = true} onpause={() => playing = false} onvolumechange={() => muted = video?.muted ?? true} aria-label={source === PLACEHOLDER_SHOWREEL ? 'WAWE Films preview showreel — placeholder footage' : 'WAWE Films showreel'}>
				<a href={source}>Open showreel video</a>
				{#each tracks as track (track.src)}
					<track kind={track.kind} src={track.src} srclang={track.srclang} label={track.label} default={track.default} />
				{/each}
			</video>
			{#if mounted}
				<button class="film-toggle" aria-label={playing ? 'Pause showreel' : 'Play showreel'} aria-describedby="showreel-keys" disabled={failed} onclick={togglePlayback} onkeydown={playbackKey}>
					{#if !playing}<span class="play-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5 20 12 8 19Z" fill="currentColor" /></svg></span>{/if}
				</button>
				<span id="showreel-keys" class="sr-only">Tap, Space or Enter to play or pause. Left and right arrows seek ten seconds.</span>
				<div class="film-tools">
					{#if tracks.length}
						<label class="sr-only" for="showreel-captions">Showreel captions</label>
						<select id="showreel-captions" value={captionLanguage} onchange={selectCaptions}><option value="">Captions off</option>{#each tracks as track (track.src)}<option value={track.srclang}>{track.label}</option>{/each}</select>
					{/if}
					<button class="mute-toggle" aria-label={muted ? 'Unmute showreel' : 'Mute showreel'} disabled={failed} onclick={() => { if (video) video.muted = !video.muted; }}>
						<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4 5 9H2v6h3l6 5Z" />{#if muted}<path d="m16 9 6 6m0-6-6 6" />{:else}<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />{/if}</svg>
					</button>
				</div>
			{/if}
		{/key}
	</div>
	{#key source}
		{#if mounted && video && host}<AsciiIntro {video} {host} {artworks} />{/if}
	{/key}
	{#if failed}
		<div class="playback"><p>Showreel unavailable. <a href={source}>Open video</a> or <a href="#projects">browse Projects</a>.</p></div>
	{/if}
	{#if playbackMessage}<p class="playback" role="status">{playbackMessage} <a href={source}>Open video</a></p>{/if}
</section>

<style>
	section { position: relative; margin-block: 0; }
	.film { position: relative; width: 100%; margin-inline: auto; overflow: hidden; border-radius: 0 0 var(--film-radius) var(--film-radius); background: var(--color-surface); }
	video { display: block; width: 100%; height: 100%; object-fit: contain; background: var(--color-surface); }
	.film-toggle { position: absolute; inset: 0; display: grid; place-items: center; width: 100%; height: 100%; padding: 0; border: 0; background: transparent; color: var(--color-surface-text); cursor: pointer; touch-action: manipulation; }
	.play-mark { display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%; background: var(--color-surface); }
	.play-mark svg { width: 2rem; height: 2rem; }
	.film-tools { position: absolute; bottom: 1rem; right: 1rem; display: flex; align-items: center; gap: .5rem; }
	.mute-toggle, select { min-height: 44px; border: 0; border-radius: .4rem; background: var(--color-surface); color: var(--color-surface-text); cursor: pointer; touch-action: manipulation; }
	.mute-toggle { width: 44px; display: grid; place-items: center; }
	.mute-toggle svg { width: 24px; height: 24px; }
	select { padding: .5rem; font: var(--type-control); }
	button:focus-visible, select:focus-visible { outline: 2px solid var(--color-focus); outline-offset: -5px; }
	button:disabled { cursor: not-allowed; opacity: .6; }
	.playback { position: absolute; top: 1rem; left: 1rem; max-width: calc(100% - 2rem); display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; padding: .25rem; border-radius: .4rem; background: var(--color-surface); color: var(--color-surface-text); font: var(--type-body); }
	a:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; }
	p { margin: 0; color: var(--color-surface-muted); }
	a { color: var(--color-surface-text); text-decoration: underline; text-underline-offset: .2em; }
</style>
