import type { Client, Domain, Project, Tag } from '../payload-types.ts';
import { clientLogo } from './client-logos.ts';

/** Structural subset: full Payload Projects can be passed without conversion. */
export type ProjectSummary = Pick<Project,
	'id' | 'slug' | 'title' | 'shortDesc' | 'priority' | 'createdAt' | 'updatedAt' |
	'clients' | 'tags' | 'video' | 'poster'>;
export type ProjectSort = 'highlighted' | 'recent' | 'title';
export interface ProjectQuery {
	view: 'highlighted' | 'all';
	tag: number | null;
	domain: number | null;
	client: number | null;
	sort: ProjectSort;
}
export interface ClientIdentity {
	id: Client['id'];
	title: Client['title'];
	logoUrl: string | null;
}
export interface ProjectIdentity {
	label: string;
	projectSlug: string | null;
	clients: ClientIdentity[];
}


/** The montage is the homepage film, not a second gallery Project. Retain the
 * full catalogue elsewhere for cue/media resolution until CMS removal is verified. */
export function galleryProjects<T extends ProjectSummary>(projects: readonly T[]): T[] {
	return projects.filter(project => project.slug !== 'wawe-films-showreel');
}
/** The montage category is not a gallery filter. Preserve all other tag metadata. */
export function galleryTags<T extends Pick<Tag, 'tag'>>(tags: readonly T[]): T[] {
	return tags.filter(tag => tag.tag.trim().toLowerCase() !== 'showreel');
}
type ClientLookup = Pick<Client, 'id' | 'title' | 'logo' | 'domains'>;
const idOf = (value: number | { id: number }) => typeof value === 'number' ? value : value.id;
function resolveClients(project: ProjectSummary, clients: readonly ClientLookup[]): ClientLookup[] {
	const lookup = new Map(clients.map(client => [client.id, client]));
	const seen = new Set<number>();
	return (project.clients ?? []).flatMap(value => {
		const id = idOf(value);
		if (seen.has(id)) return [];
		seen.add(id);
		const client = lookup.get(id) ?? (typeof value === 'object' ? value : undefined);
		return client ? [client] : [];
	});
}

const textOrder = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const timestamp = (value: string) => { const time = Date.parse(value); return Number.isFinite(time) ? time : -Infinity; };
const priority = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : Infinity;

/** Copy-sort; finite priority (including zero) ascending, newest first, ID then slug. */
export function sortProjects<T extends ProjectSummary>(projects: readonly T[], sort: ProjectSort = 'highlighted'): T[] {
	return [...projects].sort((a, b) => {
		if (sort === 'highlighted') {
			const ap = priority(a.priority), bp = priority(b.priority);
			if (ap !== bp) return ap < bp ? -1 : 1;
		}
		if (sort === 'title') {
			const title = textOrder(a.title.toLowerCase(), b.title.toLowerCase());
			if (title) return title;
		}
		const at = timestamp(a.createdAt), bt = timestamp(b.createdAt);
		if (at !== bt) return at > bt ? -1 : 1;
		return a.id - b.id || textOrder(a.slug, b.slug);
	});
}

/** Tag + Client + Domain intersection; Domain matches any resolved related client. */
export function filterProjects<T extends ProjectSummary>(
	projects: readonly T[], query: Pick<ProjectQuery, 'tag' | 'domain'> & Partial<Pick<ProjectQuery, 'client'>>, clients: readonly ClientLookup[] = []
): T[] {
	return projects.filter(project =>
		(query.tag === null || (project.tags ?? []).some(tag => idOf(tag) === query.tag)) &&
		(query.client == null || (project.clients ?? []).some(client => idOf(client) === query.client)) &&
		(query.domain === null || resolveClients(project, clients).some(client =>
			(client.domains ?? []).some(domain => idOf(domain) === query.domain))));
}

/** Unknown/duplicate/invalid values default harmlessly; valid controls imply the archive. */
export function parseProjectQuery(
	searchParams: URLSearchParams, tags: readonly Pick<Tag, 'id'>[], domains: readonly Pick<Domain, 'id'>[],
	clients: readonly Pick<Client, 'id'>[] = []
): ProjectQuery {
	const single = (key: string) => searchParams.getAll(key).length === 1 ? searchParams.get(key) : null;
	const relationship = (key: string, values: readonly { id: number }[]) => {
		const raw = single(key);
		if (!raw || !/^(0|[1-9]\d*)$/.test(raw)) return null;
		const id = Number(raw);
		return Number.isSafeInteger(id) && values.some(value => value.id === id) ? id : null;
	};
	const tag = relationship('tag', tags), domain = relationship('domain', domains), client = relationship('client', clients);
	const rawSort = single('sort');
	const sort: ProjectSort = rawSort === 'recent' || rawSort === 'title' ? rawSort : 'highlighted';
	return { view: single('view') === 'all' || tag !== null || domain !== null || client !== null || sort !== 'highlighted' ? 'all' : 'highlighted', tag, domain, client, sort };
}

/** Canonical browsing parameters only; caller owns the path and #projects fragment. */
export function projectQueryParams(query: ProjectQuery): URLSearchParams {
	const params = new URLSearchParams();
	if (query.view === 'all' || query.tag !== null || query.domain !== null || query.client !== null || query.sort !== 'highlighted') params.set('view', 'all');
	if (query.tag !== null) params.set('tag', String(query.tag));
	if (query.domain !== null) params.set('domain', String(query.domain));
	if (query.client !== null) params.set('client', String(query.client));
	if (query.sort !== 'highlighted') params.set('sort', query.sort);
	return params;
}

/** No arbitrary primary client: all verified names, safe image logos, honest gap fallback. */
export function projectIdentity(project: ProjectSummary | null | undefined, clients: readonly ClientLookup[] = []): ProjectIdentity {
	if (!project) return { label: 'SHOWREEL', projectSlug: null, clients: [] };
	const identities = resolveClients(project, clients)
		.filter(client => client.title?.trim())
		.map(client => ({ id: client.id, title: client.title, logoUrl: clientLogo(client.title, client.logo) }));
	return {
		label: identities.length ? identities.map(client => client.title).join(' / ') : project.title || 'SHOWREEL',
		projectSlug: project.slug || null,
		clients: identities
	};
}
