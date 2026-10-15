import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeCaptionTracks, projectCaptionTracks, SHOWREEL_CAPTIONS } from './captions.ts';

test('caption availability is never invented from missing assets', () => {
	assert.deepEqual(projectCaptionTracks('unknown'), []);
	assert.deepEqual(SHOWREEL_CAPTIONS, []);
});
test('approved local WebVTT tracks are deduplicated and have at most one default', () => {
	const english = { src: '/captions/film-en.vtt', srclang: 'en', label: ' English ', default: true };
	const result = safeCaptionTracks([english, english, { src: '/captions/film-hi.vtt', srclang: 'hi', label: 'Hindi', default: true }]);
	assert.equal(result.length, 2);
	assert.equal(result[0].label, 'English');
	assert.equal(result[0].kind, 'captions');
	assert.deepEqual(result.map(t => t.default), [true, false]);
});
test('caption inputs cannot widen the media proxy or inject unsafe paths/languages', () => {
	for (const src of ['https://evil.test/a.vtt', '//evil.test/a.vtt', '/captions/../a.vtt', '/captions/%2e%2e.vtt', '/captions/a.vtt?x=1', '/captions/a.mp4']) assert.deepEqual(safeCaptionTracks([{ src, srclang: 'en', label: 'English' }]), []);
	assert.deepEqual(safeCaptionTracks([{ src: '/captions/film.vtt', srclang: 'not a language', label: 'English' }]), []);
});


test('detail SSR emits actual native caption tracks only when supplied', async () => {
	const { readFile, writeFile, unlink, mkdir } = await import('node:fs/promises');
	const { compile } = await import('svelte/compiler');
	const { render } = await import('svelte/server');
	const source = await readFile(new URL('../components/ProjectMedia.svelte', import.meta.url), 'utf8');
	const result = compile(source.replace("'$lib/media/captions'", "'../src/lib/media/captions.ts'"), { generate: 'server', filename: 'ProjectMedia.svelte' });
	const file = new URL('../../../.svelte-kit/caption-test-component.mjs', import.meta.url);
	await mkdir(new URL('../../../.svelte-kit/', import.meta.url), { recursive: true });
	await writeFile(file, result.js.code);
	try {
		const { default: Component } = await import(file.href);
		const item = { media: { videoUrl: '/film.webm', sources: ['/film.webm'], width: 1920, height: 1080 }, poster: null, label: 'Film' };
		const empty = render(Component, { props: { item } }).body;
		assert.equal(empty.includes('<track'), false);
		const captioned = render(Component, { props: { item: { ...item, captions: [{ src: '/captions/film-en.vtt', srclang: 'en', label: 'English', default: true }] } } }).body;
		assert.match(captioned, /<track kind="captions" src="\/captions\/film-en.vtt" srclang="en" label="English" default/);
	} finally { await unlink(file); }
});
