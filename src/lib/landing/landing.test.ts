import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedUpstream, sourceURL, showreelSource, projectSources } from './sources.ts';
import { waitFor } from './media.ts';
import { layout, sceneDefaults, timing, contactSpring } from './scene.js';
import { createMotion, defaults } from './motion.js';
import type { Project } from '../payload-types.ts';
import { fetchCMS } from '../server/cms-fetch.ts';
import { currentProject, observePlayback } from './cues.ts';

test('only fixed media hosts and flat upload paths are proxied', () => {
	assert.ok(allowedUpstream('https://media.wawefilms.com/media/My Film.webm'));
	assert.ok(allowedUpstream('https://cms.wawefilms.com/api/media/file/reel.mp4'));
	for (const url of [
		'https://example.com/media/a.mp4', 'http://media.wawefilms.com/media/a.mp4',
		'https://media.wawefilms.com.evil.test/media/a.mp4', 'https://me:secret@media.wawefilms.com/media/a.mp4',
		'https://media.wawefilms.com/media/a.mp4?redirect=https://evil.test',
		'https://media.wawefilms.com/media/%2e%2e/a.mp4', 'https://media.wawefilms.com/media/%252e%252e/a.mp4',
		'https://media.wawefilms.com/media/folder/a.mp4', 'https://media.wawefilms.com/media/a.svg',
		'file:///media/a.mp4', 'https://localhost/media/a.mp4'
	]) assert.equal(allowedUpstream(url), null, url);
	assert.match(sourceURL('/api/media/file/a.mp4')!, /^\/api\/landing-media\?src=/);
});

test('Showreel is independent; invalid CMS URLs choose the explicit placeholder', () => {
	assert.deepEqual(showreelSource(null), { url: '/showreel-mock.webm', placeholder: true });
	assert.equal(showreelSource({ videoUrl: 'https://evil.test/reel.webm' }).placeholder, true);
	assert.equal(showreelSource({ videoUrl: 'https://media.wawefilms.com/media/poster.png' }).placeholder, true);
	assert.equal(showreelSource({ videoUrl: 'https://media.wawefilms.com/media/reel.webm' }).placeholder, false);
	assert.deepEqual(projectSources({ video: 123 } as Project), []);
});

test('media waits clean up on success, error, timeout and pre/mid-flight abort', async () => {
	const target = new EventTarget(); const controller = new AbortController();
	await waitFor(target, 'ready', () => target.dispatchEvent(new Event('ready')), controller.signal);
	await assert.rejects(waitFor(target, 'ready', () => target.dispatchEvent(new Event('error')), controller.signal));
	await assert.rejects(waitFor(target, 'ready', () => {}, controller.signal, 1));
	const pending = waitFor(target, 'ready', () => {}, controller.signal);
	controller.abort(); await assert.rejects(pending);
	let started = false;
	await assert.rejects(waitFor(target, 'ready', () => { started = true; }, controller.signal));
	assert.equal(started, false);
});

test('accepted auto gutter, live bottom padding, sweep duration and spring endpoints', () => {
	assert.equal(sceneDefaults.bottomPadding, null);
	assert.equal(sceneDefaults.unfurl, .75);
	const base = layout(1440, 900);
	assert.equal(base.rowY + base.rowH, 900 - base.margin);
	assert.equal(layout(390, 844).rowY + layout(390, 844).rowH, 844 - 18);
	assert.equal(layout(1440, 900, { ...sceneDefaults, bottomPadding: 80 }).rowY + base.rowH, 820);
	assert.ok(timing({ ...sceneDefaults, unfurl: 1.8 / 6 }).end < timing().end);
	assert.equal(contactSpring(0), 0); assert.equal(contactSpring(1), 1);
});

test('only decoded-media readiness arms one continuous opening/wash/recede', () => {
	const motion = createMotion(1);
	motion.tick(60, defaults); assert.equal(motion.snapshot().state, 'loading');
	assert.equal(motion.signalReady(), true); assert.equal(motion.signalReady(), false);
	motion.tick(12, defaults); assert.equal(motion.snapshot().state, 'settled');
	assert.equal(motion.snapshot().count, 1);
	motion.reset(true); assert.equal(motion.snapshot().reduced, true);
});

