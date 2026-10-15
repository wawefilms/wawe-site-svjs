<script lang="ts">
	import { dev } from '$app/environment';
	import { getContext, onMount } from 'svelte';
	import type { Project } from '$lib/payload-types';
	import { showreelSource, sourceURL, PLACEHOLDER_SHOWREEL } from './sources';
	import type { LandingRuntime, LinkRect, IdentityRect } from './runtime';
	import { currentProject, observePlayback, type ShowreelCue } from './cues';

	let { projects, showreel }: { projects: Project[]; showreel: { videoUrl: string | null; posterUrl: string | null; cues?: ShowreelCue[] } | null } = $props();
	const intro = getContext<{ playing: boolean; done: boolean; revealed: boolean }>('intro');
	const source = $derived(showreelSource(showreel));
	let host: HTMLElement, water: HTMLCanvasElement, logo: HTMLCanvasElement, reveal: HTMLCanvasElement;
	let runtime: LandingRuntime | undefined;
	let cards = $state<LinkRect[]>([]);
	let identity = $state<IdentityRect>();
	let playbackTime = $state(0);
	let playerFrame = 0;
	let phase = $state<'fallback' | 'opening' | 'settled'>('fallback');
	let paused = $state(false), player = $state(false), placeholder = $state(false);
	let playerVideo: HTMLVideoElement;
	let bottomPadding = $state(28), autoPadding = $state(true), spreadSpeed = $state(2.4);
	const playerSource = $derived(placeholder ? PLACEHOLDER_SHOWREEL : source.url);
	const activeProject = $derived(currentProject(showreel?.cues, projects, playbackTime, placeholder || source.placeholder));
	$effect(() => {
		// Only the visible player owns the identity; hidden canvas video events are ignored.
		if (playerVideo && (player || phase === 'fallback')) {
			playerSource;
			return observePlayback(playerVideo, time => { playbackTime = time; });
		}
	});
	function closePlayer() { playerVideo?.pause(); player = false; runtime?.pause(paused); }
	function finishIntro() { if (intro) { intro.playing = false; intro.done = true; intro.revealed = true; } }
	function fallback() { runtime?.dispose(); phase = 'fallback'; finishIntro(); }
	function play() {
		player = true; paused = true; runtime?.pause(true); finishIntro();
		// Native controls remain usable even if an autoplay policy rejects this request.
		cancelAnimationFrame(playerFrame);
		playerFrame = requestAnimationFrame(() => { playerVideo?.focus(); void playerVideo?.play().catch(() => {}); });
	}
	function togglePause() { paused = !paused; runtime?.pause(paused); }
	function tune() { runtime?.settings(autoPadding ? null : bottomPadding, spreadSpeed); }
	onMount(() => {
		let destroyed = false;
		bottomPadding = innerWidth < 700 ? 18 : Math.max(28, Math.round(innerWidth * .052));
		placeholder = source.placeholder;
		finishIntro();
		void import('./runtime').then(({ mountLanding }) => {
			if (destroyed) return;
			runtime = mountLanding({ host, water, logo, reveal, projects, heroURL: source.url,
				onLayout(rects, rect) { cards = rects; identity = rect; },
				onPlayback(time) { if (!destroyed && !player && phase !== 'fallback') playbackTime = time; },
				onState(next, isPlaceholder) {
					if (destroyed) return;
					phase = next;
					if (isPlaceholder !== undefined) placeholder = isPlaceholder;
					if (player) finishIntro();
					else if (intro) { intro.playing = next === 'opening'; intro.done = next !== 'opening'; intro.revealed = next !== 'opening'; }
				}
			});
			if (player) runtime.pause(true);
		}).catch(fallback);
		const visibility = () => { if (document.hidden) playerVideo?.pause(); };
		document.addEventListener('visibilitychange', visibility);
		return () => { destroyed = true; cancelAnimationFrame(playerFrame); runtime?.dispose(); playerVideo?.pause(); document.removeEventListener('visibilitychange', visibility); finishIntro(); };
	});
</script>

