import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Read-only checks: run against a local build or the deployed homepage.
const origin = process.env.BROWSER_TEST_URL ?? 'http://127.0.0.1:4199';
const session = `wawe-intro-test-${process.pid}`;
function run(...args) {
	const output = execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 35000 });
	const result = JSON.parse(output);
	if (!result.success) throw new Error(result.error ?? output);
	return result.data;
}
const evaluate = code => run('eval', code).result;
try {
	for (const width of [390, 1512]) {
		run('set', 'viewport', String(width), '844');
		run('open', `${origin}/?intro-regression=${width}`);
		run('wait', '--fn', 'document.querySelector(".intro") !== null');
		assert.equal(evaluate('document.querySelector(".intro button") === null'), true,
			'Loading must not display the unwanted Skip animation button');
		const started = Date.now();
		run('wait', '--fn', 'document.querySelector(".intro.active") === null');
		assert.ok(Date.now() - started < 27000, 'Intro must fail open within its 25-second deadline');
		run('wait', '--fn', 'getComputedStyle(document.querySelector(".intro")).visibility === "hidden"');
		assert.equal(evaluate('document.querySelectorAll("video").length'), 1, 'Intro must reveal the same native film');
		assert.equal(evaluate('document.querySelector(".film-toggle") !== null'), true, 'Film controls must remain available');
		console.log(`PASS: ${width}px loading dismisses automatically, without a Skip button`);
	}
} finally {
	try { run('close'); } catch { /* Preserve the assertion failure. */ }
}
