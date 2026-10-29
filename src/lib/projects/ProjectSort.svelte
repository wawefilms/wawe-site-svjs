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
	label { display: grid; gap: .5rem; font: var(--type-label); color: var(--color-surface-muted); min-width: 0; }
	select { width: 100%; min-height: 44px; padding: .6rem 2rem .6rem .75rem; border: 1px solid var(--color-border-control); border-radius: .4rem; background: var(--color-surface); color: var(--color-surface-text); font: var(--type-control); }
	select:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; }
	select:disabled { opacity: .6; cursor: wait; }
</style>
