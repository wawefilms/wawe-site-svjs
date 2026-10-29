import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../../app.css', import.meta.url), 'utf8');
const shared = ['components/ProjectCard.svelte', 'components/ContactCta.svelte', 'components/Nav.svelte', 'components/MenuPanel.svelte', 'components/Footer.svelte', 'components/ProjectFilters.svelte', 'projects/ProjectBrowser.svelte', 'projects/ProjectSort.svelte', 'home/ShowreelHero.svelte', '../routes/contact/+page.svelte', '../routes/project/[slug]/+page.svelte'];

test('shared UI consumes named type styles instead of independent font-size declarations', async () => {
	for (const name of ['page-title', 'section-title', 'card-title', 'subheading', 'navigation', 'menu', 'body', 'body-large', 'label', 'caption', 'control']) assert.ok(css.includes(`--type-${name}:`), name);
	for (const file of shared) {
		const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
		assert.match(source, /font: var\(--type-/, file);
		assert.doesNotMatch(source, /font-size:\s*(?:\d|\.|clamp\()/, file);
	}
});

test('primary and secondary reading colors meet AA on the shared surface', () => {
	const color = (name: string) => {
		const hex = css.match(new RegExp(`--color-${name}:\\s*(#[a-f0-9]{6})`, 'i'))?.[1];
		assert.ok(hex, name);
		const values = hex.slice(1).match(/../g)!.map(part => parseInt(part, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
		return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
	};
	for (const foreground of ['paper', 'surface-muted']) {
		const values = [color(foreground), color('midnight')].sort((a, b) => b - a);
		assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, foreground);
	}
});
