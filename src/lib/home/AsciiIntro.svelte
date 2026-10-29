<script lang="ts">
	import { onMount } from 'svelte';
	import type { mountIntro } from './intro-runtime';
	import type { Artwork } from './readiness';
	let { video, host, artworks = [] }: { video: HTMLVideoElement; host: HTMLElement; artworks?: readonly Artwork[] } = $props();
	let water: HTMLCanvasElement, logo: HTMLCanvasElement, reveal: HTMLCanvasElement;
	let viewport: HTMLDivElement;
	let active = $state(false);
	let runtime: ReturnType<typeof mountIntro> | undefined;
	onMount(() => {
		let destroyed = false;
		void import('./intro-runtime').then(({ mountIntro }) => {
			if (destroyed) return;
			runtime = mountIntro({ host: viewport, video, water, logo, reveal, artworks,
				onopening() { if (!destroyed) active = true; },
				onfinish() { active = false; }
			});
		}).catch(() => { active = false; });
		return () => { destroyed = true; runtime?.dispose(); };
	});
	function escape(event: KeyboardEvent) {
		if (active && event.key === 'Escape') {
			runtime?.skip(); (host.querySelector<HTMLButtonElement>('.film-toggle') ?? video).focus({ preventScroll: true });
		}
	}
</script>

<svelte:window onkeydown={escape} />
<!-- Invisible in SSR; the real player is never replaced by this enhancement. -->
<div class="intro" class:active bind:this={viewport} aria-hidden={!active}>
	<div class="paint" aria-hidden="true">
		<canvas bind:this={reveal}></canvas>
		<canvas bind:this={logo}></canvas>
		<canvas bind:this={water}></canvas>
	</div>
	{#if active}<span class="sr-only" role="status">Preparing the showreel and client logos. Press Escape to continue.</span>{/if}
</div>

<style>
	@font-face { font-family: Plex; src: url('/fonts/ibm-plex-mono.woff2') format('woff2'); font-display: swap; }
	.intro { position: fixed; inset: 0; width: 100%; height: 100dvh; z-index: 100; visibility: hidden; opacity: 0; transition: opacity 180ms ease-out, visibility 0s 180ms; pointer-events: none; background: var(--color-ink); }
	.intro.active { visibility: visible; opacity: 1; transition-delay: 0s; }
	.paint, canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
	.paint :global(canvas[hidden]) { display: none; }
	@media (prefers-reduced-motion: reduce) { .intro.active { visibility: hidden; } }
</style>
