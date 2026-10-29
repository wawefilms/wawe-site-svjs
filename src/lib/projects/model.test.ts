import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Client, Project } from '../payload-types.ts';
import { galleryProjects, filterProjects, parseProjectQuery, projectIdentity, projectQueryParams, sortProjects } from './model.ts';

const project = (id: number, fields: Partial<Project> = {}): Project => ({
	id, title: `Project ${id}`, slug: `project-${id}`, shortDesc: '', video: 1,
	createdAt: '2026-01-01', updatedAt: '2026-01-01', ...fields
});
const client = (id: number, fields: Partial<Client> = {}): Client => ({
	id, title: `Client ${id}`, description: '', createdAt: '', updatedAt: '', ...fields
});
const ids = (projects: Project[]) => projects.map(project => project.id);

test('canonical client artwork supersedes stale populated relationships without mutation', () => {
	const stale = client(1, { title: 'Razorpay', logo: null });
	const current = client(1, { title: 'Razorpay', logo: { id: 80, createdAt: '', updatedAt: '', mimeType: 'image/png', url: '/api/client-logo/1?asset=80' } });
	assert.equal(projectIdentity(project(1, { clients: [stale] }), [current]).clients[0].logoUrl, '/api/client-logo/1?asset=80');
	assert.equal(stale.logo, null);
});

test('Highlighted sorts finite priorities including zero; dates then numeric IDs resolve ties without mutation', () => {
	const input = [project(9, { priority: Infinity }), project(3, { priority: 0 }),
		project(2, { priority: 0 }), project(1, { priority: 0, createdAt: '2026-02-01' }),
		project(8, { priority: NaN }), project(7, { priority: null }), project(6, { priority: -1 })];
	const before = [...input];
	Object.freeze(input);
	assert.deepEqual(ids(sortProjects(input)), [6, 1, 2, 3, 7, 8, 9]);
	assert.deepEqual(input, before);
	assert.equal(sortProjects(input)[0], input[6]);
});

test('Recent and title sorting ignore priority, handle invalid dates and deterministic slug ties', () => {
	const input = [project(2, { title: 'Alpha', createdAt: 'invalid', priority: 0 }),
		project(1, { title: 'zebra', createdAt: '2026-03-01' }), project(3, { title: 'beta' })];
	assert.deepEqual(ids(sortProjects(input, 'recent')), [1, 3, 2]);
	assert.deepEqual(ids(sortProjects(input, 'title')), [2, 3, 1]);
	assert.deepEqual(sortProjects([project(1, { slug: 'z' }), project(1, { slug: 'a' })]).map(p => p.slug), ['a', 'z']);
	assert.deepEqual(sortProjects([]), []);
});

test('Filters intersect tag and any client domain, populated or resolved numeric relationships', () => {
	const clients = [client(1, { domains: [10] })];
	const input = [project(1, { tags: [5], clients: [1] }),
		project(2, { tags: [{ id: 5, tag: 'Film', createdAt: '', updatedAt: '' }], clients: [client(2, { domains: [{ id: 10, domain: 'Music', createdAt: '', updatedAt: '' }] })] }),
		project(3, { tags: [6], clients: [1] }), project(4, { tags: [5], clients: [999] }),
		project(5, { tags: null, clients: null })];
	assert.deepEqual(ids(filterProjects(input, { tag: 5, domain: 10 }, clients)), [1, 2]);
	assert.deepEqual(ids(filterProjects(input, { tag: null, domain: 10 }, clients)), [1, 2, 3]);
	assert.deepEqual(ids(filterProjects(input, { tag: 5, domain: null })), [1, 2, 4]);
	assert.deepEqual(filterProjects(input, { tag: null, domain: null }), input);
});

test('Query validation, archive inference and canonical roundtrip use numeric IDs', () => {
	const tags = [{ id: 5 }], domains = [{ id: 10 }];
	const parsed = parseProjectQuery(new URLSearchParams('view=all&tag=5&domain=10&sort=title&junk=bad'), tags, domains);
	assert.deepEqual(parsed, { view: 'all', tag: 5, domain: 10, sort: 'title' });
	assert.equal(projectQueryParams(parsed).toString(), 'view=all&tag=5&domain=10&sort=title');
	assert.deepEqual(parseProjectQuery(projectQueryParams(parsed), tags, domains), parsed);
	assert.equal(parseProjectQuery(new URLSearchParams('tag=5'), tags, domains).view, 'all');
	assert.equal(parseProjectQuery(new URLSearchParams('sort=recent'), tags, domains).sort, 'recent');
	for (const query of ['', 'tag=05&domain=-10&sort=nope', 'view=oops&tag=999', 'tag=5&tag=5&sort=title&sort=recent', 'tag=5.0', 'tag=9007199254740993']) {
		const empty = parseProjectQuery(new URLSearchParams(query), tags, domains);
		assert.deepEqual(empty, { view: 'highlighted', tag: null, domain: null, sort: 'highlighted' });
		assert.equal(projectQueryParams(empty).toString(), '');
	}
});

test('Identity preserves all clients, deduplicates IDs, safely falls back for missing clients/logos and cue gaps', () => {
	const a = client(1), b = client(2, { logo: 8 });
	assert.deepEqual(projectIdentity(null), { label: 'SHOWREEL', projectSlug: null, clients: [] });
	const identity = projectIdentity(project(1, { clients: [1, b, 1, 999] }), [a]);
	assert.equal(identity.label, 'Client 1 / Client 2');
	assert.equal(identity.projectSlug, 'project-1');
	assert.deepEqual(identity.clients, [{ id: 1, title: 'Client 1', logoUrl: null }, { id: 2, title: 'Client 2', logoUrl: null }]);
	assert.equal(projectIdentity(project(1, { clients: null })).label, 'Project 1');
	assert.equal(projectIdentity(project(1, { clients: [999] })).clients.length, 0);
});


test('Official client artwork follows verified relationships only and CMS artwork takes precedence', () => {
	const razorpay = client(1, { title: 'Razorpay' });
	const linked = project(1, { clients: [1] });
	assert.equal(projectIdentity(linked, [razorpay]).clients[0].logoUrl, '/clients/razorpay-white.png');
	assert.equal(projectIdentity(project(2, { title: 'Razorpay film', clients: [] }), [razorpay]).clients.length, 0);
	assert.equal(projectIdentity(project(2, { clients: [client(2, { title: 'constructor' })] })).clients[0].logoUrl, null);
	const logo = { id: 20, url: 'https://media.wawefilms.com/media/razorpay.webp', mimeType: 'image/webp', createdAt: '', updatedAt: '' };
	assert.equal(projectIdentity(linked, [client(1, { title: 'Razorpay', logo })]).clients[0].logoUrl, logo.url);
	assert.equal(projectIdentity(null, [razorpay]).clients.length, 0);
});


test('Gallery omits only the redundant montage Project without mutating the full cue catalogue', () => {
	const reel = project(1, { slug: 'wawe-films-showreel' }), film = project(2);
	const full = Object.freeze([reel, film]);
	assert.deepEqual(galleryProjects(full), [film]);
	assert.equal(full.length, 2);
	assert.equal(full[0], reel);
	assert.deepEqual(galleryProjects([]), []);
	for (const title of ['Outskill', 'Wispr Flow']) {
		assert.ok(projectIdentity(project(3, { clients: [client(3, { title })] })).clients[0].logoUrl);
	}
});
