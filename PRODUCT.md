# Product — WAWE Films

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prospective clients and agencies evaluating the film portfolio and considering an enquiry. Confirmed by the user for the simplified homepage direction.

## Product Purpose

Let visitors watch the work, explore Projects, and contact WAWE Films. Success is a clear route from watching and evaluating real work to a client enquiry.

## Capabilities and Constraints

- Existing SvelteKit 2 / Svelte 5 site consuming Payload 3 content. Preserve the existing stack and working contact delivery, media fallbacks, and content routes.
- A Project is a film/video work in the `projects` collection; Media and Showreel remain separate concepts (see `CONTEXT.md`).
- Keep the existing ASCII wave intro. Replace the complicated settled showreel/stacking presentation, not the accepted wave calculations.
- Projects must be individually linkable; the homepage must expose five priority-ordered highlights and an in-place expandable, filterable, sortable complete catalogue.
- The Showreel scrolls away normally. Only the navigation bar sticks after scrolling up to the top. Confirmed by the user.
- Reuse factual Project and contact information. Do not fabricate credits, client claims, case-study results, services, or testimonials.
- Deployment approval and production content/media readiness remain separate from design implementation.

## Brand Commitments

- Preserve the WAWE Films name, actual logo asset and ASCII intro.
- The user supplied two reference screenshots for a simple Showreel above a WAWE logo / current client logo / Menu bar.
- The user explicitly requested Archivo Narrow for headings. Do not silently substitute the existing Archivo SemiCondensed width or Pilcrow Rounded for that request.

## Evidence on Hand

- Payload Projects, clients, tags, domains, Media and Showreel content; source schemas in the sibling `wawe-payload` repository.
- Existing Project pages and contact route in `src/routes`.
- `docs/references/simple-showreel-top.png` and `docs/references/simple-showreel-scroll.png`: user-provided layout references, not shipping media assets.
- Existing tokens, type assets, intro implementation and design history in `src/app.css`, `src/lib/intro`, `src/lib/landing`, and `docs`.

## Product Principles

- The actual films are the proof; the interface should make them easy to watch and explore.
- Browsing more Projects should stay in the page rather than interrupting exploration with navigation.
- Make enquiries easy without distracting from the work.
- Missing content stays missing or receives an honest fallback; it is never invented.

## Open Decisions

No new positioning claims, service taxonomy, audience segments, contact details or guarantees are approved by this document. Verify real content before publishing.
