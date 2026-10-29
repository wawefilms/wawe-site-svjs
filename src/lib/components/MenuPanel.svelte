<script lang="ts">
	import { onMount } from 'svelte';
	let { id, open, anchor, homepage = false, onclose, onprojectsrequest }: {
		id: string; open: boolean; anchor?: HTMLElement; homepage?: boolean; onclose: () => void; onprojectsrequest?: () => void;
	} = $props();
	let panel = $state<HTMLElement>();
	let top = $state(16), left = $state(16);
	function position() {
		if (!open || !anchor || !panel) return;
		const gap = 12, edge = 16;
		const trigger = anchor.getBoundingClientRect();
		const height = panel.offsetHeight, width = panel.offsetWidth;
		const below = trigger.bottom + gap;
		const above = trigger.top - gap - height;
		top = Math.max(edge, Math.min(below + height <= innerHeight - edge ? below : above, innerHeight - edge - height));
		left = Math.max(edge, Math.min(trigger.right - width, innerWidth - edge - width));
	}
	$effect(() => { if (open && panel && anchor) position(); });
	onMount(() => {
		const observer = new ResizeObserver(position);
		if (panel) observer.observe(panel);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		return () => { observer.disconnect(); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
	});
</script>

<nav {id} bind:this={panel} style:top={`${top}px`} style:left={`${left}px`} aria-label="Main navigation" class:open inert={!open} aria-hidden={!open}>
	<a href={homepage ? '#showreel' : '/#showreel'} onclick={onclose}>Showreel</a>
	<a href={homepage && onprojectsrequest ? '#projects' : '/?view=all#projects'} onclick={() => { if (homepage) onprojectsrequest?.(); onclose(); }}>Projects</a>
	<a href="/contact" onclick={onclose}>Contact</a>
</nav>
<noscript>
	<nav class="no-script" aria-label="Main navigation without JavaScript">
		<a href={homepage ? '#showreel' : '/#showreel'}>Showreel</a>
		<a href="/?view=all#projects">Projects</a>
		<a href="/contact">Contact</a>
	</nav>
</noscript>

<style>
	nav { position: fixed; width: min(24rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); overflow-y: auto; overscroll-behavior: contain; padding: 1rem 1.5rem; background: var(--color-surface); color: var(--color-surface-text); box-shadow: 0 1rem 2rem rgb(0 0 0 / .3); opacity: 0; visibility: hidden; transform: translateY(-6px); transition: opacity 140ms var(--ease-reveal), transform 140ms var(--ease-reveal), visibility 140ms; }
	nav.open { opacity: 1; visibility: visible; transform: translateY(0); transition-duration: var(--duration-menu); }
	nav.no-script { position: absolute; right: 0; top: 100%; opacity: 1; visibility: visible; transform: none; display: flex; width: auto; gap: 1rem; padding: .25rem 1rem; }
	a { display: block; padding-block: .75rem; min-height: 44px; font: var(--type-menu); color: var(--color-surface-text); }
	@media (hover: hover) { a:hover { text-decoration: underline; text-underline-offset: .2em; } }
	@media (max-width: 600px) { nav { width: calc(100vw - 2rem); } }
	@media (prefers-reduced-motion: reduce) { nav, nav.open { transition: none; transform: none; } }
</style>
