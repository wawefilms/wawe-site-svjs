<script lang="ts">
	let { projectSlug }: { projectSlug?: string } = $props();
</script>

<section id="contact" class="site-container contact-cta" aria-labelledby="contact-title">
	<div><h2 id="contact-title" class="site-heading">Have a project in mind?</h2><p>Tell us what you’re making and where you need a production partner.</p></div>
	<a href={projectSlug ? `/contact?project=${encodeURIComponent(projectSlug)}` : '/contact'}>Discuss a project <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h16M13 5l7 7-7 7" /></svg></a>
</section>

<style>
	.contact-cta { padding-block: var(--section-space); display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
	h2 { font: var(--type-section-title); }
	p { font: var(--type-body); color: var(--color-surface-muted); margin-top: 1rem; }
	a { display: inline-flex; align-items: center; gap: 1.5rem; min-height: 48px; padding: .8rem 1.5rem; border: 1px solid var(--color-border-control); border-radius: 999px; font: var(--type-control); color: var(--color-surface-text); flex-shrink: 0; }
	@media (hover: hover) { a:hover { background: var(--color-action); color: var(--color-on-action); } }
	@media (max-width: 600px) { .contact-cta { align-items: flex-start; flex-direction: column; } }
</style>
