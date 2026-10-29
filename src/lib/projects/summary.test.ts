import test from 'node:test';
import assert from 'node:assert/strict';
import { displaySummary } from './summary.ts';

test('hide observed editorial placeholders without guessing new project claims', () => {
	for (const value of [undefined, null, '', '  ', 'ssssss', 'SCaxc', '....']) assert.equal(displaySummary(value), null);
	for (const value of ['AI', 'Nike', 'A self-initiated Puma footwear concept advertisement.', 'A film about an SSSS system.']) assert.equal(displaySummary(value), value);
});
