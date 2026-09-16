import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
	turnstileToken: z.string().min(1, 'Spam check token is missing')
});

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const parsed = await schema.safeParseAsync({
			name: formData.get('name'),
			email: formData.get('email'),
			message: formData.get('message'),
			turnstileToken: formData.get('turnstileToken')
		});
		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}
		const secretKey = env.TURNSTILE_SECRET_KEY || '';
		const token = parsed.data.turnstileToken;
		if (secretKey) {
			try {
				const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({ secret: secretKey, response: token })
				});
				const out = (await verify.json()) as { success: boolean };
				if (!out.success) return fail(400, { errors: { turnstileToken: ['Spam check failed'] } });
			} catch {
				return fail(400, { errors: { turnstileToken: ['Spam check failed'] } });
			}
		}
		const resendApiKey = env.RESEND_API_KEY;
		const resendSender = env.RESEND_EMAIL_SENDER;
		const resendReceiver = env.RESEND_EMAIL_RECEIVER;
		if (!resendApiKey || !resendSender || !resendReceiver) {
			console.warn('RESEND env missing — logging instead of sending', parsed.data);
			return { success: true, message: 'Message received (email not configured).' };
		}
		const resend = new Resend(resendApiKey);
		const { error } = await resend.emails.send({
			from: `${parsed.data.name} <${resendSender}>`,
			to: resendReceiver,
			subject: `Contact from ${parsed.data.name}`,
			replyTo: parsed.data.email,
			text: parsed.data.message
		});
		if (error) return fail(500, { errors: { _global: [String(error)] } });
		return { success: true, message: 'Thanks — we will be in touch.' };
	}
} satisfies Actions;
