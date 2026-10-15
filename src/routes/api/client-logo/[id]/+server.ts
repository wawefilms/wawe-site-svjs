import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { fetchCMS } from '$lib/server/cms-fetch';
import { clientLogoSource } from '$lib/media/client-logo';

export const GET: RequestHandler = async ({ params }) => {
	if (!/^[1-9]\d*$/.test(params.id) || !Number.isSafeInteger(Number(params.id))) return new Response(null, { status: 404 });
	const cms = (env.PAYLOAD_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
	try {
		const metadata = await fetchCMS(`${cms}/api/clients/${params.id}?depth=1`);
		if (!metadata.ok) return new Response(null, { status: 404 });
		const { logo } = await metadata.json();
		const source = logo?.url && logo?.mimeType ? clientLogoSource(logo.url, logo.mimeType, cms) : null;
		if (!source) return new Response(null, { status: 404 });
		// Never forwards viewer cookies/secrets and never accepts a caller-supplied URL.
		const image = await fetchCMS(source, { redirect: 'error' });
		if (!image.ok || image.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== logo.mimeType) return new Response(null, { status: 502 });
		const limit = 2 * 1024 * 1024;
		if (Number(image.headers.get('content-length')) > limit) { await image.body?.cancel(); return new Response(null, { status: 413 }); }
		const reader = image.body?.getReader();
		if (!reader) return new Response(null, { status: 502 });
		const chunks: Uint8Array[] = []; let size = 0;
		try {
			while (true) {
				const { value, done } = await reader.read(); if (done) break;
				size += value.byteLength;
				if (size > limit) { await reader.cancel(); return new Response(null, { status: 413 }); }
				chunks.push(value);
			}
		} finally { reader.releaseLock(); }
		const bytes = new Uint8Array(size); let offset = 0;
		for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
		return new Response(bytes, { headers: { 'Content-Type': logo.mimeType, 'Content-Length': String(size), 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
	} catch { return new Response(null, { status: 502 }); }
};
