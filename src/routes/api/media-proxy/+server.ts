import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Same-origin proxy for R2 media. The poster atlas draws video frames into a
// canvas for WebGL upload — cross-origin video would taint the canvas and
// fail the texture. Proxying keeps the request same-origin. The R2 media
// bucket has no CORS headers (the API token can't set them); if a CORS rule
// is ever added on the bucket this proxy becomes unnecessary.
const allowedOrigin = (env.R2_PUBLIC_URL || '').replace(/\/$/, '');

export const GET: RequestHandler = async ({ url, request, setHeaders }) => {
	const target = url.searchParams.get('url');
	if (!target || !allowedOrigin) {
		return new Response('bad request', { status: 400 });
	}
	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		try {
			parsed = new URL(encodeURI(target));
		} catch {
			return new Response('bad url', { status: 400 });
		}
	}
	if (parsed.origin !== allowedOrigin || !parsed.pathname.startsWith('/media/')) {
		return new Response('forbidden origin', { status: 403 });
	}

	let upstream: Response;
	try {
		upstream = await fetch(parsed.toString(), {
			headers: {
				'user-agent': 'wawe-proxy',
				...(Object.fromEntries(
					['range', 'if-range'].flatMap((h) => {
						const v = request.headers.get(h);
						return v ? [[h, v]] : [];
					})
				)),
			},
		});
	} catch (e) {
		console.error('[media-proxy] fetch failed', parsed.toString(), (e as Error).cause ?? e);
		return new Response('upstream fetch failed', { status: 502 });
	}
	if (!upstream.ok || !upstream.body) {
		return new Response('upstream error', { status: 502 });
	}
	setHeaders({
		'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
		'cache-control': 'public, max-age=86400',
		...(upstream.headers.get('content-range') ? { 'content-range': upstream.headers.get('content-range')! } : {}),
		...(upstream.headers.get('content-length') ? { 'content-length': upstream.headers.get('content-length')! } : {}),
		...(upstream.headers.get('accept-ranges') ? { 'accept-ranges': upstream.headers.get('accept-ranges')! } : {}),
	});
	return new Response(upstream.body, { status: upstream.status });
};
