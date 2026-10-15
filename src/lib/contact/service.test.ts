import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactAvailable, contactConfig, projectMessage, submitContact, type ContactConfig, type ContactProviders, type MailRequest } from './service.ts';

const config: ContactConfig = { siteKey: 'site', secretKey: 'secret', hostnames: ['wawefilms.com'], mailKey: 'mail', sender: 'WAWE Films <from@example.test>', receiver: 'to@example.test' };
function form(overrides: Record<string, string> = {}) {
	const data = new FormData();
	for (const [key, value] of Object.entries({ name: 'Jane', email: 'jane@example.test', message: 'A real project enquiry.', turnstileToken: 'token', ...overrides })) data.set(key, value);
	return data;
}
function mock(verification: unknown = { success: true, action: 'contact', hostname: 'wawefilms.com' }) {
	const calls: MailRequest[] = [];
	let fetches = 0;
	const providers: ContactProviders = {
		fetch: async (_url, init) => { fetches++; assert.equal(new URLSearchParams(String(init?.body)).get('response'), 'token'); return Response.json(verification); },
		send: async mail => { calls.push(mail); return { data: { id: 'mock-only' } }; }
	};
	return { providers, calls, get fetches() { return fetches; } };
}
test('configuration uses server site key and normalizes configured hostnames', () => {
	const result = contactConfig({ TURNSTILE_SITE_KEY: ' server-key ', TURNSTILE_HOSTNAMES: 'WAWEFILMS.COM, www.wawefilms.com' });
	assert.equal(result.siteKey, 'server-key'); assert.deepEqual(result.hostnames, ['wawefilms.com', 'www.wawefilms.com']); assert.equal(contactAvailable(result), false);
});
test('every required config field fails closed without provider calls', async () => {
	for (const key of ['siteKey', 'secretKey', 'mailKey', 'sender', 'receiver'] as const) {
		const mocked = mock(); const result = await submitContact(form(), { ...config, [key]: '' }, mocked.providers);
		assert.equal(result.status, 503); assert.equal(result.success, false); assert.match(result.message, /not been sent/); assert.equal(mocked.fetches, 0); assert.equal(mocked.calls.length, 0);
	}
});
test('validation retains values and exposes inline errors without network', async () => {
	const mocked = mock(); const result = await submitContact(form({ email: 'bad', name: '', message: 'short', turnstileToken: '' }), config, mocked.providers);
	assert.equal(result.status, 400); assert.ok(result.errors.name); assert.ok(result.errors.email); assert.ok(result.errors.message); assert.ok(result.errors.turnstileToken); assert.equal(result.values.email, 'bad'); assert.equal(mocked.fetches, 0);
});
test('invalid spam results, mismatched action/hostname and missing hostname never send mail', async () => {
	for (const value of [{ success: false }, { success: true, action: 'other', hostname: 'wawefilms.com' }, { success: true, action: 'contact', hostname: 'evil.test' }, { success: true, action: 'contact' }, null]) {
		const mocked = mock(value); const result = await submitContact(form(), config, mocked.providers);
		assert.equal(result.success, false); assert.equal(mocked.calls.length, 0); assert.equal(result.values.name, 'Jane');
	}
});
test('hostname allowlist is optional but action is always checked', async () => {
	const mocked = mock({ success: true, action: 'contact' });
	assert.equal((await submitContact(form(), { ...config, hostnames: [] }, mocked.providers)).success, true);
});
test('spam network errors and HTTP errors fail without sending', async () => {
	for (const fetch of [async () => { throw new Error('private provider detail'); }, async () => new Response('', { status: 500 })]) {
		const mocked = mock(); mocked.providers.fetch = fetch;
		const result = await submitContact(form(), config, mocked.providers);
		assert.equal(result.status, 503); assert.equal(mocked.calls.length, 0); assert.doesNotMatch(JSON.stringify(result), /private provider detail/);
	}
});
test('mail error, exception and missing acceptance ID do not pretend delivery', async () => {
	for (const send of [async () => ({ error: new Error('private delivery detail') }), async () => { throw new Error('private delivery detail'); }, async () => ({ data: null })]) {
		const mocked = mock(); mocked.providers.send = send;
		const result = await submitContact(form(), config, mocked.providers);
		assert.equal(result.success, false); assert.equal(result.status, 503); assert.equal(result.values.message, 'A real project enquiry.'); assert.doesNotMatch(JSON.stringify(result), /private delivery detail/);
	}
});
test('mock success uses configured sender and reply-to, clears submitted values', async () => {
	const mocked = mock(); const result = await submitContact(form(), config, mocked.providers);
	assert.equal(result.success, true); assert.deepEqual(result.values, { name: '', email: '', message: '' }); assert.equal(mocked.calls[0].from, config.sender); assert.equal(mocked.calls[0].replyTo, 'jane@example.test');
});
test('header injection and excessive fields are rejected', async () => {
	for (const fields of [{ name: 'Jane\r\nBcc: evil@example.test' }, { message: 'x'.repeat(10001) }, { name: 'x'.repeat(121) }] as Record<string, string>[]) {
		const mocked = mock(); assert.equal((await submitContact(form(fields), config, mocked.providers)).status, 400); assert.equal(mocked.fetches, 0);
	}
});
test('optional project context only accepts bounded slug characters', () => {
	assert.match(projectMessage('a-project'), /a-project/);
	for (const slug of [null, '<script>', 'a\nBcc:someone', 'x'.repeat(121), '../unsafe']) assert.equal(projectMessage(slug), '');
});
