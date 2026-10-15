<script lang="ts">
	import { onMount } from 'svelte';
	import type { mountIntro } from './intro-runtime';
	let { video, host }: { video: HTMLVideoElement; host: HTMLElement } = $props();
	let water: HTMLCanvasElement, logo: HTMLCanvasElement, reveal: HTMLCanvasElement;
	let viewport: HTMLDivElement;
	let active = $state(false);
	let runtime: ReturnType<typeof mountIntro> | undefined;
	onMount(() => {
		let destroyed = false;
		void import('./intro-runtime').then(({ mountIntro }) => {
			if (destroyed) return;
			runtime = mountIntro({ host: viewport, video, water, logo, reveal,
				onopening() { if (!destroyed) active = true; },
				onfinish() { active = false; }
			});
		}).catch(() => { active = false; });
		return () => { destroyed = true; runtime?.dispose(); };
	});
</script>

<!-- Invisible in SSR; the real player is never replaced by this enhancement. -->
<div class="intro" class:active bind:this={viewport} aria-hidden={!active}>
	<div class="paint" aria-hidden="true">
		<canvas bind:this={reveal}></canvas>
		<canvas bind:this={logo}></canvas>
		<canvas bind:this={water}></canvas>
	</div>
	{#if active}<button onclick={() => { runtime?.skip(); (host.querySelector<HTMLButtonElement>('.film-toggle') ?? video).focus({ preventScroll: true }); }}>Skip animation</button>{/if}
</div>

<style>
	@font-face { font-family: Plex; src: url('/fonts/ibm-plex-mono.woff2') format('woff2'); font-display: swap; }
	.intro { position: fixed; inset: 0; width: 100%; height: 100dvh; z-index: 100; visibility: hidden; pointer-events: none; background: var(--color-ink); }
	.intro.active { visibility: visible; }
	.paint, canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
	.paint :global(canvas[hidden]) { display: none; }
	button { position: absolute; top: max(1rem, env(safe-area-inset-top)); right: max(1rem, env(safe-area-inset-right)); pointer-events: auto; min-height: 44px; padding: .65rem 1rem; background: var(--color-ink); color: var(--color-paper); border: 1px solid currentColor; border-radius: .4rem; font: inherit; cursor: pointer; }
	button:focus-visible { outline: 2px solid var(--color-paper); outline-offset: 4px; }
	@media (prefers-reduced-motion: reduce) { .intro.active { visibility: hidden; } }
</style>
