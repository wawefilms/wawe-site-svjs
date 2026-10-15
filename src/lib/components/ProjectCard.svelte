<script lang="ts">
	import type { ProjectSummary } from '$lib/projects/model';
	import { normalizedMedia } from '$lib/media/normalize';
	let { project, returnTo = '/#projects' }: { project: ProjectSummary; returnTo?: string } = $props();
	const poster = $derived(normalizedMedia(project.poster));
	const image = $derived(poster.imageUrl ? poster : normalizedMedia(project.video));
	let failed = $state(false);
	$effect(() => { image.imageUrl; failed = false; });
	const href = $derived(`/project/${encodeURIComponent(project.slug)}?${new URLSearchParams({ returnTo })}`);
</script>

<a {href} class="project-card">
	<div class="preview">
		{#if image.imageUrl && !failed}
			<img src={image.imageUrl} alt="" loading="lazy" decoding="async" width={image.width ?? undefined} height={image.height ?? undefined} onerror={() => failed = true} />
		{:else}
			<span class="no-preview">Preview unavailable</span>
		{/if}
	</div>
	<h3>{project.title}</h3>
	{#if project.shortDesc}<p>{project.shortDesc}</p>{/if}
</a>

<style>
	.project-card { display: block; color: var(--color-surface-text); text-decoration: none; min-width: 0; }
	.preview { aspect-ratio: 16 / 9; border-radius: var(--film-radius, 1rem); overflow: hidden; background: color-mix(in srgb, var(--color-paper) 8%, var(--color-midnight)); display: grid; place-items: center; }
	img { width: 100%; height: 100%; object-fit: contain; }
	.no-preview { color: var(--color-surface-muted); font-size: .875rem; }
	h3 { font-family: var(--font-heading); font-size: clamp(1.5rem, 2.2vw, 2rem); line-height: 1.12; margin: 1rem 0 .45rem; overflow-wrap: anywhere; }
	p { color: var(--color-surface-muted); font-size: .95rem; line-height: 1.5; margin: 0; max-width: 65ch; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	a:focus-visible { outline: 2px solid var(--color-paper); outline-offset: 6px; border-radius: var(--film-radius); }
	@media (hover: hover) and (pointer: fine) { a:hover h3 { text-decoration: underline; text-underline-offset: .2em; } }
</style>
