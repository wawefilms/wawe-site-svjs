<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Intro from '$lib/components/Intro.svelte';

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
		if (!document.startViewTransition) return;
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
	<title>WAWE Films</title>
	<meta name="description" content="WAWE Films — Video portfolio" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="WAWE Films" />
	<meta property="og:url" content="https://wawefilms.com" />
	<meta property="og:title" content="WAWE Films" />
	<meta property="og:description" content="WAWE Films — Video portfolio" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="WAWE Films" />
	<meta name="twitter:description" content="WAWE Films — Video portfolio" />
	{@html `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "WAWE Films", url: "https://wawefilms.com" })}</script>`}
</svelte:head>

<div class="min-h-svh flex flex-col bg-white text-black">
	<Intro />
	<Nav />
	<main class="grow relative z-10 flex flex-col pt-[56px]">{@render children()}</main>
	<Footer />
</div>

<style>
	:global(html, body) {
		overflow-anchor: none;
	}
</style>
