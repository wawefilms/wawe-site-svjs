<script lang="ts">
	import type { DetailMedia } from '$lib/projects/detail';
	import { safeCaptionTracks } from '$lib/media/captions';
	let { item, primary = false }: { item: DetailMedia; primary?: boolean } = $props();
	let failed = $state(false);
	let measuredRatio = $state<string | null>(null);
	const ratio = $derived(item.media.width && item.media.height ? `${item.media.width} / ${item.media.height}` : measuredRatio ?? '16 / 9');
	$effect(() => { item; failed = false; measuredRatio = null; });
</script>

<div class="project-media" style:aspect-ratio={ratio}>
	{#if item.media.videoUrl && !failed}
		<video controls playsinline preload={primary ? 'metadata' : 'none'} poster={item.poster ?? undefined} aria-label={item.label}
			onerror={() => failed = true}
			onloadedmetadata={(event) => { const video = event.currentTarget; if (video.videoWidth && video.videoHeight) measuredRatio = `${video.videoWidth} / ${video.videoHeight}`; }}>
			{#each item.media.sources as source}<source src={source} />{/each}
			{#each safeCaptionTracks(item.captions ?? []) as track (track.src)}
				<track kind={track.kind} src={track.src} srclang={track.srclang} label={track.label} default={track.default} />
			{/each}
			Your browser does not support this video.
		</video>
	{:else if item.media.imageUrl && !failed}
		<img src={item.media.imageUrl} alt={item.media.alt || item.label} width={item.media.width ?? undefined} height={item.media.height ?? undefined} loading={primary ? 'eager' : 'lazy'} onerror={() => failed = true} />
	{:else}
		<div class="media-unavailable">
			<p>{item.media.videoUrl ? 'This film is unavailable right now.' : 'Media is not available for this Project.'}</p>
			{#if item.media.videoUrl}<a href={item.media.videoUrl}>Open film directly</a>{/if}
		</div>
	{/if}
</div>

<style>
	.project-media { overflow: hidden; border-radius: var(--media-radius, 14px); background: #000; width: 100%; }
	video, img { display: block; width: 100%; height: 100%; object-fit: contain; }
	.media-unavailable { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 12rem; height: 100%; gap: 1rem; padding: 1.5rem; text-align: center; color: var(--color-paper); }
	.media-unavailable a { text-decoration: underline; text-underline-offset: .2em; }
</style>
