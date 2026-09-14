# Tarun Runner — Implementation Notes

Project Aurora's translation of Utsubo's "a moving protagonist carries the
viewer through the world" principle: Tarun himself, moving through memory
and distance toward Dheepika, during Chapter 04 (Journey). See
`AURORA_THREE_SITE_FUSION_AUDIT.md` for how this pass related to the earlier
V2/Legacy/Utsubo comparison.

## Model

- **Path**: `public/models/tarun-runner.glb`
- **Status**: placeholder, not an identity likeness. Supplied this pass as a
  procedurally generated rigged humanoid — a dark, near-black silhouette
  material with a faint violet emissive, no face detail, no invented hair or
  clothing. It exists so the Journey architecture can be built and verified
  end-to-end now, with a single-file swap later.
- **To upgrade**: replace `public/models/tarun-runner.glb` with an
  identity-accurate rigged model exposing (ideally) `Idle`/`Walk`/`Run`
  clips. Nothing in `TarunRunner.tsx` needs to change — clip discovery,
  bounding-box normalization and orientation are all derived from the asset
  itself, not hardcoded to this placeholder's proportions.

## Clips detected (current placeholder)

`Idle` (2.0s), `Walk` (2.0s), `Run` (1.0s) — all three found by name (never
`animations[0]`; see `discoverClips()`). All three are pure in-place
locomotion already (no baked root translation), so `neutralizeRootMotion()`
is a no-op on this asset today. It still runs on every clip regardless,
defensively: a future real model that *does* bake forward root motion would
otherwise make Tarun drift through world space, which the brief calls out as
critical to avoid — camera, path and environment carry the sensation of
travel, not the character's own translation.

## Animation state system

Three states — `idle` / `walk` / `run` — selected by
`journeyPhase(chapterProgress)`, a phase map across the chapter's own 0-1
progress (the brief's own suggested breakpoints, tuned visually rather than
treated as exact):

| Progress | State | Notes |
|---|---|---|
| 0.00–0.12 | idle | distant, barely present |
| 0.12–0.25 | walk | walking in |
| 0.25–0.78 | run | steady, then strongest around 0.60–0.78 |
| 0.78–0.90 | walk | decelerating |
| 0.90–1.00 | idle | settling before he fades |

If a name-matched clip for the desired state doesn't exist on a given
asset, `resolveState()` falls back to the closest available one (run → walk
→ idle, or the reverse) rather than freezing or throwing — "if only RUN
exists, use it gracefully," generalized to any missing state.

Transitions crossfade via `THREE.AnimationAction.crossFadeTo()` over 0.35s
— no snapping between movement states.

## Scroll synchronization

No second scroll engine. Velocity is derived every frame inside the
existing `useFrame` loop from the shared `sceneProgress` ref's own
`chapterProgress` (`|Δp/Δt|`, clamped and exponentially smoothed into a
ref — never `setState`), the same ref `CameraRig` and `CoupleModel` already
read. That damped velocity modulates **animation playback rate** within
each state's physically-believable range (idle 0.85–1.05, walk 0.65–0.9,
run 0.9–1.25, matching the brief's own numbers) rather than overriding
which state plays — faster scrolling makes his legs move faster without the
state selection itself flickering on jittery scroll input.

Scrolling backward does not reverse the animation (the mixer only ever
advances forward in time); the phase map simply re-selects whatever state
belongs to the progress value scrolled back to, which reads as environment
and path "rewinding" around him rather than Tarun running backward.

## Journey composition

- **Placement**: lower-third, off-centre (`PLACEMENT = (-0.55, -1.35,
  -3.1)`), closer to camera than the couple figure's own staging depth so he
  reads as the foreground protagonist.
- **Scale**: `fitModelToHeight` to 1.75 world units — the same bounding-box
  normalization `CoupleModel.tsx` already established for this scene's
  camera geometry.
- **Orientation**: `ORIENTATION_OVERRIDE = Math.PI` (facing away from
  camera, "into" the scene) — a documented best guess, not a measurement. A
  roughly symmetric humanoid in a neutral pose doesn't reliably expose
  forward/back from its bounding box alone the way `fitModel.ts`'s
  width/depth heuristic can for an asymmetric or posed figure. Correct in
  one line once an identity-accurate model exists to actually look at.
- **Presence**: a smoothstep curve fades him in from 0.04–0.14 and out by
  0.88–1.0 of the chapter — present for the chapter's own body, gone well
  before it hands off, and (per the brief) gone entirely before the Letter.
