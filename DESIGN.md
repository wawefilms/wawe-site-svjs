---
name: WAWE Films
description: Real films on a dark ground with Archivo Narrow headings.
colors:
  midnight: "#040e19"
  paper: "#f0e3d1"
  surface-text: "#f0e3d1"
  surface-muted: "#bdb8ac"
  surface: "{colors.midnight}"
  surface-raised: "color-mix(in srgb, var(--color-paper) 8%, var(--color-midnight))"
  border: "color-mix(in srgb, var(--color-paper) 20%, transparent)"
  border-control: "color-mix(in srgb, var(--color-paper) 35%, transparent)"
  action: "{colors.paper}"
  on-action: "{colors.midnight}"
  focus: "{colors.paper}"
typography:
  heading:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontWeight: 600
    lineHeight: 1.08
  page-title:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "clamp(2.75rem, 6vw, 6rem)"
    fontWeight: 600
    lineHeight: 1.04
  archive-title:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "clamp(2.5rem, 4vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.08
  card-title:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "clamp(1.5rem, 2.2vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.12
  subheading:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
  navigation:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "clamp(1.25rem, 2vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.2
  menu:
    fontFamily: '"Archivo Narrow", "Archivo", sans-serif'
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-large:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  card-description:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  field:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: ".875rem"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: ".875rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  film: "1rem"
  archive-control: ".4rem"
  field: ".5rem"
  contact-action: "999px"
spacing:
  site-gutter: "clamp(1.25rem, 5.2vw, 6rem)"
  section-space: "clamp(4rem, 8vw, 9rem)"
  form-gap: "1.5rem"
components:
  archive-action:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.archive-control}"
    padding: ".75rem 1.25rem"
  contact-submit:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.contact-action}"
    padding: ".8rem 1.75rem"
  contact-link:
    rounded: "{rounded.contact-action}"
    padding: ".8rem 1.5rem"
  contact-link-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.midnight}"
  contact-field:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.field}"
    rounded: "{rounded.field}"
    padding: ".85rem 1rem"
  archive-select:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.paper}"
    rounded: "{rounded.archive-control}"
    padding: ".6rem 2rem .6rem .75rem"
---

# Design System: WAWE Films

## Overview

**Creative North Star: "Real films lead"**

The user-pinned dark/Archivo Narrow direction gives the films the foreground and keeps the interface quiet. Midnight Ink, warm-paper lettering, the existing WAWE badge and restrained film edges define the shared homepage, Contact and Project shell. This is a scan of implemented code, not a new concept, generated comp or random seed.

ADR-0002 still governs: `src/app.css` and component styles are authoritative. Frontmatter is the normative documented extraction for consumers, not a second implementation authority; update code first and refresh this extraction together with `.impeccable/design.json`. ADR-0003's paper-default/rounded-display direction is superseded only for this shared route family. The accepted ASCII wave retains its own palette, type and calculations. Documentation does not grant release approval.

**Key Characteristics:**
- Film-first, dark shared shell.
- Actual Archivo Narrow headings; Archivo reading and form UI.
- Aligned fluid gutters and restrained rounded media.
- Honest missing-content and unavailable-service states.

## Colors

### Primary
Warm Paper (`paper`) reverses primary actions and supplies focus outlines and badge ink. `surface-text` is the incumbent same-value text alias, not a separate palette.

### Neutral
Midnight Ink (`midnight`) grounds the shared shell and native Showreel. Muted Stone (`surface-muted`) carries secondary copy and counts. Semantic roles below alias existing inks or contextual mixes; they introduce no new hues.

| CSS color role | Value / alias | Use |
|---|---|---|
| `--color-surface` | `var(--color-midnight)` | Shared shell, menu and native film backing |
| `--color-surface-raised` | 8% paper mixed with midnight | Project preview backing |
| `--color-surface-text` | `var(--color-paper)` | Primary text and badge ink |
| `--color-surface-muted` | `#bdb8ac` | Secondary copy, captions and counts |
| `--color-border` | 20% paper mixed with transparent | Footer divider |
| `--color-border-control` | 35% paper mixed with transparent | Fields, selects and outlined CTA |
| `--color-action` | `var(--color-paper)` | Filled actions and selection |
| `--color-on-action` | `var(--color-midnight)` | Text on filled actions / selection |
| `--color-focus` | `var(--color-paper)` | Keyboard focus outlines |

