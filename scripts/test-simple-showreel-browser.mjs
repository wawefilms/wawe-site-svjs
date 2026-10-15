import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Run against a built preview with a read-only catalogue fixture (>=6 Projects,
// at least one Tag producing a non-empty subset). Never submits contact or writes CMS.
const origin = process.env.BROWSER_TEST_URL ?? 'http://127.0.0.1:4181';
const session = `wawe-history-test-${process.pid}`;
function run(...args) {
	const output = execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 35000 });
	const result = JSON.parse(output);
	if (!result.success) throw new Error(result.error ?? output);
	return result.data;
}
const evaluate = code => run('eval', code).result;
try {
	run('open', origin + '/');
	run('wait', '--fn', 'document.querySelector(".toggle") !== null');
	run('wait', '--fn', 'document.querySelector(".intro.active") !== null');
	const intro = evaluate('(() => { const el=document.querySelector(".intro.active"), r=el.getBoundingClientRect(); return {position:getComputedStyle(el).position,left:r.left,top:r.top,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight,videos:document.querySelectorAll("video").length}; })()');
	assert.equal(intro.position, 'fixed', 'ASCII intro must be viewport-fixed, not film-contained');
	assert.ok(Math.abs(intro.left) < 1 && Math.abs(intro.top) < 1);
	assert.ok(Math.abs(intro.width - intro.viewportWidth) < 2 && Math.abs(intro.height - intro.viewportHeight) < 2, 'Active ASCII field must cover the full viewport');
	assert.equal(intro.videos, 1, 'Fullscreen opening must not add a second player');
	assert.ok(evaluate('document.querySelector(".toggle").closest("#projects header") !== null'), 'View all must sit in the Projects heading before the grid');
	assert.equal(evaluate('document.querySelector(".grid a[href*=\\"wawe-films-showreel\\"]") === null'), true, 'Montage must not appear as a redundant gallery card');
	console.log('PASS: fullscreen ASCII intro, heading-level archive toggle and no redundant montage card');
	run('wait', '--fn', 'document.querySelector(".film-toggle") !== null && document.querySelector("video").readyState >= 2');
	// The HTML-only annotation copy could not hydrate. Exercise real controls here.
	evaluate('document.querySelector(".intro button")?.click(); document.querySelector("video").pause(); true');
	run('wait', '--fn', 'document.querySelector(".film-toggle").getAttribute("aria-label") === "Play showreel"');
	assert.equal(evaluate('document.querySelector("video").controls'), false, 'Enhanced Showreel must hide the native play bar');
	for (const width of [390, 1512]) {
		run('set', 'viewport', String(width), '900');
		const geometry = evaluate('(() => { const v=document.querySelector("video"), f=document.querySelector(".film"), r=v.getBoundingClientRect(); return {left:r.left,right:innerWidth-r.right,width:r.width,filmWidth:f.getBoundingClientRect().width,ratio:r.width/r.height,intrinsic:v.videoWidth/v.videoHeight,fit:getComputedStyle(v).objectFit,overflow:document.documentElement.scrollWidth>innerWidth}; })()');
		assert.ok(Math.abs(geometry.left - geometry.right) < 2, 'Video must have equal left/right gutters');
		assert.ok(Math.abs(geometry.width - geometry.filmWidth) < 2, 'Video must occupy its full film wrapper');
		assert.ok(Math.abs(geometry.ratio - geometry.intrinsic) < .01, 'Layout must preserve the decoded full video ratio');
		assert.equal(geometry.fit, 'contain');
		assert.equal(geometry.overflow, false);
		evaluate('window.scrollTo(0, 0); true');
		const opening = evaluate('(() => { const gap=document.querySelector(".opening-breathing-room").getBoundingClientRect(), nav=document.querySelector(".identity-bar .site-container").getBoundingClientRect(), film=document.querySelector(".film").getBoundingClientRect(); return {gap:gap.height,bottom:gap.bottom,viewport:innerHeight,navWidth:nav.width,filmWidth:film.width}; })()');
		assert.ok(opening.gap >= 20, 'Opening must reserve explicit bottom breathing room');
		assert.ok(Math.abs(opening.navWidth - opening.filmWidth) < 2, 'Film and navigation must share the same gutter');
		if (width >= 900) assert.ok(opening.bottom <= opening.viewport + 2, 'Desktop film + navigation + bottom padding must fit the viewport');
	}
	run('click', '.film-toggle');
	run('wait', '--fn', '!document.querySelector("video").paused');
	run('click', '.film-toggle');
	run('wait', '--fn', 'document.querySelector("video").paused');
	run('click', '.mute-toggle');
	run('wait', '--fn', '!document.querySelector("video").muted');
	run('click', '.mute-toggle');
	run('wait', '--fn', 'document.querySelector("video").muted');
	if (process.env.BROWSER_TEST_APPROVED_CUES === '1') {
		for (const [time, title, path] of [[1, 'Outskill', '/clients/outskill-paper.png'], [3, 'Razorpay', '/clients/razorpay-white.png'], [33, 'Wispr Flow', '/clients/wispr-flow-paper.png']]) {
			evaluate(`document.querySelector("video").currentTime = ${time}; true`);
			run('wait', '--fn', `!document.querySelector("video").seeking && document.querySelector("video").readyState >= 2 && document.querySelector(".client-logo")?.alt === ${JSON.stringify(title)} && document.querySelector(".client-logo").naturalWidth > 0`);
			const src = evaluate('document.querySelector(".client-logo").getAttribute("src")');
			if (process.env.BROWSER_TEST_CMS_LOGOS === '1') assert.match(src, /^\/api\/client-logo\/[1-9]\d*\?asset=[1-9]\d*$/);
			else assert.equal(src, path);
		}
		console.log('PASS: supplied 14-segment timeline switches all three official client logos');
	}
	// Optional synthetic fixture windows; never treated as editorial timing.
	if (process.env.BROWSER_TEST_RAZORPAY_TIME && process.env.BROWSER_TEST_CUE_GAP_TIME) {
		const logoTime = Number(process.env.BROWSER_TEST_RAZORPAY_TIME);
		const gapTime = Number(process.env.BROWSER_TEST_CUE_GAP_TIME);
		assert.ok(Number.isFinite(logoTime) && Number.isFinite(gapTime));
		evaluate(`document.querySelector("video").currentTime = ${logoTime}; true`);
		run('wait', '--fn', '!document.querySelector("video").seeking && document.querySelector("video").readyState >= 2 && document.querySelector(".client-logo")?.alt === "Razorpay" && document.querySelector(".client-logo").naturalWidth > 0');
		assert.equal(evaluate('document.querySelector(".client-logo").getAttribute("src")'), '/clients/razorpay-white.png');
		evaluate(`document.querySelector("video").currentTime = ${gapTime}; true`);
		run('wait', '--fn', 'document.querySelector(".client-logo") === null');
		console.log('PASS: cue-matched official Razorpay logo and cue-gap clearing');
	}
	run('click', '.menu-trigger');
	run('wait', '--fn', 'document.querySelector(".menu-trigger").getAttribute("aria-expanded") === "true"');
	run('wait', '--fn', 'getComputedStyle(document.querySelector("nav[aria-label=\\"Main navigation\\"]")).visibility === "visible"');
	assert.equal(evaluate('getComputedStyle(document.querySelector("nav[aria-label=\\"Main navigation\\"]")).visibility'), 'visible');
	run('press', 'Escape');
	run('wait', '--fn', 'document.querySelector(".menu-trigger").getAttribute("aria-expanded") === "false"');
	assert.equal(evaluate('document.activeElement === document.querySelector(".menu-trigger")'), true, 'Escape must return Menu focus');
	console.log('PASS: centered uncropped video, tap playback/mute controls and working Menu');
	evaluate('window.__firstFive = Array.from(document.querySelectorAll("[data-project-id]")); true');
	run('find', 'role', 'link', 'click', '--name', 'View all projects');
	run('wait', '--fn', 'location.search.includes("view=all") && document.querySelector(".toggle").getAttribute("aria-disabled") === "false"');
	assert.equal(evaluate('window.__firstFive.every(n => document.contains(n))'), true, 'Expansion must preserve original keyed nodes');
	const option = evaluate('Array.from(document.querySelectorAll("select[name=tag] option")).find(o => o.value && o.textContent === "Spec Ads")?.value ?? Array.from(document.querySelectorAll("select[name=tag] option")).find(o => o.value)?.value');
	assert.ok(option, 'Fixture needs a populated Tag');
	run('select', 'select[name="tag"]', option);
	run('select', 'select[name="sort"]', 'title');
	run('find', 'role', 'button', 'click', '--name', 'Apply');
	run('wait', '--fn', `location.search.includes("tag=${option}") && location.search.includes("sort=title") && document.querySelector(".toggle").getAttribute("aria-disabled") === "false"`);
	const before = evaluate('({url:location.href,ids:Array.from(document.querySelectorAll("[data-project-id]")).map(n=>n.dataset.projectId)})');
	assert.ok(before.ids.length, 'Fixture Tag must have Projects');
	run('click', '.grid a');
	run('wait', '--url', '**/project/**');
	evaluate('history.back(); true');
	run('wait', '--url', '**/?view=all*');
	run('wait', '--fn', 'document.querySelector(".grid") !== null && document.querySelector(".toggle")?.getAttribute("aria-disabled") === "false"');
	const after = evaluate('({url:location.href,ids:Array.from(document.querySelectorAll("[data-project-id]")).map(n=>n.dataset.projectId),heading:document.querySelector("#projects-title").textContent,tag:document.querySelector("select[name=tag]")?.value,sort:document.querySelector("select[name=sort]")?.value})');
	assert.equal(after.url, before.url);
	assert.deepEqual(after.ids, before.ids, 'Browser Back must restore the shallow-created filtered archive, not cached highlights');
	assert.equal(after.heading, 'All Projects');
	assert.equal(after.tag, option);
	assert.equal(after.sort, 'title');
	console.log('PASS: keyed expansion and shallow archive → Project → browser Back restoration');
} finally {
	try { run('close'); } catch { /* Preserve original failure while cleaning up. */ }
}