- **Camera**: unchanged. `CosmicScene.tsx`'s existing whole-site camera arc
  already holds a directed pose for the Journey chapter (behind/above,
  drifting only 0.7 of full pointer-parallax strength); the runner is staged
  to read correctly inside that existing frame rather than getting a second,
  parallel camera system.
- **Path**: unchanged — `CosmicPath` (the existing cosmic-dust trail) is the
  "road."  No literal asphalt was added.
- **Memory photographs**: unchanged — the three ghost photographs added in
  the previous pass continue to fade in/out on their own scroll-scrubbed
  timeline alongside the runner. They were **not** re-built into a
  runner-reactive system (no "runs toward a photo and it dissolves into
  particles" signature shot) — see Scope below.
- **Dust**: a small (36-particle, desktop only) drifting point cloud near
  his feet, intensity-linked to the current run intensity. Not
  footstep-accurate — the brief explicitly allows skipping bone-phase
  detection when "a convincing run matters more than exact foot particles."

## Mobile / performance

- Dust particles are skipped entirely on coarse-pointer or narrow-viewport
  devices (`useCoarsePointer` / `useNarrowViewport`), rather than rendered
  at reduced count — one less system to manage on the lowest-power tier.
- The model itself is not tiered further (no separate low-poly mesh swap):
  the placeholder is already low-poly (8 primitive meshes), so the existing
  per-device `CosmicTier` (star count, nebula octaves, DPR) already governs
  the dominant cost.
- Verified at 390×844 (primary) — the figure reads clearly in the lower
  portion of frame without covering the chapter heading or captions above
  it, and without introducing horizontal overflow.

## Reduced motion / WebGL failure

No code in `TarunRunner.tsx` checks `prefers-reduced-motion` or WebGL
availability directly — it doesn't need to. `CosmicBackdrop.tsx` already
decides, above this component, whether the entire `<Canvas>` (starfield,
nebula, moons, the couple figure, and now the runner) mounts at all;
reduced motion, a low-power device, missing WebGL, or a lost GL context all
skip mounting it entirely, and the chapter's HTML — heading, copy, the
cosmic-path SVG, the ghost photographs — already renders independently of
the canvas. So the runner simply isn't part of the experience in those
states, and nothing about Journey breaks or empties out; this is the same
guarantee `CoupleModel.tsx` already relies on.

## A real bug found and fixed while building this

Scrolling naturally into Journey while testing surfaced a genuine,
pre-existing timing bug, unrelated to the runner itself but directly
affecting whether it (and the couple figure, and the whole-site camera arc,
and everything else staged off "which chapter is active") appears at the
right moment: `ChapterTimeline.tsx`'s pinned constellation section never
told `sceneProgress.ts` about the ~500vh pin-spacer it inserts. Confirmed
concretely — at a scroll position where direct DOM math placed the
viewport center well inside Chapter 03's own bounds, the shared tracker
reported Chapter 05, two chapters ahead of what was actually on screen; a
forced `resize` event (which happens to trigger both GSAP's own refresh and
`sceneProgress`'s remeasure) immediately corrected it. This is the same
failure mode already fixed once this project for the candle/wish sequence
(`requestSceneRemeasure()`, added in the prior pass). Applied the identical
fix here: `requestAnimationFrame(requestSceneRemeasure)` right after
`ChapterTimeline.tsx`'s own `ScrollTrigger.refresh()`. Re-verified by
scrolling from the hero all the way through Chapter 03's full pin with the
chapter indicator staying correct throughout, then correctly landing on
Chapter 04 exactly when Journey's own title is on screen.

## Deliberately out of scope this pass

- **The signature "runs toward a photograph and it dissolves into
  particles" shot** (brief section 31). A real, standalone VFX system
  (photo-texture-to-particle dissolution, correctly performant and
  correctly disposed) — attempting a rushed version risked exactly the kind
  of expensive, gimmicky result this project's whole aesthetic has been
  built against avoiding. Documented here as a clearly-scoped future
  enhancement, not attempted.
- **Per-footstep-accurate dust** (brief section 25, which itself permits
  this) — a restrained, intensity-linked drift was built instead.
- **Runner glancing toward a memory** (brief section 49, itself optional
  "only if the rig supports it naturally") — skipped; the placeholder rig
  has no separate head-look control worth building for.
- **A static DOM/CSS Tarun silhouette specifically for reduced-motion**
  (implied by brief section 43's "show a static Tarun silhouette"). Given
  reduced motion already gets a complete, honest chapter (heading, copy,
  path, photographs) without him, and building a second, CSS-only figure
  purely for that one state felt like scope beyond what a placeholder model
  justifies, this was not built. Worth reconsidering once a real model
  exists and a flat production still of him could be extracted cheaply.
