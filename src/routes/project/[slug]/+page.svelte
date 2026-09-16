<script lang="ts">
	import type { Media } from '$lib/payload-types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const project = $derived(data.project);
	const poster = $derived(project.poster as Media | null);
	const video = $derived(project.video as Media | null);

	const heroUrl = $derived(
		(video as unknown as { url?: string })?.url ??
			(poster as unknown as { url?: string })?.url ??
			null
	);
	const aspect = $derived(
		video?.width && video?.height
			? `${video.width} / ${video.height}`
			: poster?.width && poster?.height
				? `${poster.width} / ${poster.height}`
				: '16 / 9'
	);
</script>

<svelte:head>
	<title>{project.title} — WAWE Films</title>
	<meta name="description" content={project.shortDesc} />
	<meta property="og:title" content={project.title} />
	<meta property="og:description" content={project.shortDesc} />
	{#if heroUrl}<meta property="og:image" content={heroUrl} />{/if}
</svelte:head>

<article class="mx-auto max-w-5xl px-6 py-8">
	<a href="/" class="mb-6 inline-block text-sm text-neutral-500 hover:text-black">← Back to projects</a>

	<div
		class="overflow-hidden rounded-2xl bg-black"
		style="view-transition-name: project-{project.slug}; aspect-ratio: {aspect}"
	>
		{#if heroUrl}
			<video
				src={heroUrl}
				controls
				playsinline
				preload="metadata"
				class="h-full w-full object-contain"
			></video>
		{:else}
			<div class="flex h-full items-center justify-center text-white/60">No media</div>
		{/if}
	</div>

	<h1 class="mt-6 text-3xl font-semibold tracking-tight">{project.title}</h1>
	<p class="mt-2 max-w-2xl text-neutral-600">{project.shortDesc}</p>

	{#if project.content_html}
		<div class="prose prose-neutral mt-8 max-w-none">
			{@html project.content_html}
		</div>
	{/if}

	{#if project.carouselMedia?.length}
		<h2 class="mt-10 text-sm font-semibold uppercase tracking-widest text-neutral-500">Carousel</h2>
		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each project.carouselMedia as item (item.id)}
				{@const m = item.asset as Media}
				{@const url = (m as unknown as { url?: string })?.url}
				{#if url}
					<div class="overflow-hidden rounded-xl bg-neutral-100" style="aspect-ratio: {m.width && m.height ? `${m.width}/${m.height}` : '16/9'}">
						{#if url.endsWith('.mp4') || url.endsWith('.webm')}
							<video src={url} controls muted playsinline preload="metadata" class="h-full w-full object-cover"></video>
						{:else}
							<img src={url} alt={m.alt ?? ''} class="h-full w-full object-cover" />
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	{#if project.partMedia?.length}
		<h2 class="mt-10 text-sm font-semibold uppercase tracking-widest text-neutral-500">Parts</h2>
		<div class="mt-4 grid grid-cols-1 gap-4">
			{#each project.partMedia as item (item.id)}
				{@const m = item.asset as Media}
				{@const url = (m as unknown as { url?: string })?.url}
				{#if url}
					<div class="overflow-hidden rounded-xl bg-black" style="aspect-ratio: {m.width && m.height ? `${m.width}/${m.height}` : '16/9'}">
						<video src={url} controls playsinline preload="metadata" class="h-full w-full object-contain"></video>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</article>
