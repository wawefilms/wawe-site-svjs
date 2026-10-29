<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Client, Domain, Tag } from '$lib/payload-types';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ProjectFilters from '$lib/components/ProjectFilters.svelte';
	import ProjectSortControl from './ProjectSort.svelte';
	import { filterProjects, sortProjects, parseProjectQuery, projectQueryParams, type ProjectQuery, type ProjectSummary, type ProjectSort } from './model';
	import { createSectionTransition, REORDER_DURATION } from './transitions';

	let { projects, tags, domains, clients, initialQuery, unavailable = false, expandedRequested = false, onquerychange }: {
		projects: ProjectSummary[]; tags: Tag[]; domains: Domain[]; clients: Client[];
		initialQuery: ProjectQuery; unavailable?: boolean; expandedRequested?: boolean;
		onquerychange?: (query: ProjectQuery) => void;
	} = $props();
	let query = $state<ProjectQuery>({ ...untrack(() => initialQuery) });
	let selectedTag = $state<string | null>(untrack(() => initialQuery).tag === null ? '' : String(untrack(() => initialQuery).tag));
	let selectedDomain = $state<string | null>(untrack(() => initialQuery).domain === null ? '' : String(untrack(() => initialQuery).domain));
	let selectedClient = $state<string | null>(untrack(() => initialQuery).client === null ? '' : String(untrack(() => initialQuery).client));
	let selectedSort = $state<ProjectSort>(untrack(() => initialQuery).sort);
	let section: HTMLElement;
	let content: HTMLDivElement;
	let toggle = $state<HTMLAnchorElement>();
	let heading: HTMLHeadingElement;
	let pending = $state(false);
	let reduced = $state(true);
	let mounted = $state(false);
	let generation = 0;
	let transition: ReturnType<typeof createSectionTransition> | undefined;
	const expanded = $derived(query.view === 'all' || projects.length <= 5);
	const visible = $derived(expanded ? sortProjects(filterProjects(projects, query, clients), query.sort) : sortProjects(projects).slice(0, 5));
	const context = $derived(`/${projectQueryParams(query).size ? `?${projectQueryParams(query)}` : ''}#projects`);
	const toggleQuery = $derived<ProjectQuery>(expanded ? { view: 'highlighted', tag: null, domain: null, client: null, sort: 'highlighted' } : { view: 'all', tag: null, domain: null, client: null, sort: 'highlighted' });
	const toggleHref = $derived(`/${projectQueryParams(toggleQuery).size ? `?${projectQueryParams(toggleQuery)}` : ''}#projects`);

	function assign(next: ProjectQuery) {
		query = { ...next };
		selectedTag = next.tag === null ? '' : String(next.tag);
		selectedDomain = next.domain === null ? '' : String(next.domain);
		selectedClient = next.client === null ? '' : String(next.client);
		selectedSort = next.sort;
	}
	function announce(next: ProjectQuery) { onquerychange?.({ ...next }); }
	function keepHeadingVisible() {
		const top = heading.getBoundingClientRect().top;
		const bar = parseFloat(getComputedStyle(section).scrollMarginTop);
		// scrollIntoView honours the shared Projects scroll-margin (including actual bar height).
		if (top < (Number.isFinite(bar) ? bar : 80) || top > window.innerHeight) section.scrollIntoView({ block: 'start', behavior: 'instant' });
	}
	async function change(next: ProjectQuery, writeURL = true) {
		if (pending) return;
		const collapsing = query.view === 'all' && next.view === 'highlighted';
		if (collapsing && section.contains(document.activeElement) && document.activeElement !== toggle && document.activeElement !== heading) toggle?.focus({ preventScroll: true });
		pending = true;
		const version = ++generation;
		try {
			if (transition) await transition.run(() => assign(next), tick, reduced || document.hidden);
			else { assign(next); await tick(); }
			if (version !== generation) return;
			if (writeURL) {
				const url = new URL(page.url);
				for (const key of ['view', 'tag', 'domain', 'client', 'sort']) url.searchParams.delete(key);
				for (const [key, value] of projectQueryParams(next)) url.searchParams.set(key, value);
				url.hash = 'projects';
				// Keep SvelteKit's loaded URL and history in sync for Back/SSR restoration.
				await goto(url, { replaceState: true, noScroll: true, keepFocus: true });
			}
			announce(next);
			if (collapsing) keepHeadingVisible();
		} finally { pending = false; }
	}
	function apply(form: HTMLFormElement) {
		const params = new URLSearchParams();
		for (const [key, value] of new FormData(form)) if (typeof value === 'string') params.append(key, value);
		void change(parseProjectQuery(params, tags, domains, clients));
	}
	function submit(event: SubmitEvent) {
		event.preventDefault();
		apply(event.currentTarget as HTMLFormElement);
	}
	function selectionChanged(event: Event) { apply(event.currentTarget as HTMLFormElement); }
	function toggleView(event: MouseEvent) {
		if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		void change(toggleQuery);
	}

	// Cached loader data can precede the restored browser URL. initialQuery is
	// only the SSR seed; keep controls aligned with the live catalogue query.
	$effect(() => {
		// Read page.url to react to SvelteKit navigation, but cached Page data/URL
		// can precede the history entry. location is authoritative on this browser-only effect.
		page.url;
		const next = parseProjectQuery(new URL(location.href).searchParams, tags, domains, clients);
		untrack(() => {
			if (next.view === query.view && next.tag === query.tag && next.domain === query.domain && next.client === query.client && next.sort === query.sort) return;
			generation++; transition?.finish(); assign(next);
		});
	});
	$effect(() => {
		if (expandedRequested && mounted) untrack(() => {
			if (query.view !== 'all') void change({ ...query, view: 'all' });
		});
	});
	onMount(() => {
		mounted = true;
		const preference = matchMedia('(prefers-reduced-motion: reduce)');
		const motion = () => { reduced = preference.matches; if (reduced) transition?.finish(); };
		motion();
		transition = createSectionTransition(section, content);
		const resize = new ResizeObserver(() => transition?.layoutChanged());
		resize.observe(content);
		const layout = () => transition?.layoutChanged();
		const visibility = () => { if (document.hidden) transition?.finish(); };
		document.addEventListener('visibilitychange', visibility);
		const restore = () => { generation++; transition?.finish(); assign(parseProjectQuery(new URL(location.href).searchParams, tags, domains, clients)); announce(query); };
		window.addEventListener('popstate', restore);
		window.addEventListener('resize', layout);
		preference.addEventListener('change', motion);
		document.fonts?.addEventListener('loadingdone', layout);
		return () => {
			generation++;
			transition?.dispose(); resize.disconnect();
			window.removeEventListener('popstate', restore); window.removeEventListener('resize', layout);
			preference.removeEventListener('change', motion); document.fonts?.removeEventListener('loadingdone', layout);
			document.removeEventListener('visibilitychange', visibility);
		};
	});
