import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const origin = process.env.BROWSER_TEST_URL ?? 'http://127.0.0.1:4198';
const session = `wawe-navigation-filters-${process.pid}`;
function run(...args) {
	const output = execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 35000 });
	const response = JSON.parse(output);
	if (!response.success) throw new Error(response.error ?? output);
	return response.data;
}
const evaluate = code => run('eval', code).result;
try {
	run('set', 'viewport', '1512', '900');
	run('open', origin + '/');
	run('wait', '--fn', 'document.querySelector(".film-toggle") !== null && !document.querySelector(".intro.active")');
	for (const [width, height] of [[1512, 900], [390, 844], [844, 390]]) {
		run('set', 'viewport', String(width), String(height));
		// Put the trigger at the viewport's lower edge, where a downward-only menu clips.
		evaluate('(() => { const r=document.querySelector(".menu-trigger").getBoundingClientRect(); window.scrollBy(0, r.bottom - innerHeight + 12); return true; })()');
		run('click', '.menu-trigger');
		run('wait', '--fn', 'document.querySelector(".menu-trigger").getAttribute("aria-expanded") === "true"');
		run('wait', '--fn', 'getComputedStyle(document.querySelector(".identity-bar nav:not(.no-script)")).opacity === "1"');
		const bounds = evaluate('(() => { const n=document.querySelector(".identity-bar nav:not(.no-script)"), r=n.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:innerWidth,height:innerHeight,links:[...n.querySelectorAll("a")].map(a=>{const r=a.getBoundingClientRect();return {top:r.top,bottom:r.bottom};})}; })()');
		assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.height && bounds.left >= 0 && bounds.right <= bounds.width, `Menu must fit ${width}×${height}: ${JSON.stringify(bounds)}`);
		assert.ok(bounds.links.every(r => r.top >= 0 && r.bottom <= bounds.height), 'All menu links must be visible without scrolling');
		run('press', 'Escape');
		assert.equal(evaluate('document.activeElement === document.querySelector(".menu-trigger")'), true);
		console.log(`PASS: menu fully visible at ${width}×${height}; Escape restores focus`);
	}
	// Use a fresh browser for navigation checks after resizing the menu viewport.
	run('close');
	run('set', 'viewport', '1512', '900');
	// Keep history assertions independent of headless Chromium's view-transition capture.
	run('set', 'media', 'reduced-motion');
	run('open', origin + '/?view=all#projects');
	run('wait', '--fn', 'document.querySelector("select[name=sort]") !== null && document.querySelector(".film-toggle") !== null && !document.querySelector(".intro.active")');
	assert.equal(evaluate('[...document.querySelectorAll("select[name=tag] option")].some(o=>o.textContent.trim().toLowerCase()==="showreel")'), false);
	run('select', 'select[name="sort"]', 'title');
	run('wait', '--fn', 'location.search.includes("sort=title") && !document.querySelector("select[name=sort]").disabled');
	const titles = evaluate('[...document.querySelectorAll(".grid h3")].map(n=>n.textContent.trim().toLowerCase())');
	assert.ok(titles.length > 0, 'Local fixture must supply Projects');
	assert.deepEqual(titles, [...titles].sort(), 'Selecting Title must immediately reorder Projects');
	const company = evaluate('[...document.querySelectorAll("select[name=client] option")].find(o=>o.value)?.value');
	assert.ok(company, 'Company filter must contain CMS clients');
	run('select', 'select[name="client"]', company);
	run('wait', '--fn', `location.search.includes("client=${company}") && !document.querySelector("select[name=client]").disabled`);
	assert.ok(evaluate('document.querySelectorAll(".grid [data-project-id]").length || document.querySelectorAll("[data-project-id]").length'), 'Selected company must have Projects');
	const ids = evaluate('[...document.querySelectorAll("[data-project-id]")].map(n=>n.dataset.projectId)');
	run('click', '.grid a h3');
	run('wait', '--url', '**/project/**');
	evaluate('history.back(); true');
	run('wait', '--url', '**/?view=all*');
	run('wait', '--fn', 'document.querySelector("select[name=client]") !== null && !document.querySelector("select[name=client]").disabled && location.search.includes("client=") && document.querySelector(".film-toggle") !== null');
	assert.equal(evaluate('document.querySelector("select[name=client]").value'), company, 'Browser Back must restore the company selection');
	assert.deepEqual(evaluate('[...document.querySelectorAll("[data-project-id]")].map(n=>n.dataset.projectId)'), ids);
	assert.ok(evaluate('location.search.includes("client=") && location.search.includes("sort=title")'), 'Browser Back must restore the company URL before reload');
	run('reload');
	run('wait', '--fn', 'document.querySelector("select[name=client]") !== null && document.querySelector(".film-toggle") !== null');
	assert.equal(evaluate('document.querySelector("select[name=client]").value'), company);
	assert.deepEqual(evaluate('[...document.querySelectorAll("[data-project-id]")].map(n=>n.dataset.projectId)'), ids, 'Company selection must survive SSR reload');
	run('click', '.clear');
	run('wait', '--fn', '!location.search.includes("client=") && document.querySelector("select[name=client]").value === ""');
	assert.equal(evaluate('document.querySelector("select[name=sort]").value'), 'title', 'Clearing companies must preserve sort');
	console.log('PASS: no Showreel tag; immediate sorting/company filtering; URL/SSR persistence and clear');
} finally {
	try { run('close'); } catch { /* Preserve the original error. */ }
}
