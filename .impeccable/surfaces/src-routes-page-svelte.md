---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/routes/contact/+page.svelte","src/routes/project/[slug]/+page.svelte"]
---

# Simple Showreel homepage

Mode: Experience. Scope: homepage and shared navigation, Project and Contact surfaces. Direction and composition are user-pinned in docs/plan-simple-showreel.md and its two screenshots. This is code-led; no generated comp or random direction selection is claimed.

## Direction contract

THESIS: Real films lead; no marketing hero, card stack, fan or filmstrip.

OWN-WORLD: Midnight Ink ground, warm-paper foreground, real WAWE badge, Archivo Narrow headings and Archivo UI; generous aligned gutters and softly rounded film edges. Preserve the opening's own type and palette.

STORY: Watch the Showreel, recognize the current verified client, explore five priority-selected Projects, expand the same catalogue, enquire.

FIRST VIEWPORT: The accepted ASCII wave opens fullscreen at 100dvh, then reveals the actual contained player and dismisses; kernel/type/palette stay unchanged. Top-flush native film fills the centred container at its actual decoded ratio, uncropped with equal gutters; the identity bar follows naturally rather than imposing a viewport-height width cap. Badge, separator and active client sit left; Menu sits right. Mobile preserves the film ratio. Only the below-film bar becomes sticky.

FORM: User-pinned reference composition; no ordered candidate list or seed was generated. Signature interaction: the same five keyed Projects expand into the full archive, pushing Contact/Footer through a bounded measured-height transition; filters and sorting retain URL state. Reduced motion settles instantly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

Keep accepted wave calculations, full-catalogue cue resolution, source allowlists, cancellation, truthful content and existing provider choices. No commit, push, deployment or real QA email. Production CMS content writes are now authorized ONLY for the three official client logos, supplied 14-segment Showreel/video/poster configuration and deletion of the exact redundant montage Project after independent Showreel verification, retaining Media. These writes remain blocked pending deployed global/schema and normal admin authentication; no other CMS mutation is authorized. Preserve unrelated dirty changes. Implementation must pass type, unit, build and browser gates before completion.
