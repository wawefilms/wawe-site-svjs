<script lang="ts">
	let { projectSlug }: { projectSlug?: string } = $props();
</script>

<section id="contact" class="site-container contact-cta" aria-labelledby="contact-title">
	<div><h2 id="contact-title" class="site-heading">Contact us</h2><p>Tell us about your project.</p></div>
	<a href={projectSlug ? `/contact?project=${encodeURIComponent(projectSlug)}` : '/contact'}>Get in touch <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16M13 5l7 7-7 7" /></svg></a>
</section>

<style>
	.contact-cta { padding-block: var(--section-space); display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
	h2 { font-size: clamp(2.5rem, 5vw, 4.5rem); }
	p { color: var(--color-surface-muted); margin-top: 1rem; }
	a { display: inline-flex; align-items: center; gap: 1.5rem; min-height: 48px; padding: .8rem 1.5rem; border: 1px solid currentColor; border-radius: 999px; font-size: 1rem; flex-shrink: 0; }
	@media (hover: hover) { a:hover { background: var(--color-paper); color: var(--color-midnight); } }
	@media (max-width: 600px) { .contact-cta { align-items: flex-start; flex-direction: column; } }
</style>
