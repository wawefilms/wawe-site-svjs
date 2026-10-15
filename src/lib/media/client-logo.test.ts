import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clientLogoSource } from './client-logo.ts';
const cms = 'http://127.0.0.1:4320';
describe('CMS client artwork boundary', () => {
	it('accepts published raster artwork and the configured CMS file endpoint', () => {
		for (const url of ['https://media.wawefilms.com/media/logo.png', `${cms}/api/media/file/logo.png`]) assert.equal(clientLogoSource(url, 'image/png', cms), url);
	});
	it('rejects unrelated hosts, ports, arbitrary paths and credentials', () => {
		for (const url of ['https://evil.example/logo.png', 'http://127.0.0.1:9999/api/media/file/logo.png', `${cms}/private/logo.png`, 'http://user:pass@127.0.0.1:4320/api/media/file/logo.png']) assert.equal(clientLogoSource(url, 'image/png', cms), null);
	});
	it('rejects active content, encoded traversal, queries and malformed URLs', () => {
		for (const url of [`${cms}/api/media/file/logo.svg`, `${cms}/api/media/file/..%2Flogo.png`, `${cms}/api/media/file/logo.png?url=secret`, 'data:image/png;base64,bad', 'not a URL']) assert.equal(clientLogoSource(url, 'image/png', cms), null);
		assert.equal(clientLogoSource(`${cms}/api/media/file/logo.png`, 'image/svg+xml', cms), null);
	});
});
