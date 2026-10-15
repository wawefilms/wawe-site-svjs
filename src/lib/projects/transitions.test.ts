import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectionTransition, EXPAND_DURATION, REVEAL_EASING } from './transitions.ts';

function fixture() {
	let height = 100;
	let complete!: () => void;
	let reject!: (error: Error) => void;
	const calls: { frames: Keyframe[]; options: KeyframeAnimationOptions }[] = [];
	const animation = {
		finished: new Promise<void>((resolve, failure) => { complete = resolve; reject = failure; }),
		cancel() { reject(new Error('cancelled')); }
	};
	const element = {
		style: { height: '', overflow: 'visible', overflowAnchor: 'auto' },
		getBoundingClientRect: () => ({ height }),
		animate(frames: Keyframe[], options: KeyframeAnimationOptions) { calls.push({ frames, options }); return animation; }
	};
	const transition = createSectionTransition(element as unknown as HTMLElement, element as unknown as HTMLElement);
	return { transition, element, calls, complete, setHeight(value: number) { height = value; } };
}
const settled = () => Promise.resolve();

test('measures actual old/new heights and releases height/clip/anchoring', async () => {
	const f = fixture();
	const run = f.transition.run(() => f.setHeight(820), settled, false);
	await settled();
	assert.equal(f.transition.busy, true);
	assert.deepEqual(f.calls, [{ frames: [{ height: '100px' }, { height: '820px' }], options: { duration: EXPAND_DURATION, easing: REVEAL_EASING } }]);
	assert.equal(f.element.style.height, '820px');
	assert.equal(f.element.style.overflow, 'clip');
	assert.equal(f.element.style.overflowAnchor, 'none');
	f.complete();
	assert.equal(await run, true);
	assert.equal(f.transition.busy, false);
	assert.deepEqual(f.element.style, { height: '', overflow: 'visible', overflowAnchor: 'auto' });
});

test('serializes rapid toggles without applying a second update', async () => {
	const f = fixture();
	const first = f.transition.run(() => f.setHeight(600), settled, false);
	let applied = false;
	assert.equal(await f.transition.run(() => { applied = true; }, settled, false), false);
	assert.equal(applied, false);
	f.complete(); await first;
});

test('reduced motion updates immediately and never creates an animation', async () => {
	const f = fixture();
	assert.equal(await f.transition.run(() => f.setHeight(600), settled, true), true);
	assert.equal(f.calls.length, 0);
	assert.equal(f.element.style.height, '');
});

test('intrinsic resize (including fonts/images) finalizes to natural height', async () => {
	const f = fixture();
	const run = f.transition.run(() => f.setHeight(600), settled, false);
	await settled();
	f.transition.layoutChanged();
	assert.equal(f.element.style.height, '600px');
	f.setHeight(720); f.transition.layoutChanged();
	await run;
	assert.equal(f.element.style.height, '');
	assert.equal(f.element.style.overflow, 'visible');
});

test('unmount cancels motion and refuses subsequent updates', async () => {
	const f = fixture();
	const run = f.transition.run(() => f.setHeight(600), settled, false);
	await settled(); f.transition.dispose(); await run;
	assert.equal(f.element.style.height, '');
	assert.equal(await f.transition.run(() => assert.fail('disposed update'), settled, false), false);
});

test('unmount while awaiting DOM update cannot start an animation', async () => {
	const f = fixture();
	let flush!: () => void;
	const wait = new Promise<void>(resolve => { flush = resolve; });
	const run = f.transition.run(() => f.setHeight(600), () => wait, false);
	f.transition.dispose(); flush();
	assert.equal(await run, false);
	assert.equal(f.calls.length, 0);
	assert.equal(f.transition.busy, false);
});

test('collapse animates measured height downward and cleans up errors', async () => {
	const f = fixture(); f.setHeight(900);
	const run = f.transition.run(() => f.setHeight(300), settled, false);
	await settled();
	assert.deepEqual(f.calls[0].frames, [{ height: '900px' }, { height: '300px' }]);
	f.complete(); await run;
	await assert.rejects(f.transition.run(() => { throw new Error('failed update'); }, settled, false));
	assert.equal(f.transition.busy, false);
	assert.equal(f.element.style.height, '');
});


test('background finalization cancels a frozen animation and releases the pending update', async () => {
	const f = fixture();
	const run = f.transition.run(() => f.setHeight(600), settled, false);
	await settled();
	f.transition.finish(); // visibilitychange must not leave URL writing/controls waiting on a frozen timeline
	assert.equal(await run, true);
	assert.equal(f.transition.busy, false);
	assert.equal(f.element.style.height, '');
});
