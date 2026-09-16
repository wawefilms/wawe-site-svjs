import type { PageServerLoad } from './$types';
import { getProjects, getTags, getClients, getDomains, getShowreel } from '$lib/server/payload';

export const load: PageServerLoad = async () => {
	const [projects, tags, clients, domains, showreel] = await Promise.all([
		getProjects(),
		getTags(),
		getClients(),
		getDomains(),
		getShowreel()
	]);
	return { projects, tags, clients, domains, showreel };
};