<section class="landing" aria-label="WAWE Films showreel">
	<h1 class="sr-only">WAWE Films — films that move</h1>
	<div class="stage" bind:this={host}>
		<div class="fallback" hidden={phase !== 'fallback' && !player}>
			<h2>WAWE FILMS / SHOWREEL</h2>
			<!-- The reel is a film montage; CMS currently supplies no caption track. -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={playerVideo} src={playerSource} poster={sourceURL(showreel?.posterUrl) ?? undefined} controls playsinline preload="none" tabindex="0" aria-label="Play WAWE Films showreel"
				onplay={() => { player = true; paused = true; runtime?.pause(true); finishIntro(); }}
				onerror={() => { if (playerSource !== PLACEHOLDER_SHOWREEL) placeholder = true; }}>
				<a href={playerSource}>Download the showreel</a>
			</video>
			<p class="native-identity">
				{#if activeProject}<a href={`/project/${encodeURIComponent(activeProject.slug)}`}>{activeProject.title}</a>{:else}SHOWREEL{/if}
			</p>
			<p>{placeholder || source.placeholder ? 'Preview showreel — placeholder footage.' : 'WAWE Films showreel.'} <a href={playerSource}>Open video</a> · <a href="#projects">Browse projects</a></p>
			{#if player}<button onclick={closePlayer}>Close player</button>{/if}
		</div>
		<div class="canvases" class:active={phase !== 'fallback' && !player} aria-hidden="true">
			<canvas bind:this={reveal}></canvas><canvas bind:this={logo}></canvas><canvas bind:this={water}></canvas>
		</div>
		{#if phase === 'settled' && !player}
			{#if identity}
				<div class="current-project" style:left={`${identity.x}%`} style:top={`${identity.y}%`} style:width={`${identity.w}%`} style:height={`${identity.h}%`} style:font-size={`${identity.font}px`}>
					{#if activeProject}
						<a href={`/project/${encodeURIComponent(activeProject.slug)}`} title={activeProject.title}><span>{activeProject.title}</span></a>
					{:else}<span>SHOWREEL</span>{/if}
				</div>
			{/if}
			{#each cards as rect, index}
				{@const project = projects[index]}
				{#if project}
					<a class="card-link" href={`/project/${encodeURIComponent(project.slug)}`} aria-label={project.title}
						style:left={`${rect.x}%`} style:top={`${rect.y}%`} style:width={`${rect.w}%`} style:height={`${rect.h}%`}><span>{project.title}</span></a>
				{/if}
			{/each}
		{/if}
		{#if phase !== 'fallback' && !player}
			<div class="playback">
				<button onclick={play}>Play showreel{placeholder ? ' (preview)' : ''}</button>
				<button onclick={togglePause} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button>
				{#if phase === 'opening'}<button onclick={fallback}>Skip animation</button>{/if}
			</div>
		{/if}
	</div>
	<nav class="project-links" aria-label="Featured projects">
		{#each projects.slice(0, 6) as project (project.id)}
			<a href={`/project/${encodeURIComponent(project.slug)}`}>{project.title}</a>
		{/each}
		<a href="#projects">All projects ↓</a>
	</nav>
	{#if dev}
		<details class="dev-controls">
			<summary>Landing development controls</summary>
			<label><input type="checkbox" bind:checked={autoPadding} onchange={(event) => { autoPadding = event.currentTarget.checked; tune(); }} /> Bottom Padding: auto gutter</label>
			<label>Bottom Padding {bottomPadding}px <input aria-label="Bottom Padding" type="range" min="0" max="180" step="1" bind:value={bottomPadding} oninput={(event) => { bottomPadding = event.currentTarget.valueAsNumber; autoPadding = false; tune(); }} /></label>
			<label>Spread Speed {spreadSpeed.toFixed(1)}× <input aria-label="Spread Speed" type="range" min="0.5" max="6" step="0.1" bind:value={spreadSpeed} oninput={(event) => { spreadSpeed = event.currentTarget.valueAsNumber; tune(); }} /></label>
			<button onclick={() => { tune(); paused = false; runtime?.replay(); }}>Replay</button>
		</details>
	{/if}
</section>

<style>
	@font-face { font-family: Plex; src: url('/fonts/ibm-plex-mono.woff2') format('woff2'); font-display: swap; }
	@font-face { font-family: 'Pilcrow Rounded'; src: url('/fonts/PilcrowRounded-Semibold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
	.landing { background: #040e19; color: #f0e3d1; }
	.stage { position: relative; height: 100svh; min-height: 520px; overflow: hidden; background: #0a1f38; }
	.canvases { position: absolute; inset: 0; visibility: hidden; pointer-events: none; background: #0a1f38; }
	.canvases.active { visibility: visible; }
	.canvases :global(canvas) { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
	.canvases :global(canvas[hidden]) { display: none; }
	.fallback { position: absolute; inset: 0; padding: 80px 5.2vw 24px; background: #040e19; overflow: auto; }
	.fallback[hidden] { display: none; }
	.fallback h2 { margin-bottom: 16px; }
	.fallback video { display: block; width: 100%; height: min(65svh, 700px); background: #040e19; }
	.fallback p { margin-block: 16px; font-size: 14px; }
	.playback { position: absolute; top: 72px; right: 5.2vw; display: flex; gap: 8px; flex-wrap: wrap; justify-content: end; }
	button { padding: 9px 12px; border: 1px solid #f0e3d166; border-radius: 5px; background: #040e19e8; color: #f0e3d1; cursor: pointer; }
	a { text-decoration: underline; text-underline-offset: 4px; }
	button:focus-visible, a:focus-visible { outline: 2px solid #f0e3d1; outline-offset: 4px; }
	.current-project { position: absolute; display: flex; align-items: center; font-family: 'Pilcrow Rounded', sans-serif; font-weight: 600; line-height: 1.15; }
	.current-project a { display: flex; align-items: center; min-height: 44px; width: 100%; overflow-wrap: anywhere; }
	.current-project a span { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }
	.native-identity { font-family: 'Pilcrow Rounded', sans-serif; font-weight: 600; }
	.card-link { position: absolute; border-radius: 16px; }
	.card-link span { position: absolute; inset: auto 0 0; padding: 8px; background: #040e19; opacity: 0; }
	.card-link:focus-visible span { opacity: 1; }
	.project-links { display: flex; gap: 16px 24px; flex-wrap: wrap; padding: 24px 5.2vw; font-size: 14px; }
	.dev-controls { padding: 12px 5.2vw; }
	.dev-controls label { display: block; margin-block: 10px; }
	@media (max-width: 699px) { .stage { min-height: 480px; } .playback { right: 18px; left: 18px; font-size: 12px; } }
</style>
