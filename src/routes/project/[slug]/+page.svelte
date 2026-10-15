<script lang="ts">
	import type { PageProps } from './$types';
	import ProjectMedia from '$lib/components/ProjectMedia.svelte';
	import ContactCta from '$lib/components/ContactCta.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { projectMetadata } from '$lib/seo/metadata';
	let { data }: PageProps = $props();
</script>

<Seo meta={projectMetadata(data.project, data.site.siteURL, data.site)} />
<article class="site-container project-detail">
	<a href={data.backHref} class="back-link">Back to Projects</a>
	<ProjectMedia item={data.detail.primary} primary />
	<header class="project-header">
		<h1 class="site-heading">{data.project.title}</h1>
		{#if data.detail.clients.length}<p class="clients">{data.detail.clients.join(' / ')}</p>{/if}
		{#if data.project.shortDesc}<p class="description">{data.project.shortDesc}</p>{/if}
		{#if data.detail.tags.length}<ul class="tags" aria-label="Project tags">{#each data.detail.tags as tag}<li>{tag}</li>{/each}</ul>{/if}
	</header>
	{#if data.safeHtml}<div class="project-copy">{@html data.safeHtml}</div>{/if}
	{#if data.detail.extras.length}
		<section class="additional" aria-labelledby="additional-title">
			<h2 id="additional-title" class="site-heading">More from this Project</h2>
			<div class="media-grid">{#each data.detail.extras as item}<figure><ProjectMedia {item} /><figcaption>{item.label}</figcaption></figure>{/each}</div>
		</section>
	{/if}
	{#if data.detail.parts.length}
		<section class="additional" aria-labelledby="parts-title">
			<h2 id="parts-title" class="site-heading">Parts</h2>
			<div class="parts">{#each data.detail.parts as item}<figure><ProjectMedia {item} /><figcaption>{item.label}</figcaption></figure>{/each}</div>
		</section>
	{/if}
	<a href={data.backHref} class="back-link closing-back">Explore Projects</a>
</article>
<ContactCta projectSlug={data.project.slug} />

<style>
	.project-detail { padding-top: clamp(1.5rem, 4vw, 4rem); }
	.back-link { display: inline-flex; align-items: center; min-height: 44px; margin-bottom: 1.5rem; text-decoration: underline; text-underline-offset: .25em; }
	.project-header { padding-top: clamp(2rem, 5vw, 4rem); max-width: 75ch; }
	h1 { font-size: clamp(2.75rem, 7vw, 6rem); line-height: 1; overflow-wrap: anywhere; text-wrap: balance; }
	.clients { margin-top: 1.5rem; font-size: clamp(1.125rem, 2vw, 1.5rem); }
	.description { margin-top: 1.5rem; font-size: 1.125rem; line-height: 1.7; }
	.tags { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; padding: 0; margin-top: 1.5rem; list-style: none; color: var(--color-surface-muted); }
	.project-copy { max-width: 75ch; margin-top: clamp(2rem, 5vw, 4rem); line-height: 1.75; overflow-wrap: anywhere; }
	.project-copy :global(p), .project-copy :global(ul), .project-copy :global(ol), .project-copy :global(blockquote) { margin-block: 1rem; }
	.project-copy :global(ul) { list-style: disc; padding-left: 1.5rem; }
	.project-copy :global(ol) { list-style: decimal; padding-left: 1.5rem; }
	.project-copy :global(h2), .project-copy :global(h3), .project-copy :global(h4) { font-family: var(--font-heading); font-size: 2rem; line-height: 1.2; margin: 2rem 0 1rem; }
	.project-copy :global(a) { text-decoration: underline; text-underline-offset: .25em; }
	.project-copy :global(img) { max-width: 100%; height: auto; border-radius: var(--media-radius, 14px); }
	.project-copy :global(pre) { overflow-x: auto; }
	.additional { margin-top: var(--section-space); }
	h2 { font-size: clamp(2rem, 4vw, 3.5rem); margin-bottom: 1.5rem; }
	.media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
	.parts { display: grid; gap: 3rem; max-width: 65rem; }
	figcaption { margin-top: .75rem; color: var(--color-surface-muted); }
	.closing-back { margin-top: 3rem; margin-bottom: 0; }
	@media (max-width: 600px) { .media-grid { grid-template-columns: 1fr; } }
</style>
