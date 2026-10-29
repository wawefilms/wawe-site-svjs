<script lang="ts">
	let { id, open, homepage = false, onclose, onprojectsrequest }: {
		id: string; open: boolean; homepage?: boolean; onclose: () => void; onprojectsrequest?: () => void;
	} = $props();
</script>

<nav {id} aria-label="Main navigation" class:open inert={!open} aria-hidden={!open}>
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
	nav { position: absolute; right: 0; top: 100%; width: min(24rem, 100%); padding: 1rem 1.5rem; background: var(--color-surface); color: var(--color-surface-text); box-shadow: 0 1rem 2rem rgb(0 0 0 / .3); opacity: 0; visibility: hidden; transform: translateY(-6px); transition: opacity 140ms var(--ease-reveal), transform 140ms var(--ease-reveal), visibility 140ms; }
	nav.open { opacity: 1; visibility: visible; transform: translateY(0); transition-duration: var(--duration-menu); }
	nav.no-script { opacity: 1; visibility: visible; transform: none; display: flex; width: auto; gap: 1rem; padding: .25rem 1rem; }
	a { display: block; padding-block: .75rem; min-height: 44px; font: var(--type-menu); color: var(--color-surface-text); }
	@media (hover: hover) { a:hover { text-decoration: underline; text-underline-offset: .2em; } }
	@media (max-width: 600px) { nav { width: 100%; } }
	@media (prefers-reduced-motion: reduce) { nav, nav.open { transition: none; transform: none; } }
</style>
