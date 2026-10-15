import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { createCleanup, createPlaybackPolicy } from './playback.ts';
import { INTRO_DEADLINE_MS, waitForFrame } from './readiness.ts';
import { heroSource } from './sources.ts';

class Player extends EventTarget {
	readyState = 0;
	networkState = 1;
	videoWidth = 1920;
	videoHeight = 1080;
	error = null;
	loads = 0;
	load() { this.loads++; }
}
const frame = (player: Player, signal: AbortSignal, timeout = 30) => waitForFrame(player as unknown as HTMLVideoElement, signal, timeout);

test('readiness retains loadeddata boundary with a 25s budget', async () => {
	assert.equal(INTRO_DEADLINE_MS, 25_000);
	const player = new Player();
	const job = frame(player, new AbortController().signal);
	player.readyState = 2;
	player.dispatchEvent(new Event('loadeddata'));
	await job;
	assert.equal(player.loads, 0, 'does not reset an already loading native source');
	assert.equal(getEventListeners(player, 'loadeddata').length, 0);
	assert.equal(getEventListeners(player, 'error').length, 0);
});

test('already-decoded native frame resolves without waiting or loading', async () => {
	const player = new Player(); player.readyState = 2;
	await frame(player, new AbortController().signal);
	assert.equal(player.loads, 0);
});

test('readiness rejects timeout, abort, media error and empty frame', async () => {
	await assert.rejects(frame(new Player(), new AbortController().signal, 5), /failed/);
	const controller = new AbortController();
	const aborted = frame(new Player(), controller.signal);
	controller.abort(new Error('navigation'));
	await assert.rejects(aborted, /navigation/);
	const player = new Player();
	const errored = frame(player, new AbortController().signal);
	player.dispatchEvent(new Event('error'));
	await assert.rejects(errored, /failed/);
	assert.equal(getEventListeners(player, 'loadeddata').length, 0);
	assert.equal(getEventListeners(player, 'error').length, 0);
	assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
	player.readyState = 2; player.videoWidth = 0;
	await assert.rejects(frame(player, new AbortController().signal), /decoded frame/);
});

test('reduced motion does not autoplay but explicit play remains possible', () => {
	const policy = createPlaybackPolicy(true);
	policy.autoplay(); assert.equal(policy.shouldPlay(), false);
	policy.userPlay(); assert.equal(policy.shouldPlay(), true);
	policy.setReduced(true); assert.equal(policy.shouldPlay(), false);
	policy.setReduced(false); assert.equal(policy.shouldPlay(), false);
});

test('offscreen/background suspension resumes intent, never a user pause', () => {
	const policy = createPlaybackPolicy();
	policy.autoplay(); assert.equal(policy.shouldPlay(), true);
	policy.setBlocked(true); assert.equal(policy.shouldPlay(), false);
	policy.setBlocked(false); assert.equal(policy.shouldPlay(), true);
	policy.userPause(); policy.setBlocked(true); policy.setBlocked(false);
	assert.equal(policy.shouldPlay(), false);
});

test('teardown is once-only, reverse-order, and handles late resources', () => {
	const cleanup = createCleanup();
	const calls: number[] = [];
	cleanup.add(() => calls.push(1)); cleanup.add(() => calls.push(2));
	cleanup.dispose(); cleanup.dispose(); cleanup.add(() => calls.push(3));
	assert.deepEqual(calls, [2, 1, 3]); assert.equal(cleanup.disposed, true);
});

test('native hero accepts safe raw/proxied sources without widening policy', () => {
	const raw = 'https://media.wawefilms.com/media/reel.webm';
	const proxy = `/api/landing-media?src=${encodeURIComponent(raw)}`;
	assert.equal(heroSource(raw, 'video'), proxy);
	assert.equal(heroSource(proxy, 'video'), proxy);
	assert.equal(heroSource('https://evil.example/media/reel.webm', 'video'), null);
	assert.equal(heroSource(proxy + '&src=' + encodeURIComponent(raw), 'video'), null);
	assert.equal(heroSource('/api/landing-media?src=' + encodeURIComponent('https://evil.example/media/reel.webm'), 'video'), null);
	assert.equal(heroSource(raw, 'image'), null);
	assert.equal(heroSource('https://media.wawefilms.com/media/poster.webp', 'video'), null);
});
