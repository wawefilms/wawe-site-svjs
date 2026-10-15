import type { RequestHandler } from './$types';
import { allowedUpstream } from '$lib/landing/sources';

// Streaming, credential-free, fixed-host proxy. No request cookies/auth forwarded.
const serve: RequestHandler = async ({ request, url, fetch }) => {
	const initial = allowedUpstream(url.searchParams.get('src') ?? '');
	if (!initial) return new Response('Unsupported media source', { status: 400 });
	let target: URL = initial;
	const headers = new Headers();
	const range = request.headers.get('range');
	if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return new Response('Invalid Range', { status: 400 });
	for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}
	try {
		for (let hop = 0; hop < 4; hop++) {
			const response: Response = await fetch(target, {
				method: request.method, headers, redirect: 'manual', credentials: 'omit',
				signal: AbortSignal.any([request.signal, AbortSignal.timeout(60000)])
			});
			if ([301, 302, 303, 307, 308].includes(response.status)) {
				await response.body?.cancel();
				const location = response.headers.get('location');
				const next: URL | null = location ? allowedUpstream(new URL(location, target).href) : null;
				if (!next) return new Response('Unsupported media redirect', { status: 502 });
				target = next;
				continue;
			}
			const outgoing = new Headers({ 'X-Content-Type-Options': 'nosniff' });
			for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified', 'cache-control']) {
				const value = response.headers.get(name);
				if (value) outgoing.set(name, value);
			}
			if (![200, 206, 304, 416].includes(response.status)) {
				await response.body?.cancel();
				return new Response('Media unavailable', { status: 502 });
			}
			return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers: outgoing });
		}
	} catch {
		return new Response('Media unavailable', { status: request.signal.aborted ? 499 : 502 });
	}
	return new Response('Too many redirects', { status: 502 });
};
export const GET = serve;
export const HEAD = serve;
