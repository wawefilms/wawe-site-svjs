<script lang="ts">
	import { onMount } from 'svelte';
	type TurnstileApi = {
		render: (el: HTMLElement, opts: Record<string, unknown>) => string;
		reset: (id?: string) => void;
		remove: (id: string) => void;
	};
	let { sitekey, onVerify, onError, onExpire, theme = 'light', size = 'flexible', appearance = 'interaction-only', action = 'contact' }: {
		sitekey: string; onVerify: (token: string) => void; onError?: (code: string) => void; onExpire?: () => void;
		theme?: 'light' | 'dark' | 'auto'; size?: 'normal' | 'flexible' | 'compact';
		appearance?: 'always' | 'execute' | 'interaction-only'; action?: string;
	} = $props();
	let container: HTMLDivElement;
	let widgetId: string | undefined;
	let api: TurnstileApi | undefined;
	let failedToLoad = $state(false);
	onMount(() => {
		let stopped = false;
		let timer: ReturnType<typeof setTimeout>;
		const started = Date.now();
		function mount() {
			if (stopped) return;
			api = (window as typeof window & { turnstile?: TurnstileApi }).turnstile;
			if (!api) {
				if (Date.now() - started >= 10000) { failedToLoad = true; onError?.('script-load-timeout'); }
				else timer = setTimeout(mount, 100);
				return;
			}
			try {
				widgetId = api.render(container, {
					sitekey, theme, size, appearance, action, 'response-field': false,
					callback: (token: string) => { if (!stopped) onVerify(token); },
					'expired-callback': () => { if (!stopped) { onExpire?.(); api?.reset(widgetId); } },
					'error-callback': (code?: string) => { if (!stopped) onError?.(code ?? 'unknown'); return true; }
				});
			} catch { failedToLoad = true; onError?.('widget-render-failed'); }
		}
		mount();
		return () => {
			stopped = true; clearTimeout(timer);
			if (widgetId !== undefined) { try { api?.remove(widgetId); } catch { /* Already removed by provider. */ } }
			widgetId = undefined; api = undefined;
		};
	});
	export function reset() { if (widgetId !== undefined) api?.reset(widgetId); }
</script>
<svelte:head><script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script></svelte:head>
{#if failedToLoad}<p role="status">Spam check is unavailable. Please reload the page to retry.</p>{/if}
<div bind:this={container}></div>
