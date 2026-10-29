import test from 'node:test';
import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { waitForArtwork } from './readiness.ts';

class ImageStub {
	src = ''; naturalWidth = 100;
	resolve!: () => void; reject!: (reason: Error) => void;
	pending = new Promise<void>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
	decode() { return this.pending; }
}
function images() {
	const created: ImageStub[] = [];
	return { created, factory: () => { const image = new ImageStub(); created.push(image); return image as unknown as HTMLImageElement; } };
}

test('intro artwork waits for every decoded logo and deduplicates URLs', async () => {
	const { created, factory } = images(); const controller = new AbortController();
	let ready = false;
	const job = waitForArtwork([{ src: 'one' }, { src: 'two' }, { src: 'three' }, { src: 'one' }], controller.signal, factory).then(() => { ready = true; });
	assert.equal(created.length, 3);
	created[0].resolve(); created[1].resolve(); await Promise.resolve(); assert.equal(ready, false);
	created[2].resolve(); await job; assert.equal(ready, true);
	assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
});

test('failed remote artwork must decode verified fallback before readiness', async () => {
	const { created, factory } = images();
	const job = waitForArtwork([{ src: 'remote', fallback: '/clients/official.png' }], new AbortController().signal, factory);
	created[0].reject(new Error('offline')); await new Promise(resolve => setImmediate(resolve));
	assert.equal(created[1].src, '/clients/official.png'); created[1].resolve(); await job;
});

test('artwork failure, deadline and cancellation settle without leaking listeners', async () => {
	const controller = new AbortController(); const a = images();
	const cancelled = waitForArtwork([{ src: 'one', fallback: 'two' }], controller.signal, a.factory);
	controller.abort(new Error('navigation')); await assert.rejects(cancelled, /navigation/);
	assert.equal(a.created.length, 1); assert.equal(a.created[0].src, '');
	assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
	const b = images(); await assert.rejects(waitForArtwork([{ src: 'one' }], new AbortController().signal, b.factory, 5), /timed out/);
	const c = images(); const broken = waitForArtwork([{ src: 'one' }], new AbortController().signal, c.factory);
	c.created[0].naturalWidth = 0; c.created[0].resolve(); await assert.rejects(broken, /decoded pixels/);
});
