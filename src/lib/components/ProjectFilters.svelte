<script lang="ts">
	import type { Domain, Tag } from '$lib/payload-types';
	let { tags = [], domains = [], selectedTag = $bindable<string | null>(null), selectedDomain = $bindable<string | null>(null), disabled = false }: {
		tags: Tag[]; domains: Domain[]; selectedTag?: string | null; selectedDomain?: string | null; disabled?: boolean;
	} = $props();
</script>

{#if tags.length}
	<label>Tag
		<select name="tag" bind:value={selectedTag} {disabled}>
			<option value="">All tags</option>
			{#each tags as tag (tag.id)}<option value={String(tag.id)}>{tag.tag}</option>{/each}
		</select>
	</label>
{/if}
{#if domains.length}
	<label>Domain
		<select name="domain" bind:value={selectedDomain} {disabled}>
			<option value="">All domains</option>
			{#each domains as domain (domain.id)}<option value={String(domain.id)}>{domain.domain}</option>{/each}
		</select>
	</label>
{/if}

<style>
	label { display: grid; gap: .5rem; font-size: .875rem; color: var(--color-surface-muted); min-width: 0; }
	select { width: 100%; min-height: 44px; padding: .6rem 2rem .6rem .75rem; border: 1px solid color-mix(in srgb, var(--color-paper) 35%, transparent); border-radius: .4rem; background: var(--color-midnight); color: var(--color-paper); font: inherit; font-size: 1rem; }
	select:focus-visible { outline: 2px solid var(--color-paper); outline-offset: 4px; }
	select:disabled { opacity: .6; cursor: wait; }
</style>
