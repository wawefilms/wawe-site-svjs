import type { Client, Domain, Project, Tag } from '../payload-types.ts';
import { normalizedMedia, posterURL, type NormalizedMedia } from '../media/normalize.ts';
import { parseProjectQuery, projectQueryParams } from './model.ts';
import { projectCaptionTracks, type CaptionTrack } from '../media/captions.ts';

export type ProjectFetchResult = { status: 'found'; project: Project } | { status: 'missing' | 'unavailable' };
/** Keep CMS failures distinct from a successful empty slug query. */
export async function fetchProjectDetail(base: string, slug: string, request: (url: string) => Promise<Response>): Promise<ProjectFetchResult> {
	try {
		const params = new URLSearchParams({ 'where[slug][equals]': slug, limit: '1', depth: '2' });
		const response = await request(`${base.replace(/\/$/, '')}/api/projects?${params}`);
		if (!response.ok) return { status: 'unavailable' };
		const data: unknown = await response.json();
		if (!data || typeof data !== 'object' || !('docs' in data) || !Array.isArray(data.docs)) return { status: 'unavailable' };
		if (!data.docs.length) return { status: 'missing' };
		const project = data.docs[0] as Project;
		if (!project || typeof project.title !== 'string' || typeof project.slug !== 'string' || typeof project.id !== 'number') return { status: 'unavailable' };
		return { status: 'found', project };
	} catch { return { status: 'unavailable' }; }
}

/** Only a root-relative homepage may restore catalogue state; no open redirects. */
export function projectBackLink(value: string | null, tags: readonly Pick<Tag, 'id'>[], domains: readonly Pick<Domain, 'id'>[]): string {
	if (!value || !/^\/(?:\?|#|$)/.test(value) || /[\\\x00-\x20]/.test(value)) return '/#projects';
	try {
		const url = new URL(value, 'https://wawefilms.com');
		if (url.origin !== 'https://wawefilms.com' || url.pathname !== '/') return '/#projects';
		const params = projectQueryParams(parseProjectQuery(url.searchParams, tags, domains)).toString();
		return `/${params ? `?${params}` : ''}#projects`;
	} catch { return '/#projects'; }
}

export interface DetailMedia { media: NormalizedMedia; poster: string | null; label: string; captions?: CaptionTrack[] }
export function projectDetail(project: Project, clients: readonly Client[] = [], tags: readonly Tag[] = []) {
	const resolve = <T extends { id: number }>(values: (number | T)[] | null | undefined, lookup: readonly T[]) =>
		(values ?? []).flatMap(value => { const item = typeof value === 'object' && value ? value : lookup.find(item => item.id === value); return item ? [item] : []; });
	const extras = (items: Project['partMedia'], prefix: string): DetailMedia[] => (items ?? []).flatMap((item, index) => {
		const media = normalizedMedia(item?.asset);
		const asset = typeof item?.asset === 'object' ? item.asset : null;
		return media.url ? [{ media, poster: null, label: asset?.Title?.trim() || `${prefix} ${index + 1}` }] : [];
	});
	return {
		primary: { media: normalizedMedia(project.video), poster: posterURL(project.poster), label: project.title, captions: projectCaptionTracks(project.slug) },
		clients: resolve(project.clients, clients).filter(client => client.title?.trim()).map(client => client.title),
		tags: resolve(project.tags, tags).filter(tag => tag.tag?.trim()).map(tag => tag.tag),
		extras: extras(project.carouselMedia, 'Additional media'), parts: extras(project.partMedia, 'Part')
	};
}
