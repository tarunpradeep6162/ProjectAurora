# Aurora V3 — Architecture

Status document for the `feature/aurora-v3-active-theory` branch (checked
out from `master` at commit `1b1238c`, which remains fully intact and
unmodified). Concise and factual, per this phase's own instruction.

## What V3 actually is, right now

Not a rewrite. The existing architecture — one persistent R3F canvas
(`CosmicBackdrop` → `CosmicScene`), a shared scroll-progress store
(`sceneProgress.ts`), GSAP for DOM motion, Lenis for smooth scroll — is
**still the whole site's foundation**, unchanged, and still correct (see
`ACTIVE_THEORY_AURORA_REDESIGN.md` from the prior pass for why most of the
Active Theory principles already held before this pass even started).

This pass added exactly one new real-time system to that existing
foundation: `PhotoDissolve.tsx`, a genuine GPU particle transition for
Journey's signature shot, mounted inside the same persistent canvas
alongside `TarunRunner` and `CoupleModel`.

## New files this pass

- `src/components/cosmic/PhotoDissolve.tsx` — the particle dissolve (detail
  in `ACTIVE_THEORY_TRANSLATION.md`).
- `src/hooks/useWebGLActive.ts` — lets DOM components know whether the
  canvas is actually live, so exactly one of "real WebGL effect" / "DOM
  fallback" renders at a time, never both.
- `src/components/chapters/ChapterJourney.tsx` — the signature ghost's own
  image+embers now suppress themselves when `PhotoDissolve` is carrying the
  shot instead.

## New dependencies

`@theatre/core` (production) and `@theatre/studio` (dev only — never
imported outside a dev-gated path, so it cannot ship in the production
bundle). See `THEATRE_AUTHORING_GUIDE.md` for the compatibility finding
that shaped this: `@theatre/r3f` requires React Three Fiber `^8.13.6`; this
project runs `^9.7.0`. That's a hard peer-dependency conflict, not a
judgment call, confirmed directly against the npm registry. `@theatre/core`
and `@theatre/studio` both have zero React/R3F peer constraints, so they
install cleanly; `@theatre/r3f` was not installed.

**Theatre.js is not yet wired to drive anything.** It's evaluated,
installed, and ready — the actual integration (Theatre driving the camera,
lighting, or a scene transition via `@theatre/core`'s vanilla API against
existing refs, per the brief's own fallback plan) is unstarted. This was a
deliberate prioritization, not an oversight: with limited time, building
the *mandatory*, concretely-scoped, highly-narrative GPU particle dissolve
correctly was judged more valuable than wiring Theatre into a camera system
that is already well-tuned (a hand-authored monotone-cubic spline through
chapter keyframes) and risking a regression there for architecture's own
sake.

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
