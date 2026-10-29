<script lang="ts">
	import type { Client, Domain, Tag } from '$lib/payload-types';
	let { tags = [], domains = [], clients = [], selectedTag = $bindable<string | null>(null), selectedDomain = $bindable<string | null>(null), selectedClient = $bindable<string | null>(null), disabled = false }: {
		tags: Tag[]; domains: Domain[]; clients?: Client[]; selectedTag?: string | null; selectedDomain?: string | null; selectedClient?: string | null; disabled?: boolean;
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
{#if clients.length}
	<label>Company
		<select name="client" bind:value={selectedClient} {disabled}>
			<option value="">All companies</option>
			{#each clients as client (client.id)}<option value={String(client.id)}>{client.title}</option>{/each}
		</select>
	</label>
{/if}

<style>
	label { display: grid; gap: .5rem; font: var(--type-label); color: var(--color-surface-muted); min-width: 0; }
	select { width: 100%; min-height: 44px; padding: .6rem 2rem .6rem .75rem; border: 1px solid var(--color-border-control); border-radius: .4rem; background: var(--color-surface); color: var(--color-surface-text); font: var(--type-control); }
	select:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; }
	select:disabled { opacity: .6; cursor: wait; }
</style>
