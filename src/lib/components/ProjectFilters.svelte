<script lang="ts">
	import type { Domain, Tag } from '$lib/payload-types';

	let {
		tags = [],
		domains = [],
		selectedTag = $bindable<string | null>(null),
		selectedDomain = $bindable<string | null>(null)
	}: {
		tags: Tag[];
		domains: Domain[];
		selectedTag: string | null;
		selectedDomain: string | null;
	} = $props();

	function toggleTag(id: string) {
		selectedTag = selectedTag === id ? null : id;
	}
	function toggleDomain(id: string) {
		selectedDomain = selectedDomain === id ? null : id;
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<div class="flex flex-wrap gap-2">
		<button
			class="rounded-full border px-3 py-1.5 text-sm transition"
			class:bg-black={selectedTag === null && selectedDomain === null}
			class:text-white={selectedTag === null && selectedDomain === null}
			class:bg-white={!(selectedTag === null && selectedDomain === null)}
			class:border-neutral-300={!(selectedTag === null && selectedDomain === null)}
			onclick={() => {
				selectedTag = null;
				selectedDomain = null;
			}}>All</button
		>
		{#each tags as tag (tag.id)}
			<button
				class="rounded-full border px-3 py-1.5 text-sm transition"
				class:bg-black={selectedTag === String(tag.id)}
				class:text-white={selectedTag === String(tag.id)}
				class:bg-white={selectedTag !== String(tag.id)}
				class:border-neutral-300={selectedTag !== String(tag.id)}
				onclick={() => toggleTag(String(tag.id))}>{tag.tag}</button
			>
		{/each}
	</div>
	{#if domains.length}
		<span class="hidden h-6 w-px bg-neutral-200 sm:block"></span>
		<div class="flex flex-wrap gap-2">
			{#each domains as d (d.id)}
				<button
					class="rounded-full border px-3 py-1.5 text-sm transition"
					class:bg-black={selectedDomain === String(d.id)}
					class:text-white={selectedDomain === String(d.id)}
					class:bg-white={selectedDomain !== String(d.id)}
					class:border-neutral-300={selectedDomain !== String(d.id)}
					onclick={() => toggleDomain(String(d.id))}>{d.domain}</button
				>
			{/each}
		</div>
	{/if}
</div>
