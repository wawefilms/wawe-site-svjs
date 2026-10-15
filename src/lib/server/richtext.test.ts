import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectSafeHtml, sanitizeRichText } from './richtext.ts';

test('preserves formatting and safe links while stripping scripts/events/styles', () => {
	const html = sanitizeRichText('<h2>Credits</h2><p><strong>Real</strong> <em>copy</em></p><ul><li>Item</li></ul><script>alert(1)</script><iframe src="https://evil.test"></iframe><a href="https://example.com" target="_blank" onclick="alert(1)" style="color:red">Link</a>');
	assert.match(html, /<h2>Credits<\/h2>/);
	assert.match(html, /<strong>Real<\/strong>/);
	assert.match(html, /rel="noopener noreferrer"/);
	assert.doesNotMatch(html, /script|iframe|onclick|style=|alert/);
});
test('unsafe URL schemes and protocol-relative links never survive', () => {
	for (const href of ['javascript:alert(1)', 'jav&#x61;script:alert(1)', 'data:text/html,x', '//evil.test', 'https://user:pass@example.com', 'vbscript:x']) assert.doesNotMatch(sanitizeRichText(`<a href="${href}">text</a>`), /href=/);
	for (const href of ['/contact', '#credits', 'mailto:hello@example.com', 'tel:+331234']) assert.match(sanitizeRichText(`<a href="${href}">text</a>`), /href=/);
});
test('only approved upload images pass and become safe proxy URLs', () => {
	const html = sanitizeRichText('<figure><img src="https://media.wawefilms.com/media/still.webp" alt="Still" width="1200" height="600" onerror="alert(1)"><figcaption>Film still</figcaption></figure>');
	assert.match(html, /src="\/api\/landing-media\?src=/);
	assert.match(html, /width="1200"/);
	assert.match(html, /<figcaption>Film still/);
	assert.doesNotMatch(html, /onerror/);
	for (const src of ['https://evil.test/x.png', 'data:image/png;base64,AAAA', '/api/media/file/film.mp4', 'https://media.wawefilms.com/media/%2e%2e.png']) assert.doesNotMatch(sanitizeRichText(`<img src="${src}">`), /<img/);
});
test('optional content empty; Lexical fallback formats escaped factual text', () => {
	assert.equal(projectSafeHtml({}), '');
	const html = projectSafeHtml({ content: { root: { type: 'root', version: 1, direction: null, format: '', indent: 0, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', text: '<script>not markup</script>', format: 1 }] }] } } });
	assert.match(html, /<strong>&lt;script&gt;not markup&lt;\/script&gt;<\/strong>/);
});
