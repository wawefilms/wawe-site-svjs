<script lang="ts">
	import ShowreelHero from '$lib/home/ShowreelHero.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import ProjectBrowser from '$lib/projects/ProjectBrowser.svelte';
	import ContactCta from '$lib/components/ContactCta.svelte';
	import { galleryProjects, projectIdentity, type ProjectSummary, type ProjectQuery } from '$lib/projects/model';
	import Seo from '$lib/components/Seo.svelte';
	import { homeMetadata } from '$lib/seo/metadata';
	import { clientLogo, officialClientLogo } from '$lib/projects/client-logos';
	import badge from '$lib/landing/assets/badge-mask.png';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let activeProject = $state<ProjectSummary | null>(null);
	let expandedRequested = $state(false);
	let filmRatio = $state(16 / 9);
	const identity = $derived(projectIdentity(activeProject, data.clients));
	const catalogue = $derived(galleryProjects(data.projects));
	const artworks = $derived([{ src: badge }, ...data.clients.flatMap(client => {
		const src = clientLogo(client.title, client.logo);
		return src ? [{ src, fallback: officialClientLogo(client.title) ?? undefined }] : [];
	})]);
	function changed(_query: ProjectQuery) { expandedRequested = false; }
</script>

<svelte:head>
	<link rel="preload" href="/fonts/ArchivoNarrow-Variable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<Seo meta={homeMetadata(catalogue, data.site.siteURL, data.site)} />
<h1 class="sr-only">WAWE Films — Projects and Showreel</h1>
<div class="home-composition" style:--film-ratio={filmRatio}>
	<ShowreelHero showreel={data.showreel} projects={data.projects} {artworks} onactiveproject={(project) => activeProject = project} onratiochange={(ratio) => filmRatio = ratio} />
	<Nav homepage activeIdentity={identity} onprojectsrequest={() => expandedRequested = true} />
	<div class="opening-breathing-room" aria-hidden="true"></div>
	<ProjectBrowser projects={catalogue} tags={data.tags} domains={data.domains} clients={data.clients}
		initialQuery={data.initialQuery} unavailable={data.projectsUnavailable} {expandedRequested} onquerychange={changed} />
	<ContactCta />
</div>

<style>
	.home-composition { --opening-gap: clamp(1.25rem, 2.5vw, 2rem); }
	.opening-breathing-room { height: var(--opening-gap); }
	@media (min-width: 900px) and (min-height: 600px) {
		.home-composition { --site-width: min(112rem, calc((100svh - var(--bar-height) - var(--opening-gap)) * var(--film-ratio))); }
	}
</style>
