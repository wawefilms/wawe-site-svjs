<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	const navTheme = $state<{ current: 'light' | 'dark' }>({ current: 'light' });
	setContext('nav-theme', navTheme);

	const intro = $state<{ playing: boolean; done: boolean; revealed: boolean }>({
		playing: false,
		done: false,
		revealed: false
	});
	setContext('intro', intro);

	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			// @ts-ignore
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<meta name="theme-color" content="#040e19" />
</svelte:head>

<div class="site-shell flex flex-col">
	<a class="skip-link" href="#main-content">Skip to content</a>
	{#if page.url.pathname !== '/'}<Nav />{/if}
	<main id="main-content" class="grow flex flex-col" tabindex="-1">{@render children()}</main>
	<Footer />
</div>

<style>
	.skip-link { position: fixed; top: .5rem; left: var(--site-gutter); z-index: 100; padding: .75rem 1rem; background: var(--color-paper); color: var(--color-midnight); transform: translateY(-200%); }
	.skip-link:focus { transform: translateY(0); }
	:global(body) { margin: 0; background: var(--color-midnight); }
</style>