The retained blue/orange/paper brand tokens and intro palette remain in code; their historical recipes are not instructions to recolour these routes. The static OG asset has its own recorded artwork colours, not a new UI token group.

## Typography

The normal Archivo Narrow variable WOFF2 is a separate family, self-hosted at `/fonts/ArchivoNarrow-Variable.woff2`, declared for weights 400–700 with swap. `static/fonts/ArchivoNarrow-SOURCE.md` records Google Fonts' `ofl/archivonarrow` source, whole-font conversion and checksums; `ArchivoNarrow-OFL.txt` retains SIL OFL 1.1. The homepage preloads this face only.

Archivo variable remains body/UI (declared 100–900, width 62–125%). Archivo SemiCondensed at 87.5% is not Archivo Narrow. Pilcrow Rounded remains registered for historical/retained uses, not the current shared-shell heading family. The accepted opening uses its `font: plex` configuration and `/fonts/ibm-plex-mono.woff2`; do not impose shared headings on its glyph renderer.

Named `--type-*` shorthands in `src/app.css` carry weight, size, leading and family together. Apply `font: var(--type-body)` (or the matching role), not family-only declarations or ad hoc size/weight/leading overrides. Change the code-first role definition before refreshing these extracts. Sizes below use the default 16px root: body and fields are 16px, body-large 18px, labels/captions 14px. All heading/navigation roles use Archivo Narrow at 600; reading and form UI use Archivo.

| CSS text style | Weight | Size | Leading | Use |
|---|---|---|---|---|
| `--type-page-title` | 600 | `clamp(2.75rem, 6vw, 6rem)` | 1.04 | Shared H1, including Contact and Project detail |
| `--type-section-title` | 600 | `clamp(2.5rem, 4vw, 4.5rem)` | 1.08 | Archive title (`archive-title` in frontmatter), Contact CTA |
| `--type-card-title` | 600 | `clamp(1.5rem, 2.2vw, 2rem)` | 1.12 | Project card heading |
| `--type-subheading` | 600 | `2rem` | 1.2 | Project rich-text H2–H4 and related-work heading |
| `--type-navigation` | 600 | `clamp(1.25rem, 2vw, 1.75rem)` | 1.2 | Identity slot and Menu trigger |
| `--type-menu` | 600 | `1.75rem` | 1.2 | Disclosure links |
| `--type-body` | 400 | `1rem` | 1.6 | Shell, card descriptions, Project prose, contact fields and feedback |
| `--type-body-large` | 400 | `1.125rem` | 1.6 | Project clients and introductory description |
| `--type-label` | 500 | `.875rem` | 1.4 | Contact labels and archive filter/sort labels |
| `--type-caption` | 400 | `.875rem` | 1.5 | Counts, fallback copy, tags, figure captions and footer copy |
| `--type-control` | 500 | `1rem` | 1.4 | Buttons, CTA, selects, back and footer links |

`heading` in frontmatter records the retained `.site-heading` helper, not an additional complete size role. `card-description` and `field` both map to `--type-body`. The homepage H1 is visually hidden; archive headings and card titles provide the visible hierarchy. Card descriptions retain their two-line clamp and 65ch maximum; Project prose retains 75ch with body leading 1.6. The ASCII Plex renderer remains isolated and unchanged; shared text/color styles must not bleed into it.

These roles describe local implementation. Local prototype hierarchy readiness remains proposed, not canonical approval, full-release approval or evidence of actual production deployment.

## Layout

`site-gutter` aligns film, bar, catalogue and footer in a centred container capped at 112rem. The bar height is `clamp(5rem, 9vw, 8rem)`; anchor scroll margins add 1rem to that height. The Showreel is top-flush and fills the centred container with equal gutters. It starts at 16:9 in SSR, then adopts the decoded video's real aspect ratio; no viewport-height cap shrinks its width and `object-fit: contain` prevents cropping. The film scrolls away; only the following identity bar sticks.

