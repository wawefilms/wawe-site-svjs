<script lang="ts">
	import { getContext } from 'svelte';
	import type { Client, Domain, Project } from '$lib/payload-types';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ProjectFilters from '$lib/components/ProjectFilters.svelte';
	import LogosStrip from '$lib/components/LogosStrip.svelte';
	import Showreel from '$lib/showreel/Showreel.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// nav theme: dark over hero, light over grid
	const navTheme = getContext<{ current: 'light' | 'dark' }>('nav-theme');
	navTheme.current = 'light';

	let selectedTag: string | null = $state(null);
	let selectedDomain: string | null = $state(null);

	const filtered = $derived.by(() => {
		let list = data.projects as Project[];
		if (selectedTag) {
			list = list.filter((p) => (p.tags ?? []).some((t) => String(typeof t === 'object' ? (t as any).id : t) === selectedTag));
		}
		if (selectedDomain) {
			// domains are via clients -> domains
			list = list.filter((p) => {
				const clients = (p.clients ?? []) as (Client | number)[];
				return clients.some((c) => {
					if (typeof c === 'number') return false;
					const domains = (c.domains ?? []) as (Domain | number)[];
					return domains.some((d) => String(typeof d === 'object' ? (d as Domain).id : d) === selectedDomain);
				});
			});
		}
		return list;
	});
</script>

<svelte:head>
	<title>WAWE Films — Projects</title>
	<meta name="description" content="Video portfolio — selected projects by WAWE Films." />
</svelte:head>
<!-- Landing intro mount point: interactive melt-showreel (docs/showreel-plan.md).
     Full-bleed like the reference; tiles = real Payload projects, showreel
     tile centred and playing the CMS showreel video. -->
<section class="w-full">
	<div
		id="showreel-mount"
		class="h-[calc(100svh-56px)] min-h-[520px] w-full overflow-hidden bg-white"
	>
		<Showreel
			projects={filtered}
			videoUrls={filtered.slice(0, 12).map((p) => {
				const v = p.video as { url?: string; smallFile?: { url?: string } | null } | null;
				return v?.smallFile?.url ?? v?.url ?? '';
			}).filter(Boolean)}
		/>
	</div>
</section>

<section class="mx-auto max-w-6xl px-6 pb-16 pt-10">
	<p class="max-w-2xl text-balance text-2xl font-light leading-tight tracking-tight sm:text-3xl">
		We craft films that move — commercials, documentaries, and branded stories for ambitious clients.
	</p>
</section>

<section class="mx-auto max-w-6xl px-6 pb-16">
	<div class="mb-6 flex flex-col gap-4">
		<h2 class="text-sm font-semibold uppercase tracking-widest text-neutral-500">Projects</h2>
		<ProjectFilters tags={data.tags} domains={data.domains} bind:selectedTag bind:selectedDomain />
		<p class="text-sm text-neutral-500">{filtered.length} / {data.projects.length} projects</p>
	</div>

	{#if filtered.length === 0}
		<p class="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">
			No projects match the selected filters.
		</p>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each filtered as project (project.id)}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</section>

<LogosStrip clients={data.clients} />
