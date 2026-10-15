<script lang="ts">
	import type { ProjectSort } from './model';
	let { value = $bindable<ProjectSort>('highlighted'), disabled = false }: { value?: ProjectSort; disabled?: boolean } = $props();
</script>

<label>Sort by
	<select name="sort" bind:value {disabled}>
		<option value="highlighted">Highlighted</option>
		<option value="recent">Recently added</option>
		<option value="title">Title A–Z</option>
	</select>
</label>

<style>
	label { display: grid; gap: .5rem; font-size: .875rem; color: var(--color-surface-muted); min-width: 0; }
	select { width: 100%; min-height: 44px; padding: .6rem 2rem .6rem .75rem; border: 1px solid color-mix(in srgb, var(--color-paper) 35%, transparent); border-radius: .4rem; background: var(--color-midnight); color: var(--color-paper); font: inherit; font-size: 1rem; }
	select:focus-visible { outline: 2px solid var(--color-paper); outline-offset: 4px; }
	select:disabled { opacity: .6; cursor: wait; }
</style>