The archive is three columns, two at widths up to 1000px and one up to 560px. Row/column gaps are fluid. Contact CTA stacks up to 600px; the contact form caps at 46rem. Footer wraps and includes bottom safe-area spacing. This is not a strict global spacing scale: frontmatter records reused values, not invented increments.

## Elevation & Depth

The shell is largely flat: contrast, media and spacing establish hierarchy. The anchored menu alone uses a structural shadow (`0 1rem 2rem rgb(0 0 0 / .3)`). No shared card-hover lift or shadow scale exists. The sidecar carries this shadow, observed breakpoints and motion rather than adding unsupported frontmatter groups.

## Shapes

Film previews use the `film` radius; the Showreel rounds only its bottom corners. Archive controls, contact fields and pill contact actions intentionally differ. Project detail media and rich-text images retain their local `--media-radius` fallback (14px), and native film backing is black. These are observed local exceptions, not a mandate to flatten all radii into one token.

## Components

- **Actions:** archive Apply/toggle are paper-filled small-radius controls, minimum height 44px. Contact submit is a filled pill (48px minimum); CTA is an outlined pill that reverses on hover. Do not invent archive hover effects absent from source.
- **Fields/selects:** transparent contact fields, semantic control border, body-style 16px input type and separate label style; invalid fields thicken the border. Disabled contact fields and submit visibly dim and refuse interaction. Filters/sort use native selects, not chips. Project tags are plain text list items, not clickable pills.
- **Cards:** one semantic Project anchor, contained lazy image or explicit Preview unavailable, heading and supplied description. No playing thumbnail videos. Hover underlines the title; card focus uses a paper outline offset by 6px.
- **Navigation:** existing masked badge, bounded client/name slot, nonshrinking Menu. Ordinary non-modal disclosure links close on selection, outside click or Escape; Escape restores trigger focus. The anchored panel enters over 200ms and exits over 140ms with a 6px translation. Identity content uses a keyed 140ms fade in an overlapping grid slot; reduced motion is immediate. Exact verified Razorpay, Outskill and Wispr Flow relationships can use official artwork fallbacks when the CMS logo is missing; valid CMS artwork takes precedence. Unboxed Razorpay retains original colours; Outskill and Flow preserve official SVG geometry/alpha rendered in warm paper for dark-ground legibility. Provenance is under `static/clients/`. Logo display follows saved cues only, never inferred timing.
- **Catalogue:** the heading row holds View all / Show five highlights before the grid, separated from the title on desktop and wrapping above cards on mobile. The gallery omits only `wawe-films-showreel` (its media/full cue catalogue remains intact until CMS removal is verified). The same five keyed cards expand into the priority-ordered archive. Measured height expands over 320ms with the reveal curve; reordering is 240ms cubic-out, new-card fade 160ms. Filters/sort use GET/SSR and shallow URL state; Back restoration has a bounded built-preview regression pass. Collapsing resets filters/sort. Reduced motion settles immediately.
- **Media:** one native video owns Showreel playback, cues and the intro reveal. After hydration it hides its native bar in favour of a full-film play/pause button and a 44px bottom-right mute button; Space/Enter play/pause and arrow keys seek ten seconds. Caption selection appears only for supplied safe tracks. SSR/no-JS retains native controls. Native Project media preserves actual ratios. The progressive ASCII overlay is viewport-fixed (100dvh, z-index 100), outside the clipped film wrapper. Its accepted field/motion kernel is unchanged; the reveal painter aligns the actual contained DOM video before dismissal. Skip focuses playback; scroll-offscreen, reduced motion, failure and disposal still fail open. Native caption-track plumbing exists, but approved manifests are empty: this is not caption availability.

Sidecar snippets are self-contained HTML/CSS translations of existing primitives, not replacement Svelte components or a claim that static previews implement runtime behavior.

## Do's and Don'ts

### Do:
- **Do** change code first and refresh both documentation extracts together.
- **Do** preserve real media, badge artwork and truthful missing-content fallbacks.
- **Do** retain keyboard focus treatments and immediate reduced-motion settlement.

### Don't:
- **Don't** substitute Archivo SemiCondensed or Pilcrow Rounded for Archivo Narrow headings.
- **Don't** revive the historical stack, fan or filmstrip in the shipping shared shell.
- **Don't** treat token documentation, fixture footage or the bounded ship verdict as release approval.
