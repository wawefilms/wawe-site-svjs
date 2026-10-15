<script lang="ts">
	import { serializeJsonLd, type RouteMetadata } from '$lib/seo/metadata';
	let { meta }: { meta: RouteMetadata } = $props();
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={meta.canonical} />
	<meta name="robots" content={meta.robots} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={meta.canonical} />
	<meta property="og:type" content={meta.type} />
	<meta property="og:site_name" content={meta.siteName} />
	<meta property="og:image" content={meta.image.url} />
	<meta property="og:image:alt" content={meta.image.alt} />
	<meta property="og:image:type" content={meta.image.type} />
	{#if meta.image.width}<meta property="og:image:width" content={String(meta.image.width)} />{/if}
	{#if meta.image.height}<meta property="og:image:height" content={String(meta.image.height)} />{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.image.url} />
	<meta name="twitter:image:alt" content={meta.image.alt} />
	{#each meta.jsonLd as schema}
		{@html `<script type="application/ld+json">${serializeJsonLd(schema)}</script>`}
	{/each}
</svelte:head>
