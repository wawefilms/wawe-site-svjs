<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { contactMetadata } from '$lib/seo/metadata';
	import type { ActionData, PageData } from './$types';
	let { form, data }: { form: ActionData; data: PageData } = $props();
	let isSubmitting = $state(false);
	let token = $state('');
	let clientError = $state('');
	let turnstile = $state<Turnstile>();
	let feedback: HTMLDivElement;
	let nameInput: HTMLInputElement;
	let emailInput: HTMLInputElement;
	let messageInput: HTMLTextAreaElement;
	async function focusFeedback() { await tick(); feedback?.focus(); }
</script>

<Seo meta={contactMetadata(data.site.siteURL, data.site)} />

<section class="site-container contact-page" aria-labelledby="contact-heading">
	<h1 id="contact-heading" class="site-heading">Contact</h1>
	<p class="invitation">Tell us about your project.</p>
	<div class="feedback" bind:this={feedback} tabindex="-1" aria-live="polite" aria-atomic="true">
		{#if !data.available}<p>{form?.message ?? 'The contact form is temporarily unavailable. Please try again later; submissions are disabled.'}</p>
		{:else if clientError}<p>{clientError}</p>
		{:else if form?.message}<p>{form.message}</p>{/if}
	</div>
	<form method="POST" aria-busy={isSubmitting} use:enhance={({ formData, cancel }) => {
		clientError = '';
		if (!data.available || !token) {
			cancel(); clientError = !data.available ? 'Contact is temporarily unavailable. Please try again later.' : 'Complete the spam check before sending.';
			void focusFeedback(); return;
		}
		formData.set('turnstileToken', token);
		isSubmitting = true;
		return async ({ update, result }) => {
			if (result.type === 'error') {
				isSubmitting = false; token = ''; turnstile?.reset();
				clientError = 'Sending failed. Your message has not been sent. Please retry.';
				await focusFeedback(); return;
			}
			await update({ reset: false });
			isSubmitting = false;
			token = ''; turnstile?.reset();
			await tick();
			if (form?.errors?.name) nameInput.focus();
			else if (form?.errors?.email) emailInput.focus();
			else if (form?.errors?.message) messageInput.focus();
			else feedback?.focus();
		};
	}}>
		<fieldset disabled={!data.available || isSubmitting}>
			<legend class="sr-only">Your enquiry</legend>
		<div class="field">
			<label for="contact-name">Name</label>
			<input bind:this={nameInput} id="contact-name" name="name" autocomplete="name" required maxlength="120" value={form?.values?.name ?? ''} aria-invalid={!!form?.errors?.name} aria-describedby={form?.errors?.name ? 'name-error' : undefined} />
			{#if form?.errors?.name}<p id="name-error" class="field-error">{form.errors.name[0]}</p>{/if}
		</div>
		<div class="field">
			<label for="contact-email">Email</label>
			<input bind:this={emailInput} id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" value={form?.values?.email ?? ''} aria-invalid={!!form?.errors?.email} aria-describedby={form?.errors?.email ? 'email-error' : undefined} />
			{#if form?.errors?.email}<p id="email-error" class="field-error">{form.errors.email[0]}</p>{/if}
		</div>
		<div class="field">
			<label for="contact-message">Message</label>
			<textarea bind:this={messageInput} id="contact-message" name="message" autocomplete="off" required minlength="10" maxlength="10000" rows="6" value={form?.values?.message ?? data.initialMessage} aria-invalid={!!form?.errors?.message} aria-describedby={form?.errors?.message ? 'message-error' : undefined}></textarea>
			{#if form?.errors?.message}<p id="message-error" class="field-error">{form.errors.message[0]}</p>{/if}
		</div>
		{#if data.siteKey && data.available}
			<Turnstile bind:this={turnstile} sitekey={data.siteKey} theme="dark" onVerify={value => { token = value; clientError = ''; }} onExpire={() => { token = ''; clientError = 'Spam check expired. Please complete it again.'; }} onError={() => { token = ''; clientError = 'Spam check could not load. Please reload the page and retry.'; }} />
			{#if form?.errors?.turnstileToken}<p class="field-error">{form.errors.turnstileToken[0]}</p>{/if}
		{/if}
		{#if form?.errors?._global}<p class="field-error">{form.errors._global[0]}</p>{/if}
		<noscript><p>JavaScript is required for the spam check. Please enable it to send this form.</p></noscript>
		<button disabled={isSubmitting || !data.available} type="submit">{isSubmitting ? 'Sending…' : 'Send message'}</button>
		</fieldset>
	</form>
</section>

<style>
	.contact-page { max-width: 46rem; padding-block: clamp(3rem, 6vw, 6rem) var(--section-space); }
	.invitation { margin-top: 1rem; font: var(--type-body); color: var(--color-surface-muted); }
	.feedback { margin-top: 1.5rem; font: var(--type-body); }
	form { display: grid; gap: 1.5rem; margin-top: 2rem; }
	fieldset { display: grid; gap: 1.5rem; min-width: 0; border: 0; padding: 0; margin: 0; }
	fieldset:disabled :is(input, textarea) { opacity: .6; cursor: not-allowed; }
	.field { display: grid; gap: .5rem; }
	label { font: var(--type-label); }
	input, textarea { width: 100%; border: 1px solid var(--color-border-control); background: transparent; color: var(--color-surface-text); border-radius: .5rem; padding: .85rem 1rem; font: var(--type-body); }
	textarea { resize: vertical; min-height: 10rem; }
	.field-error { color: var(--color-surface-text); font: var(--type-body); }
	[aria-invalid='true'] { border-width: 2px; }
	button { justify-self: start; min-height: 48px; padding: .8rem 1.75rem; background: var(--color-action); color: var(--color-on-action); font: var(--type-control); border-radius: 999px; cursor: pointer; }
	button:disabled { opacity: .6; cursor: not-allowed; }
	@media (hover: hover) { button:not(:disabled):hover { text-decoration: underline; text-underline-offset: .2em; } }
</style>
