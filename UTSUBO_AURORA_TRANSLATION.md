# Utsubo → Project Aurora: Principle Translation

Studied directly in-browser at utsubo.com (desktop 1440×900 and mobile 390×844,
through the real entry-click flow, not just static inspection). This document
records **principles observed**, not pixels reproduced. No Utsubo copy, assets,
layouts, or shader code appear anywhere in Project Aurora.

Temporary working document for this pass — safe to delete once the audit and
implementation below are complete and reviewed.

## What was actually observed

- **Loader**: a slow, deliberate percentage-ring counter (0→100%) under the
  wordmark, on pure black — no spinner, no skeleton screens. It holds at 100%
  and waits for a click before the entry transition plays, so the "reveal"
  itself is a deliberate beat, not an autoplay.
- **Hero**: near-total darkness with a single glowing focal motif at center —
  a cheetah's face, rendered so dark it reads as pure silhouette except for
  two amber glowing eyes. Minimal masthead (small logo mark + centered
  wordmark + a tiny waveform icon/CONTACT link/pill "..." menu — no
  traditional nav bar). A thin vertical rail of 5 small dots on the right
  edge tracks scroll position through 5 sections. Bottom: two-line headline,
  one-line muted subhead, "SCROLL TO CONTINUE" microcopy.
- **Chapter identity**: each of the 5 sections is a *completely different*
  visual world (starfield+cheetah, then a large generative teal/blue
  dot-matrix "grid creature" scene, then an ornate stone-and-gold circular
  portal with a holographic dot-matrix figure inside it, flanked by a small
  cheetah statue on a rock) — not the same scene re-colored. Each carries its
  own chapter title ("Lead the Future", "The Constant Quest", "Groundbreaking
  Experiences", "Explosive Innovation", "Expect the Unexpected") and its own
  "SCROLL TO CONTINUE" pause.
- **Interaction copy**: a real "HOLD TO INTERACT" prompt gates one moment: a
  press-and-hold action (not a single click) before that scene advances, with
  a "TAP ANYWHERE TO CLOSE" dismiss on an overlay elsewhere.
- **Technical note**: the WebGL canvas has `transferControlToOffscreen()`
  called on it — rendering happens in a Worker, not the main thread. That
  headroom is very likely why scroll and UI stay smooth even while a heavy
  3D scene renders continuously underneath.
- **Mobile**: the exact same hierarchy and restraint carry over 1:1 — same
  masthead, same dot rail, same two-line headline, no clipping, no
  simplified copy. The cheetah motif is legible even in the smaller frame.

## Principle → Interpretation

**Utsubo's slow, deliberate percentage loader, held at 100% until a click**
→
Project Aurora doesn't gate entry behind a loader (the site is light enough
not to need one), but `ChapterPortal.tsx`'s own opening already borrows the
*deliberateness*: a beat of nothing, one star, another star, haze, aurora —
before any text appears. The "click to proceed" beat is already present in
spirit as "Begin the Journey" / "or scroll".

**Utsubo's single glowing focal creature (the cheetah's eyes) as the hero's
entire visual hook**
→
Project Aurora's hero hook is Tarun and Dheepika's own story, not a creature
— the two hand-tuned stars and the forming aurora already play this same
role: one small, precise point of light the eye is drawn to in a mostly-dark
frame, before the title even exists.

**Utsubo scene-to-scene visual reinvention (starfield → dot-matrix creature →
gold portal)**
→
Chapter progression through real relationship chapters (Hero → Miracle →
Story/Constellation → Journey → Memories → Letter → Birthday → Finale) —
already structurally in place, already each visually distinct, and already
governed by `CosmicAtmosphere`'s seam system so one chapter's mood bleeds
into the next rather than cutting.

**Utsubo's "HOLD TO INTERACT" prompt**
→
Project Aurora's birthday candle interaction ("Blow out the candle(s)") is
already this site's equivalent emotionally-loaded, single deliberate
interaction — already implemented, already the one moment that gates real
consequence (darkness → chime → reveal). Not duplicated elsewhere.

**Utsubo's dramatic 3D environment scale**
→
The romantic memory galaxy already spans the whole site as a persistent
backdrop (`CosmicScene`/`CosmicAtmosphere`), not a one-off hero prop.

**Utsubo's minimal masthead (logo + wordmark + 2 tiny icons, no nav bar) +
thin dot rail for orientation**
→
`ChapterNav.tsx` already occupies this same restrained space: one small
"0X / 08" control, no traditional nav. Genuinely closest gap: Utsubo's
always-visible dot rail gives ambient orientation without opening anything;
Aurora's chapter number is legible but static-feeling by comparison.
Evaluated in the audit below as a P2, not implemented this pass (see
reasoning there).

**Utsubo's desktop-only mouse-driven camera/scene drift**
→
Already implemented independently in `CosmicScene.tsx`'s `CameraRig`: real
`pointermove` tracking gated to `event.pointerType === "mouse"`, damped, and
scaled per-chapter by a `drift` value that fades toward zero for the Letter
and the candle — i.e. Project Aurora already does exactly what point 14 of
the brief asks for, arrived at independently across earlier passes.

**Utsubo giving the visitor occasional, deliberate agency ("HOLD TO
INTERACT", not everywhere)**
→
This is the one area with a genuine, checkable gap: Project Aurora has real
interaction moments (Begin the Journey, the candle wish, chapter nav, replay
links) but no contextual cursor treatment marking a moment as "you can act
here" before the visitor's hand is even on it. Implemented this pass as a
small, desktop-only, two-context cursor label (see report).

**Utsubo's near-invisible film grain / restrained bloom / rare lens
streaks**
→
Already present and already tuned across earlier passes (`.film-grain`,
bloom scoped to aurora/stars/candle/gold particles only, per this session's
established restraint work). No change warranted.

**Utsubo's OffscreenCanvas/Worker rendering for main-thread headroom**
→
Not adopted. This would be a meaningful architecture change to R3F's render
pipeline for a performance property this site does not currently need
(Aurora's WebGL load is already light and the brief explicitly rules out new
dependencies/rearchitecture "by default"). Noted as a real technique, not
pursued.
