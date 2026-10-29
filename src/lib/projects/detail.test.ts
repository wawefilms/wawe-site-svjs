import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchProjectDetail, projectBackLink, projectDetail } from './detail.ts';
import type { Media, Project } from '../payload-types.ts';
const media = (values: Partial<Media>): Media => ({ id: 1, createdAt: '', updatedAt: '', ...values });
const project = (values: Partial<Project> = {}): Project => ({ id: 1, title: 'Film', slug: 'film', shortDesc: '', video: 123, createdAt: '', updatedAt: '', ...values });

test('safe homepage return path preserves validated catalogue query only', () => {
	assert.equal(projectBackLink('/?view=all&tag=2&domain=3&sort=title&evil=x#projects', [{ id: 2 }], [{ id: 3 }]), '/?view=all&tag=2&domain=3&sort=title#projects');
	assert.equal(projectBackLink('/?tag=99&sort=unknown', [], []), '/#projects');
	assert.equal(projectBackLink('/?client=7&sort=title', [], [], [{ id: 7 }]), '/?view=all&client=7&sort=title#projects');
	assert.equal(projectBackLink('/?client=8', [], [], [{ id: 7 }]), '/#projects');
	for (const value of [null, '//evil.test', '/contact', 'https://evil.test/', '/\\evil.test', '/%2f%2fevil', '/?view=all\n']) assert.equal(projectBackLink(value, [], []), '/#projects');
});
test('typed fetch separates real missing from upstream failures, encodes slug once', async () => {
	const request = (status: number, body: unknown): typeof fetch => async () => new Response(JSON.stringify(body), { status });
	assert.equal((await fetchProjectDetail('https://cms.test', 'x', request(200, { docs: [] }))).status, 'missing');
	for (const [status, body] of [[503, { docs: [] }], [200, {}], [200, { docs: [null] }]] as const) assert.equal((await fetchProjectDetail('https://cms.test', 'x', request(status, body))).status, 'unavailable');
	assert.equal((await fetchProjectDetail('https://cms.test', 'x', async () => { throw Error('offline'); })).status, 'unavailable');
	const result = await fetchProjectDetail('https://cms.test/', 'a%/"', async input => {
		assert.equal(new URL(String(input)).searchParams.get('where[slug][equals]'), 'a%/"');
		return new Response(JSON.stringify({ docs: [project()] }));
	});
	assert.equal(result.status, 'found');
});
test('detail normalizes MIME media and safe unpopulated relationships', () => {
	const image = media({ url: '/api/media/file/still.webp', mimeType: 'image/webp', width: 900, height: 1600 });
	const video = media({ url: '/api/media/file/film.mov', mimeType: 'video/quicktime' });
	const result = projectDetail(project({ video, poster: image, clients: [123], tags: [456], partMedia: [{ asset: image }, { asset: 123 }, { asset: video }] }));
	assert.match(result.primary.media.videoUrl!, /film.mov/);
	assert.match(result.primary.poster!, /still.webp/);
	assert.deepEqual(result.clients, []);
	assert.deepEqual(result.tags, []);
	assert.equal(result.parts.length, 2);
	assert.equal(result.parts[0].media.kind, 'image');
	assert.equal(result.parts[0].media.videoUrl, null);
	assert.equal(result.parts[0].media.height, 1600);
	assert.equal(projectDetail(project({ video: image })).primary.media.videoUrl, null);
});
