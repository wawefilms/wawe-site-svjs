import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { getClients, getTags, getDomains } from '$lib/server/payload';
import { fetchCMS } from '$lib/server/cms-fetch';
import { projectSafeHtml } from '$lib/server/richtext';
import { fetchProjectDetail, projectBackLink, projectDetail } from '$lib/projects/detail';

export const load: PageServerLoad = async ({ params, url }) => {
	// SvelteKit already decodes route params; decoding again breaks literal percent slugs.
	const result = await fetchProjectDetail(env.PAYLOAD_API_URL ?? 'http://localhost:3000', params.slug, fetchCMS);
	if (result.status === 'missing') error(404, 'Project not found');
	if (result.status === 'unavailable') error(503, 'Projects are temporarily unavailable. Please try again.');
	if (result.status !== 'found') error(503, 'Projects are temporarily unavailable.');
	const [clients, tags, domains] = await Promise.all([getClients(), getTags(), getDomains()]);
	const project = result.project;
	return {
		project,
		safeHtml: projectSafeHtml(project),
		detail: projectDetail(project, clients, tags),
		backHref: projectBackLink(url.searchParams.get('returnTo'), tags, domains, clients)
	};
};
