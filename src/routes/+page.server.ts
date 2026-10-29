import type { PageServerLoad } from './$types';
import { getProjectCatalogue, getTags, getClients, getDomains, getShowreel } from '$lib/server/payload';
import { galleryTags, parseProjectQuery } from '$lib/projects/model';

export const load: PageServerLoad = async ({ url }) => {
	const [projects, allTags, clients, domains, showreel] = await Promise.all([
		getProjectCatalogue(),
		getTags(),
		getClients(),
		getDomains(),
		getShowreel()
	]);
	const tags = galleryTags(allTags);
	return { projects: projects.projects, projectsUnavailable: projects.unavailable, tags, clients, domains, showreel,
		initialQuery: parseProjectQuery(url.searchParams, tags, domains, clients) };
};
