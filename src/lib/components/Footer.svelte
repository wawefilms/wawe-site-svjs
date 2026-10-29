<footer>
	<div class="site-container footer-inner">
		<p>© {new Date().getFullYear()} WAWE Films · All rights reserved.</p>
		<nav aria-label="Footer navigation"><a href="/?view=all#projects">Projects</a><a href="/contact">Contact</a></nav>
	</div>
</footer>

<style>
	footer { flex-shrink: 0; background: var(--color-surface); color: var(--color-surface-muted); border-top: 1px solid var(--color-border); padding-block: 1.5rem calc(1.5rem + env(safe-area-inset-bottom)); font: var(--type-caption); }
	.footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem 2rem; flex-wrap: wrap; }
	nav { display: flex; gap: 1.5rem; }
	a { display: inline-flex; align-items: center; min-height: 44px; font: var(--type-control); color: var(--color-surface-text); }
	@media (hover: hover) { a:hover { text-decoration: underline; } }
</style>
