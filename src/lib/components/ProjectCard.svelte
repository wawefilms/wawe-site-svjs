<script lang="ts">
	import type { Media, Project } from '$lib/payload-types';

	let { project }: { project: Project } = $props();

	const poster = $derived(project.poster as Media | null);
	const video = $derived(project.video as Media | null);

	// Prefer poster, fallback to video for aspect; layout is stable via CSS aspect-ratio
	const mediaForRatio: Media | null = $derived(poster ?? video);
	const aspect = $derived(
		mediaForRatio?.width && mediaForRatio?.height
			? `${mediaForRatio.width} / ${mediaForRatio.height}`
			: '16 / 9'
	);

	const posterUrl: string | null = $derived(
		(poster as unknown as { url?: string })?.url ??
			(video as unknown as { url?: string })?.url ??
			null
	);
	const isVideoPoster = $derived(
		(poster as unknown as { mimeType?: string })?.mimeType?.startsWith('video') ||
			(poster as unknown as { mime_type?: string })?.mime_type?.startsWith('video') ||
			posterUrl?.endsWith('.mp4') ||
			posterUrl?.endsWith('.webm') ||
			false
	);
</script>

<a
	href={`/project/${project.slug}`}
	class="group block overflow-hidden rounded-xl bg-neutral-100"
	style="view-transition-name: project-{project.slug}"
>
	<div
		class="relative w-full overflow-hidden bg-neutral-200"
		style="aspect-ratio: {aspect}"
	>
		{#if posterUrl}
			{#if isVideoPoster}
				<video
					src={posterUrl}
					muted
					loop
					playsinline
					preload="metadata"
					class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
				></video>
			{:else}
				<img
					src={posterUrl}
					alt={poster?.alt ?? project.title}
					loading="lazy"
					class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
				/>
			{/if}
		{:else}
			<div class="flex h-full w-full items-center justify-center text-sm text-neutral-400">
				No preview
			</div>
		{/if}
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
		></div>
	</div>
	<div class="p-3">
		<h3 class="line-clamp-1 text-[15px] font-medium leading-tight">{project.title}</h3>
		{#if project.shortDesc}
			<p class="mt-1 line-clamp-2 text-sm text-neutral-600">{project.shortDesc}</p>
		{/if}
	</div>
</a>
