import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProjectBySlug } from '$lib/server/payload';

export const load: PageServerLoad = async ({ params }) => {
	const project = await getProjectBySlug(decodeURIComponent(params.slug));
	if (!project) throw error(404, 'Project not found');
	return { project };
};