test('SSR CMS fetches carry a deadline signal and preserve caller cancellation', async (t) => {
	const controller = new AbortController();
	let observed: AbortSignal | null | undefined;
	t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
		observed = init.signal; return new Response('{}');
	});
	await fetchCMS('https://cms.wawefilms.com/api/projects');
	assert.ok(observed instanceof AbortSignal);
	await fetchCMS('https://cms.wawefilms.com/api/projects', { signal: controller.signal });
	controller.abort(); assert.equal(observed?.aborted, true);
});

test('cue identity uses full catalogue, half-open ranges and actual seek/loop times', () => {
	const projects = Array.from({ length: 14 }, (_, i) => ({ slug: `film-${i}`, title: `Film ${i}` }));
	const cues = [{ slug: 'film-12', start: 0, end: 2.2 }, { slug: 'film-13', start: 2.2, end: 5 }, { slug: 'film-12', start: 6, end: 7 }];
	assert.equal(currentProject(cues, projects, 0), projects[12]);
	assert.equal(currentProject(cues, projects, 2.199), projects[12]);
	assert.equal(currentProject(cues, projects, 2.2), projects[13]);
	assert.equal(currentProject(cues, projects, 5), null);
	assert.equal(currentProject(cues, projects, 6), projects[12]);
	assert.equal(currentProject(cues, projects, 7), null);
	assert.equal(currentProject(cues, projects, 0), projects[12]); // Loop / backward seek.
	assert.equal(currentProject(cues, projects, 1, true), null);
	assert.equal(currentProject(undefined, projects, 1), null);
	assert.equal(currentProject(cues, projects.slice(0, 6), 1), null);
	assert.equal(currentProject(cues, [...projects, projects[12]], 1), null);
	assert.equal(currentProject([...cues, { slug: 'film-1', start: 1, end: 3 }], projects, 1), null);
	for (const time of [NaN, Infinity, -1]) assert.equal(currentProject(cues, projects, time), null);
	for (const cue of [{ slug: 'film-1', start: NaN, end: 3 }, { slug: 'film-1', start: 0, end: Infinity }, { slug: 'film-1', start: -1, end: 3 }, { slug: 'film-1', start: 3, end: 0 }]) {
		assert.equal(currentProject([cue], projects, 1), null);
	}
	assert.deepEqual(projects.map(p => p.slug), Array.from({ length: 14 }, (_, i) => `film-${i}`));
});

test('playback observer samples paused seeks and looping; disposal removes every listener', () => {
	const video = Object.assign(new EventTarget(), { currentTime: 0 });
	const times: number[] = [];
	const dispose = observePlayback(video as HTMLVideoElement, time => times.push(time));
	for (const [event, time] of [['play', 0], ['timeupdate', 2.2], ['pause', 2.2], ['seeking', 6], ['seeked', 6], ['ended', 7], ['timeupdate', 0], ['emptied', 0], ['loadeddata', .6]] as const) {
		video.currentTime = time; video.dispatchEvent(new Event(event));
	}
	assert.deepEqual(times, [0, 0, 2.2, 2.2, 6, 6, 7, 0, 0, .6]);
	dispose();
	for (const event of ['play', 'timeupdate', 'pause', 'seeking', 'seeked', 'ended', 'emptied', 'loadeddata']) video.dispatchEvent(new Event(event));
	assert.equal(times.length, 10);
});

test('decoded-frame observation tracks native playback between timeupdate events and cancels on disposal', () => {
	let callback: (() => void) | undefined, nextId = 0;
	const cancelled: number[] = [], times: number[] = [];
	const video = Object.assign(new EventTarget(), { currentTime: 0,
		requestVideoFrameCallback(fn: () => void) { callback = fn; return ++nextId; },
		cancelVideoFrameCallback(id: number) { cancelled.push(id); }
	});
	const dispose = observePlayback(video as unknown as HTMLVideoElement, time => times.push(time));
	video.currentTime = 2.2; callback?.();
	video.currentTime = 0; callback?.();
	assert.deepEqual(times, [0, 2.2, 0]);
	dispose(); assert.deepEqual(cancelled, [3]);
});
