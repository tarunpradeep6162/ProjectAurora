# Aurora V3 — Architecture

Status document for the `feature/aurora-v3-active-theory` branch (checked
out from `master` at commit `1b1238c`, which remains fully intact and
unmodified). Concise and factual, per this phase's own instruction. Covers
two passes now: the photo-dissolve pass (commit `85f8215`) and this
"Theatre World" pass (commits `7020a7c`, `f60416c`, `a5bdf79`).

## What V3 actually is, right now

Not a rewrite. The existing architecture — one persistent R3F canvas
(`CosmicBackdrop` → `CosmicScene`), a shared scroll-progress store
(`sceneProgress.ts`), GSAP for DOM motion, Lenis for smooth scroll — is
**still the whole site's foundation**, unchanged, and still correct (see
`ACTIVE_THEORY_AURORA_REDESIGN.md` from the earliest pass for why most of
the Active Theory principles already held before V3 even started).

Each pass has added real, verified systems on top of that foundation
rather than replacing it: `PhotoDissolve.tsx` (photo→particle transition),
now `StardustTrail.tsx` (pointer/touch particle trail) and a genuine, if
partial, Theatre.js layer (`src/theatre/`) actually driving the camera and
a world-offset group — not just installed.

## This pass's changes

- **P0 fixed**: Journey's own DOM `ScrollTrigger` and `sceneProgress`'s
  canonical chapter-progress signal disagreed because they measured
  genuinely different scroll windows (`start:"top 70%",end:"bottom 40%"`
  vs. document-space viewport-center-crossing over the section's real
  bounds) — not a miscalibration of one shared idea, but two different
  ideas. `ChapterJourney.tsx` no longer has its own `ScrollTrigger`; its
  GSAP timeline is now driven by `tl.progress()` from `sceneProgress`'s
  `chapterProgress` every frame (`subscribeSceneFrame`, the same pattern
  `CosmicAtmosphere` already used for CSS custom properties). Verified
  against live `getBoundingClientRect` math: reported progress matched
  computed progress to four decimal places at a sampled mid-chapter
  position, and read exactly 0/1 outside the chapter's real bounds, where
  it previously read 0.86 at a scroll position before the chapter had even
  started.
- **`public/models/couple.glb` added.** Verified at the raw glTF JSON
  level (not just the accompanying doc): clip names are exactly
  `IdleTogether`, `WalkTogether`, `EmbraceLoop`. The existing
  `CoupleModel.tsx` loader's name-matching heuristic already selects
  `IdleTogether` correctly with no code change; `WalkTogether`/
  `EmbraceLoop` are not yet wired to anything (see "what's still owed"
  below).
- **`src/theatre/` — a real Theatre.js layer**, detailed in
  `THEATRE_AUTHORING_GUIDE.md`.
- **`src/components/cosmic/StardustTrail.tsx`** — the pointer/touch
  particle trail, detailed in `ACTIVE_THEORY_TRANSLATION.md`.

## Files from the earlier photo-dissolve pass (unchanged this pass)

- `src/components/cosmic/PhotoDissolve.tsx` — the particle dissolve.
- `src/hooks/useWebGLActive.ts` — lets DOM components know whether the
  canvas is actually live, so exactly one of "real WebGL effect" / "DOM
  fallback" renders at a time, never both.
- `src/components/chapters/ChapterJourney.tsx` — the signature ghost's own
  image+embers still suppress themselves when `PhotoDissolve` is carrying
  the shot instead (this pass additionally changed this file's *progress
  source*, not this suppression logic).

## New dependencies

`@theatre/core` (production) and `@theatre/studio` (dev only — never
imported outside a dev-gated path, so it cannot ship in the production
bundle, verified this pass by confirming the string `"Outline Menu"`,
which only exists in Studio's own UI code, appears nowhere in a production
`next build` output). See `THEATRE_AUTHORING_GUIDE.md` for the
compatibility finding that shaped this: `@theatre/r3f` requires React
Three Fiber `^8.13.6`; this project runs `^9.7.0`. That's a hard
peer-dependency conflict, not a judgment call, confirmed directly against
the npm registry. `@theatre/core` and `@theatre/studio` both have zero
React/R3F peer constraints, so they install cleanly; `@theatre/r3f` was not
installed.

**Theatre.js now genuinely drives something real**, as of this pass:
`src/theatre/auroraProject.ts` creates one project, one master sheet, and
nine semantic objects; `src/theatre/TheatreDirector.tsx` drives the master
sequence's `position` every frame from the canonical `storyPosition`
signal (verified live: Studio's own timeline playhead scrubs in real time
while scrolling the actual site), and a small camera-correction layer
(`fovBias`, `driftMultiplier`, `positionBoost`) plus a world-offset group
are genuinely applied to the live scene every frame in `CosmicScene.tsx`
(`CameraRig`, `WorldGroup`) — both default to exact no-ops, so nothing
about the shipped camera arc or world layout changed, but a human opening
Studio locally can nudge either and see it live.

**What Theatre does *not* yet do**: fully own the primary per-chapter
camera arc (`CAMERA_KEYS`/`sampleCameraArc` in `CosmicScene.tsx` is
unchanged and still computes the actual pose every frame — Theatre's
correction layer sits on top of it, not in place of it), or drive
`HeroWorld`/`JourneyWorld`/`JourneyLight`/`ConstellationWorld`/
`CoupleWorld`/`BirthdayWorld`/`FinaleWorld` (these six objects exist, with
sensible default props, inspectable in Studio, but nothing in the scene
reads their values yet). See `THEATRE_AUTHORING_GUIDE.md` for exactly why
the camera arc itself wasn't keyframed this pass, and what the real next
step looks like.

## A real bug found while verifying this pass, not yet fixed

While confirming `PhotoDissolve` timing against real scroll, found that
Journey's own dedicated GSAP `ScrollTrigger` (the one driving the DOM path
draw and the two non-signature ghost photos, unchanged from two passes
ago) reports scroll progress dramatically ahead of where the chapter
actually is on screen — e.g. 86% "complete" while `#journey`'s own measured
document position shows the visitor hasn't reached the chapter yet at all.
Confirmed this is *not* the same stale-pin-spacer bug fixed twice already
this session: forcing both a synthetic and a genuine browser resize (which
already fixed that bug class before) had no effect here. The shared
`sceneProgress` chapter tracker — which `PhotoDissolve`, `TarunRunner`,
`CoupleModel`, and the camera arc all read — was independently verified
correct at the same scroll positions.

Not fixed this pass: the root cause isn't confirmed, and this project's own
standing rule is not to guess-fix a rendering/timing bug without
understanding why it's happening. Practical impact is currently small —
`PhotoDissolve` doesn't depend on this trigger at all, and the DOM
path/ghosts still visually complete their animation by the time a real
visitor scrolls past the chapter, just earlier than intended relative to
the title. It **does** matter for the reduced-motion/low-power fallback
path specifically, since that's the one case where the DOM ghosts (not the
particles) are the only version anyone sees. Flagged here as a genuine
open item, not swept under a "looks fine" claim.
