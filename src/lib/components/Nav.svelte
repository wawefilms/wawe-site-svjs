<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { ProjectIdentity } from '$lib/projects/model';
	import badge from '$lib/landing/assets/badge-mask.png';
	import { officialClientLogo } from '$lib/projects/client-logos';
	import MenuPanel from './MenuPanel.svelte';

	let { activeIdentity, homepage = false, onprojectsrequest, overlay = false }: {
		activeIdentity?: ProjectIdentity;
		homepage?: boolean;
		onprojectsrequest?: () => void;
		/** Compatibility only: this no longer makes the bar fixed. */
		overlay?: boolean;
	} = $props();
	const id = $props.id();
	let open = $state(false);
	let bar: HTMLElement;
	let trigger: HTMLButtonElement;
	let failedLogos = $state<string[]>([]);
	let reduced = $state(true);
	onMount(() => {
		const preference = matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => reduced = preference.matches;
		update(); preference.addEventListener('change', update);
		return () => preference.removeEventListener('change', update);
	});
	let identity = $derived(homepage || overlay ? activeIdentity : undefined);
	let client = $derived(identity?.clients.length === 1 ? identity.clients[0] : null);
	let label = $derived(identity?.label || 'SHOWREEL');
	const primaryLogo = $derived(client?.logoUrl && !failedLogos.includes(client.logoUrl) ? client.logoUrl : client ? officialClientLogo(client.title) : null);
	const artwork = $derived(primaryLogo && !failedLogos.includes(primaryLogo) ? primaryLogo : null);
	function close() { open = false; }
	function outside(event: PointerEvent) {
		if (open && event.target instanceof Node && !bar?.contains(event.target)) close();
	}
	function keyboard(event: KeyboardEvent) {
		if (open && event.key === 'Escape') { close(); trigger?.focus(); }
	}
	afterNavigate(close);
</script>

<svelte:window onpointerdown={outside} onkeydown={keyboard} />
<header class="identity-bar" bind:this={bar}>
	<div class="site-container bar-inner">
		<a href="/" class="brand" aria-label="WAWE Films — home"><span class="brand-art" aria-hidden="true" style:mask-image={`url(${badge})`}></span></a>
		{#if homepage || overlay}
			<span class="separator" aria-hidden="true"></span>
			<div class="identity" title={label}>
				{#snippet identityContent()}
					<span class="identity-motion">
						{#key `${label}:${artwork ?? ''}`}
							<span class="identity-content" transition:fade={{ duration: reduced ? 0 : 140 }}>
								{#if artwork}
									<img class="client-logo" src={artwork} alt={client?.title ?? label} onerror={() => { if (artwork) failedLogos = [...failedLogos, artwork]; }} />
								{:else}<span>{label}</span>{/if}
							</span>
						{/key}
					</span>
				{/snippet}
				{#if identity?.projectSlug}<a href="/project/{encodeURIComponent(identity.projectSlug)}" aria-label={label}>{@render identityContent()}</a>
				{:else}{@render identityContent()}{/if}
			</div>
		{/if}
		<button class="menu-trigger site-heading" bind:this={trigger} aria-expanded={open} aria-controls="{id}-menu" onclick={() => open = !open}>{open ? 'Close' : 'Menu'}</button>
		<MenuPanel id="{id}-menu" {open} homepage={homepage || overlay} onclose={close} {onprojectsrequest} />
	</div>
</header>

<style>
	.identity-bar { position: sticky; top: 0; z-index: 60; background: var(--color-surface); color: var(--color-surface-text); height: var(--bar-height); flex-shrink: 0; }
	.bar-inner { position: relative; height: 100%; display: flex; align-items: center; gap: clamp(1rem, 3vw, 3.5rem); }
	.brand { flex-shrink: 0; }
	.brand-art { display: block; width: clamp(3rem, 5.5vw, 5rem); aspect-ratio: 1; background: var(--color-surface-text); mask-size: contain; mask-repeat: no-repeat; mask-mode: luminance; }
	.separator { height: 2.25rem; width: 1px; background: var(--color-surface-muted); flex-shrink: 0; }
	.identity { min-width: 0; flex: 1; font: var(--type-navigation); }
	.identity span, .identity a { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
	.identity .identity-motion { display: grid; align-items: center; }
	.identity .identity-content { grid-area: 1 / 1; min-width: 0; }
	.client-logo { max-width: min(100%, 12rem); width: auto; height: clamp(1.25rem, 2vw, 1.8rem); object-fit: contain; object-position: left center; }
	.menu-trigger { margin-left: auto; flex-shrink: 0; min-height: 44px; min-width: 64px; cursor: pointer; font: var(--type-navigation); }
	@media (max-width: 380px) { .bar-inner { gap: .75rem; } .separator { height: 1.5rem; } .client-logo { height: 1.25rem; } }
</style>
