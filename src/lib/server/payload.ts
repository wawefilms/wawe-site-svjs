import { env } from '$env/dynamic/private';
import type { Client, Domain, Media, Project, Tag } from '../payload-types';

const API = env.PAYLOAD_API_URL ?? 'http://localhost:3000';

function api(path: string) {
	return `${API}/api${path}`;
}

export async function getProjects(): Promise<Project[]> {
	try {
		const res = await fetch(api('/projects?limit=999&depth=2'), {
			// Cache per request (SvelteKit load reuses server response before hydration)
			// Production pages will revalidate per deploy + CF purge hook.
		});
		if (!res.ok) {
			console.warn('Failed to fetch projects from Payload REST', res.status);
			return [];
		}
		const data = (await res.json()) as { docs?: Project[] };
		let docs: Project[] = data.docs ?? [];

		// Sort by priority (lowest-first per collection description), then newest
		docs.sort((a, b) => {
			const aP = a.priority ?? Infinity;
			const bP = b.priority ?? Infinity;
			if (aP !== bP) return aP - bP;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
		return docs;
	} catch (err) {
		console.error('Error fetching projects via REST:', err);
		return [];
	}
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
	try {
		const res = await fetch(
			api(`/projects?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=2`)
		);
		if (!res.ok) {
			console.warn(`Failed to fetch project with slug: ${slug}`, res.status);
			return null;
		}
		const data = (await res.json()) as { docs?: Project[] };
		return data.docs?.[0] ?? null;
	} catch (err) {
		console.error(`Error fetching project ${slug} via REST:`, err);
		return null;
	}
}

export async function getClients(): Promise<Client[]> {
	try {
		const res = await fetch(api('/clients?limit=999&depth=1'));
		if (!res.ok) return [];
		const data = (await res.json()) as { docs?: Client[] };
		return data.docs ?? [];
	} catch {
		return [];
	}
}

export async function getTags(): Promise<Tag[]> {
	try {
		const res = await fetch(api('/tags?limit=999'));
		if (!res.ok) return [];
		const data = (await res.json()) as { docs?: Tag[] };
		return data.docs ?? [];
	} catch {
		return [];
	}
}

export async function getShowreel(): Promise<{
		videoUrl: string | null;
		posterUrl: string | null;
		cues: { slug: string; start: number; end: number }[];
	} | null> {
	try {
		const res = await fetch(api('/globals/showreel?depth=2'));
		if (!res.ok) return null;
		const data = (await res.json()) as {
			video?: { url?: string; smallFile?: { url?: string } } | null;
			poster?: { url?: string } | null;
			cues?: { project?: { slug?: string } | null; start?: number; end?: number }[] | null;
		};
		const cues: { slug: string; start: number; end: number }[] = (data.cues ?? [])
			.filter((c) => c.project?.slug && typeof c.start === 'number' && typeof c.end === 'number')
			.map((c) => ({ slug: c.project!.slug as string, start: c.start as number, end: c.end as number }));
		return {
			videoUrl: data.video?.smallFile?.url ?? data.video?.url ?? null,
			posterUrl: data.poster?.url ?? null,
			cues
		};
	} catch {
		return null;
	}
}

export async function getDomains(): Promise<Domain[]> {
	try {
		const res = await fetch(api('/domains?limit=999'));
		if (!res.ok) return [];
		const data = (await res.json()) as { docs?: Domain[] };
		return data.docs ?? [];
	} catch {
		return [];
	}
}


// Convenience — prefers the backfilled real URL (R2-public when configured)
function mediaUrl(m: Media): string | null {
	// `url` may be absolute (R2 public domain) or relative (local uploads); prefer it.
	return (m as unknown as { url?: string })?.url ?? null;
}

export function posterUrls(project: Project): { url: string | null; alt: string | null } {
	const p = project.poster as Media | number | null;
	if (typeof p === 'object' && p !== null) {
		return { url: mediaUrl(p), alt: p.alt ?? null };
	}
	return { url: null, alt: null };
}

export function videoUrls(project: Project): { url: string | null; smallUrl: string | null } {
	const v = project.video as Media | number | null;
	if (typeof v === 'object' && v !== null) {
		const base = mediaUrl(v);
		const small = (v.smallFile as Media | number | null) !== null ? mediaUrl(v.smallFile as Media) : null;
		return { url: base, smallUrl: small };
	}
	return { url: null, smallUrl: null };
}
