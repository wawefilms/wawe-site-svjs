import { z } from 'zod';

export interface ContactConfig {
	siteKey: string; secretKey: string; hostnames: string[];
	mailKey: string; sender: string; receiver: string;
}
export interface ContactValues { name: string; email: string; message: string }
export type ContactErrors = Partial<Record<keyof ContactValues | 'turnstileToken' | '_global', string[]>>;
export interface ContactResult {
	status: number; success: boolean; message: string; values: ContactValues; errors: ContactErrors;
}
export interface MailRequest { from: string; to: string; subject: string; replyTo: string; text: string }
export interface ContactProviders {
	fetch: typeof fetch;
	send: (mail: MailRequest) => Promise<{ data?: { id: string } | null; error?: unknown }>;
}
export function contactConfig(env: Record<string, string | undefined>): ContactConfig {
	return {
		siteKey: env.TURNSTILE_SITE_KEY?.trim() || '', secretKey: env.TURNSTILE_SECRET_KEY?.trim() || '',
		hostnames: (env.TURNSTILE_HOSTNAMES || '').split(/[\s,]+/).map(value => value.toLowerCase()).filter(Boolean),
		mailKey: env.RESEND_API_KEY?.trim() || '', sender: env.RESEND_EMAIL_SENDER?.trim() || '', receiver: env.RESEND_EMAIL_RECEIVER?.trim() || ''
	};
}
export function contactAvailable(config: ContactConfig): boolean {
	return !!(config.siteKey && config.secretKey && config.mailKey && config.sender && config.receiver);
}
export function projectMessage(slug: string | null): string {
	return slug && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(slug) ? `I'd like to discuss a project related to ${slug}.\n\n` : '';
}
const schema = z.object({
	name: z.string().trim().min(1, 'Enter your name.').max(120, 'Use no more than 120 characters.').regex(/^[^\r\n]+$/, 'Enter your name on one line.'),
	email: z.string().trim().email('Enter a valid email address.').max(254, 'Email address is too long.'),
	message: z.string().trim().min(10, 'Write at least 10 characters.').max(10000, 'Use no more than 10,000 characters.'),
	turnstileToken: z.string().min(1, 'Complete the spam check.').max(2048, 'Spam check is invalid. Please retry.')
});
const unavailable = 'Contact is temporarily unavailable. Please try again later. Your message has not been sent.';

/** No environment reads or live providers: callers inject both. Never logs submissions. */
export async function submitContact(form: FormData, config: ContactConfig, providers: ContactProviders): Promise<ContactResult> {
	const field = (name: string, max: number) => { const value = form.get(name); return typeof value === 'string' ? value.slice(0, max + 1) : ''; };
	const values = { name: field('name', 120), email: field('email', 254), message: field('message', 10000) };
	const failure = (status: number, message: string, errors: ContactErrors = { _global: [message] }): ContactResult => ({ status, success: false, message, values, errors });
	if (!contactAvailable(config)) return failure(503, unavailable);
	const parsed = schema.safeParse({ ...values, turnstileToken: field('turnstileToken', 2048) });
	if (!parsed.success) return failure(400, 'Check the highlighted fields. Your message has not been sent.', parsed.error.flatten().fieldErrors);
	try {
		const response = await providers.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ secret: config.secretKey, response: parsed.data.turnstileToken }),
			signal: AbortSignal.timeout(10000)
		});
		if (!response.ok) return failure(503, 'Spam check is unavailable. Please retry. Your message has not been sent.');
		const verification: unknown = await response.json();
		if (!verification || typeof verification !== 'object') throw new Error('Invalid verification');
		const result = verification as { success?: unknown; hostname?: unknown; action?: unknown };
		if (result.success !== true || result.action !== 'contact' || (config.hostnames.length && (typeof result.hostname !== 'string' || !config.hostnames.includes(result.hostname.toLowerCase())))) {
			return failure(400, 'Spam check failed. Please retry. Your message has not been sent.', { turnstileToken: ['Complete the spam check again.'] });
		}
	} catch { return failure(503, 'Spam check is unavailable. Please retry. Your message has not been sent.'); }
	try {
		const result = await providers.send({ from: config.sender, to: config.receiver, subject: `Contact from ${parsed.data.name}`, replyTo: parsed.data.email, text: parsed.data.message });
		if (result.error || !result.data?.id) return failure(503, unavailable);
	} catch { return failure(503, unavailable); }
	return { status: 200, success: true, message: 'Thanks — your message has been sent. We will be in touch.', values: { name: '', email: '', message: '' }, errors: {} };
}