</script>

<section id="projects" class="site-container projects" bind:this={section} aria-labelledby="projects-title">
	<div class="projects-content" bind:this={content}>
		<header>
			<div class="heading-copy">
			<h2 id="projects-title" class="site-heading" bind:this={heading} tabindex="-1">{expanded ? 'All Projects' : 'Selected work'}</h2>
			<p class="section-intro">An AI-native production house for brands and agency partners.</p>
			</div>
			{#if projects.length > 5}
				<div class="toggle-row">
					{#if !unavailable}<span class="count" aria-live="polite">{expanded ? `${visible.length} of ${projects.length} projects` : `5 selected · ${projects.length} projects`}</span>{/if}
					<a class="toggle" bind:this={toggle} href={toggleHref} onclick={toggleView} aria-controls="project-grid" aria-expanded={expanded} aria-disabled={pending}>{expanded ? 'Show five highlights' : `View all ${projects.length} projects`}</a>
					{#if expanded}<p>Collapsing resets filters and sorting.</p>{/if}
				</div>
			{/if}
		</header>
		{#if unavailable}
			<p class="empty">Projects are temporarily unavailable. <a href="/contact">Contact us</a> to discuss your film.</p>
		{:else if !projects.length}
			<p class="empty">There are no Projects to show yet. <a href="/contact">Contact us</a>.</p>
		{:else}
			{#if expanded}
				<form method="GET" action="/#projects" onsubmit={submit} onchange={selectionChanged} aria-label="Filter and sort Projects">
					<input type="hidden" name="view" value="all" />
					<ProjectFilters {tags} {domains} {clients} bind:selectedClient bind:selectedTag bind:selectedDomain disabled={pending} />
					<ProjectSortControl bind:value={selectedSort} disabled={pending} />
					{#if !mounted}<button type="submit" disabled={pending}>Apply</button>{/if}
					{#if query.tag !== null || query.domain !== null || query.client !== null}
						<a class="clear" href={`/?${projectQueryParams({ ...query, tag: null, domain: null, client: null })}#projects`} onclick={(event) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void change({ ...query, tag: null, domain: null, client: null }); } }}>Clear filters</a>
					{/if}
				</form>
			{/if}
			<div id="project-grid" class="grid" class:selected={!expanded}>
				{#each visible as project (project.id)}
					<div class="grid-item" data-project-id={project.id} animate:flip={{ duration: reduced ? 0 : REORDER_DURATION, easing: cubicOut }} in:fade={{ duration: reduced ? 0 : 160 }}>
						<ProjectCard {project} returnTo={context} />
					</div>
				{/each}
			</div>
			{#if !visible.length}
				<p class="empty" role="status">No Projects match these filters. Clear the filters to explore the catalogue.</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	.projects { margin-block: var(--section-space); color: var(--color-surface-text); }
	.projects-content { display: flow-root; }
	header { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem 3rem; margin-bottom: clamp(2rem, 4vw, 3rem); }
	h2 { margin: 0; font: var(--type-section-title); text-wrap: balance; }
	.heading-copy { flex: 1 1 22rem; min-width: 0; }
	.section-intro { margin: 1rem 0 0; max-width: 48ch; color: var(--color-surface-muted); font: var(--type-body); }
	.count { color: var(--color-surface-muted); font: var(--type-caption); font-variant-numeric: tabular-nums; white-space: nowrap; padding-bottom: .25rem; }
	form { display: flex; align-items: end; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem; }
	form :global(label) { flex: 1 1 12rem; }
	button, .toggle { min-height: 44px; border: 1px solid var(--color-action); border-radius: .4rem; padding: .75rem 1.25rem; background: var(--color-action); color: var(--color-on-action); font: var(--type-control); text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
	button:disabled, .toggle[aria-disabled='true'] { opacity: .55; cursor: wait; }
	.clear { min-height: 44px; display: inline-flex; align-items: center; color: inherit; font: var(--type-control); }
	.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(2rem, 4vw, 4rem) clamp(1rem, 2vw, 2rem); }
	.grid-item { min-width: 0; }
	.grid.selected { grid-template-columns: repeat(6, minmax(0, 1fr)); }
	.grid.selected .grid-item { grid-column: span 2; }
	.grid.selected .grid-item:nth-child(-n + 2) { grid-column: span 3; }
	.toggle-row { display: grid; justify-items: end; gap: .5rem; flex-shrink: 0; }
	.toggle-row p { font: var(--type-caption); color: var(--color-surface-muted); margin: 0; }
	.empty { color: var(--color-surface-muted); max-width: 65ch; font: var(--type-body); margin: 2rem 0; }
	.empty a { color: var(--color-surface-text); }
	@media (max-width: 1000px) { .grid, .grid.selected { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid.selected .grid-item:nth-child(n) { grid-column: auto; } }
	@media (max-width: 560px) { .grid, .grid.selected { grid-template-columns: minmax(0, 1fr); } header { align-items: start; } .toggle-row { justify-items: start; } .count { padding-top: .5rem; } }
</style>
