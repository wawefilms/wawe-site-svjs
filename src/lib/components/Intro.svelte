<script lang="ts">
	import { getContext, onMount } from 'svelte';

	type IntroCtx = { playing: boolean; done: boolean; revealed: boolean };
	const intro = getContext<IntroCtx>('intro');

	// Synchronous skip — must happen before first paint if already done or reduced motion
	const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let booted = $state(intro.done || prefersReduced);

	function skip() {
		intro.done = true;
		intro.revealed = true;
		intro.playing = false;
		booted = true;
	}

	// Synchronous check in component init
	if (intro.done || prefersReduced) {
		skip();
	}

	onMount(() => {
		if (intro.done || prefersReduced) return;
		intro.playing = true;
		// Low-weight text pretext sweep — 1.8s then reveal handoff; tail keeps showreel gate
		const revealT = setTimeout(() => {
			intro.revealed = true;
		}, 1200);
		const doneT = setTimeout(() => {
			booted = true;
			intro.done = true;
			intro.playing = false;
		}, 1800);
		return () => {
			clearTimeout(revealT);
			clearTimeout(doneT);
		};
	});
</script>

{#if !booted}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-white">
		<p class="animate-pulse text-center text-lg font-light tracking-tight">WAWE Films</p>
	</div>
{/if}

{#if intro.revealed}
	<!-- handoff marker: showreel mount observes intro.revealed -->
	<span class="hidden" data-intro-revealed></span>
{/if}
