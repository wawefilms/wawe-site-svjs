<script lang="ts">
	import { enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let isSubmitting = $state(false);
	let token = $state('');
	let turnstile: Turnstile;
	const sitekey = env.PUBLIC_TURNSTILE_SITE_KEY || '';
</script>

<svelte:head>
	<title>Contact — WAWE Films</title>
	<meta name="description" content="Get in touch with WAWE Films." />
</svelte:head>

<div class="mx-auto max-w-2xl px-6 py-12">
	<h1 class="text-3xl font-semibold tracking-tight">Contact</h1>
	<p class="mt-2 text-neutral-600">Tell us about your project.</p>

	{#if (form as any)?.success}
		<div class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{(form as any).message}</div>
	{/if}

	<form
		method="POST"
		use:enhance={async ({ formData, cancel }) => {
			isSubmitting = true;
			if (token) formData.append('turnstileToken', token);
			else { cancel(); isSubmitting = false; return; }
			return async ({ update, result }) => {
				isSubmitting = false;
				if (result.type === 'failure') { token = ''; turnstile?.reset(); }
				await update();
			};
		}}
		class="mt-8 space-y-4"
	>
		<div>
			<label class="text-sm font-medium">Name</label>
			<input name="name" required class="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
			{#if (form as any)?.errors?.name}<p class="mt-1 text-xs text-red-600">{(form as any).errors.name[0]}</p>{/if}
		</div>
		<div>
			<label class="text-sm font-medium">Email</label>
			<input name="email" type="email" required class="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
			{#if (form as any)?.errors?.email}<p class="mt-1 text-xs text-red-600">{(form as any).errors.email[0]}</p>{/if}
		</div>
		<div>
			<label class="text-sm font-medium">Message</label>
			<textarea name="message" required rows="5" class="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"></textarea>
			{#if (form as any)?.errors?.message}<p class="mt-1 text-xs text-red-600">{(form as any).errors.message[0]}</p>{/if}
		</div>

		{#if sitekey}
			<Turnstile bind:this={turnstile} sitekey={sitekey} onVerify={(t)=> token=t} />
		{/if}

		<button
			disabled={isSubmitting}
			class="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
		>
			{isSubmitting ? 'Sending…' : 'Send message'}
		</button>
	</form>
</div>
