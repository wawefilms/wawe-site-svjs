import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotion } from '../landing/motion.js';

// The accepted field begins at phase 3.6 in a 6.8-unit lap, at speed 1.4.
// A warm load must still paint that first breaker, not wait for a second lap.
test('the initial ASCII lap completes after about 2.3 seconds of painted motion', () => {
	const motion = createMotion(1.4);
	assert.equal(motion.snapshot().firstLapComplete, false);
	motion.tick(2.2, {});
	assert.equal(motion.snapshot().firstLapComplete, false);
	motion.tick(.1, {});
	assert.equal(motion.snapshot().firstLapComplete, true);
	assert.equal(motion.snapshot().state, 'loading', 'readiness still owns asset loading, not the clock');
});

test('slow readiness does not reset or demand another ASCII lap', () => {
	const motion = createMotion(1.4);
	motion.tick(5, {});
	assert.equal(motion.snapshot().firstLapComplete, true);
	motion.tick(.016, {});
	assert.equal(motion.snapshot().firstLapComplete, true);
	motion.reset();
	assert.equal(motion.snapshot().firstLapComplete, false);
});
