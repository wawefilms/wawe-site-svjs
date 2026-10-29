import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Read-only checks: run against a local build or the deployed homepage.
const origin = process.env.BROWSER_TEST_URL ?? 'http://127.0.0.1:4199';
let session = `wawe-intro-test-${process.pid}`;
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
		const visibleWithReadyFilm = evaluate('new Promise(resolve => { const deadline=performance.now()+4000; const timer=setInterval(() => { const intro=document.querySelector(".intro"), logo=intro?.querySelectorAll("canvas")[1], video=document.querySelector("video"); if (intro?.classList.contains("active") && logo?.dataset.cellSize && video?.readyState >= 2) { clearInterval(timer); resolve(true); } else if (performance.now() >= deadline) { clearInterval(timer); resolve(false); } }, 16); })');
		assert.equal(visibleWithReadyFilm, true, 'Fast video readiness must not skip the painted ASCII wave');
		const started = Date.now();
		run('wait', '--fn', 'document.querySelector(".intro.active") === null');
		assert.ok(Date.now() - started < 27000, 'Intro must fail open within its 25-second deadline');
		run('wait', '--fn', 'getComputedStyle(document.querySelector(".intro")).visibility === "hidden"');
		assert.equal(evaluate('document.querySelectorAll("video").length'), 1, 'Intro must reveal the same native film');
		assert.equal(evaluate('document.querySelector(".film-toggle") !== null'), true, 'Film controls must remain available');
		console.log(`PASS: ${width}px ready film retains a painted ASCII wave before automatic reveal`);
	}
	run('open', `${origin}/?intro-regression=escape`);
	run('wait', '--fn', 'document.querySelector(".intro.active") !== null');
	run('press', 'Escape');
	run('wait', '--fn', 'document.querySelector(".intro.active") === null');
	assert.equal(evaluate('document.activeElement === document.querySelector(".film-toggle")'), true, 'Escape must still bypass the wave and focus playback');
	run('close'); session += '-next';
	run('set', 'viewport', '1512', '844');
	run('open', `${origin}/?intro-regression=error`);
	run('wait', '--fn', 'document.querySelector(".intro.active") !== null');
	evaluate('document.querySelector("video").dispatchEvent(new Event("error")); true');
	run('wait', '--fn', 'document.querySelector(".intro.active") === null');
	run('close'); session += '-next';
	run('open', `${origin}/?intro-regression=reduced`);
	run('set', 'media', 'reduced-motion');
	run('wait', '--fn', 'document.querySelector(".film-toggle") !== null');
	assert.equal(evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), true, 'Browser must retain reduced-motion emulation across navigation');
	run('wait', '--fn', 'document.querySelector(".intro.active") === null');
	assert.equal(evaluate('document.querySelector(".intro.active") === null'), true, 'Reduced motion must not wait for the wave');
	console.log('PASS: Escape, media failure and reduced motion bypass the minimum wave');
} finally {
	try { run('close'); } catch { /* Preserve the assertion failure. */ }
}
