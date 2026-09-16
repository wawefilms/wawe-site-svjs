<script lang="ts">
	import type { Client, Media } from '$lib/payload-types';
	let { clients }: { clients: Client[] } = $props();
</script>

{#if clients.length}
	<section class="border-y border-neutral-200 bg-white py-8">
		<p class="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">Trusted by</p>
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-6 opacity-70">
			{#each clients as c (c.id)}
				{@const logo = c.logo as Media | null}
				{@const url = (logo as unknown as { url?: string })?.url}
				{#if url}
					<img src={url} alt={c.title} class="h-8 w-auto object-contain grayscale" loading="lazy" />
				{:else}
					<span class="text-sm font-medium">{c.title}</span>
				{/if}
			{/each}
		</div>
	</section>
{/if}
