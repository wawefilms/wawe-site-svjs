<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	type TurnstileApi = {
		render: (el: HTMLElement, opts: Record<string, unknown>) => string;
		reset: (id?: string) => void;
		remove: (id: string) => void;
	};
	let {
		sitekey,
		onVerify,
		onError,
		onExpire,
		theme = 'light',
		size = 'flexible',
		appearance = 'interaction-only',
		action = 'contact'
	}: {
		sitekey: string;
		onVerify: (token: string) => void;
		onError?: (code: string) => void;
		onExpire?: () => void;
		theme?: 'light' | 'dark' | 'auto';
		size?: 'normal' | 'flexible' | 'compact';
		appearance?: 'always' | 'execute' | 'interaction-only';
		action?: string;
	} = $props();
	let container: HTMLDivElement;
	let widgetId: string | undefined;
	let failedToLoad = $state(false);
	function api(): Promise<TurnstileApi | null> {
		const w = window as typeof window & { turnstile?: TurnstileApi };
		if (w.turnstile) return Promise.resolve(w.turnstile);
		return new Promise((resolve) => {
			const started = Date.now();
			const timer = setInterval(() => {
				if (w.turnstile) { clearInterval(timer); resolve(w.turnstile); }
				else if (Date.now() - started > 10000) { clearInterval(timer); resolve(null); }
			}, 100);
		});
	}
	onMount(async () => {
		const ts = await api();
		if (!ts) { failedToLoad = true; onError?.('script-load-timeout'); return; }
		widgetId = ts.render(container, {
			sitekey, theme, size, appearance, action,
			callback: (token: string) => onVerify(token),
			'expired-callback': () => { ts.reset(widgetId); onExpire?.(); },
			'error-callback': (code?: string) => { onError?.(code ?? 'unknown'); return true; }
		});
	});
	onDestroy(() => {
		if (widgetId !== undefined) {
			try { (window as unknown as { turnstile?: TurnstileApi }).turnstile?.remove(widgetId); } catch {}
			widgetId = undefined;
		}
	});
	export function reset() { if (widgetId !== undefined) { (window as unknown as { turnstile?: TurnstileApi }).turnstile?.reset(widgetId); } }
</script>
<svelte:head>
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</svelte:head>
{#if !failedToLoad}<div bind:this={container}></div>{/if}
