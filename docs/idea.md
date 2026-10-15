# Idea — text-wave intro into showreel

Fresh-start brief. No implementation lives here — only the core idea, in plain
language. A new session will implement from scratch. Palette, fonts, and
inspiration references are deliberately excluded (references will be re-prompted
in the new session). All accumulated numbers, params, and techniques live in
`idea-impl-ref.md`.

## What it is

A purely text intro made of ascii text waves. It washes into the showreel view.
A showreel animation plays and settles into the final showreel UI.

## The arc

1. **Text** — the title sits in a living field of ascii waves. The water moves;
   the title is untouched.
2. **Hold** — the waves keep lapping while the showreel assets load. Nothing
   advances until they are ready; then one single surge crosses the screen.
3. **Wash** — the surge covers the title. The title melts where the water
   touches it and is gone by the time the wave has passed.
4. **Recede** — the water withdraws and uncovers the showreel beneath its edge.
5. **Showreel** — the revealed showreel animates (stacking) and settles into
   the final showreel UI.

## The illusion (read this first)

**The never-move-backwards rule:** water always travels forward. It never
reverses, nothing fades or pops in place, and no second wave re-enters from
where the first one left.

**The same-direction trick:** the wash covers the screen travelling one way,
and the recede uncovers the showreel travelling *the same way*. The audience
reads it as one continuous body of water passing through — arriving, covering,
and leaving — rather than water going back where it came from. This single
illusion is the piece; everything else serves it.

## Motion rules

- One wave crosses the screen at a time. Never stack multiple wave systems on
  top of each other.
- Water always enters from off-screen. An edge never appears mid-screen.
- The title, and everything the water uncovers, share one reveal edge, so all
  elements wipe in lockstep.
- The reveal is a soft band that the edge carries with it — never a hard wipe
  or carved line.

## Title interaction

The title reacts to the water touching it, so the wash feels physical and
real. "Interaction" here is only jargon for realism — it could be sold with
something as simple as a well-timed fade. No particular effect is prescribed.

## The reveal

The recede uncovers the showreel through the soft reveal band. The reveal
opens a defined shape — a square, a circle, or similar — which is the stage
where the stacking animation happens.

## The showreel

Inside the revealed shape, a stacking animation plays and settles into the
final showreel UI. The stacking animation itself is intentionally undescribed
here — it will be designed in detail in a new session.

## Gating, in words

The water holds until the showreel is ready, then exactly one surge runs, then
the water leaves. Readiness, not a timer, drives the handoff. Reduced-motion
viewers skip to the settled end state.

## First visible frame

The ASCII opening is the loading experience, so its own assets must load as fast
as possible. Keep that critical asset set minimal and independent of showreel
media, CMS requests, and review tooling. Users should not encounter an empty
screen while waiting for the intro itself. Plan a lightweight first-frame
fallback for cold/slow loads; do not hide everything behind font or media readiness.

Detailed asset and delivery optimization comes later. This is a constraint on
implementation choices now, not a claim that startup is already optimized.

## Out of scope for this doc

Palette, fonts, inspiration references, timings, densities, easing values,
tooling, and all prototype techniques — see `idea-impl-ref.md`.
