import { fail } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { contactAvailable, contactConfig, projectMessage, submitContact } from '$lib/contact/service';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const config = contactConfig(env);
	const available = contactAvailable(config);
	return { siteKey: available ? config.siteKey : '', available, initialMessage: projectMessage(url.searchParams.get('project')) };
};

export const actions = {
	default: async ({ request, fetch }) => {
		const config = contactConfig(env);
		const result = await submitContact(await request.formData(), config, {
			fetch,
			send: async mail => new Resend(config.mailKey).emails.send(mail)
		});
		return result.success ? result : fail(result.status, result);
	}
} satisfies Actions;
