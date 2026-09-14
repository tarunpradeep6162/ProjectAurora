# Active Theory Translation — V3 Pass

Supersedes the "declined" verdict in `ACTIVE_THEORY_AURORA_REDESIGN.md` for
one specific item: the signature photo-dissolve, which that document
explicitly deferred as a DOM approximation. This pass built the real
version. That prior document's broader reasoning (most of what makes
Active Theory's work land is pacing/restraint/depth-of-field thinking, not
raw GPU horsepower) still holds for everything *not* covered here.

## The one shot this pass actually built

| Active Theory principle | Aurora V3 translation |
|---|---|
| A transition is a real simulated event, not a crossfade | Journey's signature photograph (`memory-5.jpg`) is sampled into a point grid in world space; the visitor's approach dissolves it from flat photo to scattered particles, in the same 3D space Tarun runs through — not a 2D overlay. |
| Particles should read as the source image, not noise | Grid points carry the photo's own per-vertex UV, sampled from the real texture in the fragment shader — the dissolve genuinely deconstructs *this* photograph, not a generic effect. |
| A transition should feel authored, not procedural-random | The scatter target for each point uses `Math.random()` for *variety* within an authored envelope (radius range, upward bias, camera-ward bias) — the shape of the dissolve (photo → rises → becomes points of light) is deliberate, only the exact per-point noise is random. |
| Exactly one thing owns a given moment | `useWebGLActive()` ensures the DOM fallback and the WebGL particle version are mutually exclusive — verified via live `getComputedStyle` checks, not assumed. |

## Implementation, concretely

`src/components/cosmic/PhotoDissolve.tsx`:
- One `THREE.Points` object, one `BufferGeometry`, populated once in a
  `useEffect` (not per-frame, not per-render) — 5400 points on capable
  devices, 1600 on narrow/coarse-pointer devices.
- Custom GLSL vertex shader mixes `position` (flat grid) and `aTarget`
  (scattered) by a `uDissolve` uniform; point size scales by
  `240.0 / -mvPosition.z` so distance reads correctly.
- Custom GLSL fragment shader circle-masks each point
  (`gl_PointCoord`/`smoothstep`), samples the real texture at that point's
  own UV, and lerps color toward warm ivory (`#EFE0C0`) as `uDissolve`
  increases — the photo visually becomes light, not just dots.
- Driven by `sceneProgress`'s `isChapterActive`/`chapterProgress` (the
  same, separately-verified-correct signal `TarunRunner` and `CoupleModel`
  already use) — not by Journey's own local ScrollTrigger, which this pass
  found to be unreliable (see `AURORA_V3_ARCHITECTURE.md`'s open-issue
  section).
- `uOpacity`/`uDissolve` are smoothed via exponential damping
  (`opacityRef`) inside `useFrame`, not snapped, so the effect doesn't pop.

## What this is not

Not a generalized particle system reused elsewhere. Not "100k particles" —
the brief explicitly asked not to guess a high count, so this started at a
few thousand and was verified visually coherent at that scale before
settling there; it was not profiled against an FPS counter this pass (see
`AURORA_V3_PERFORMANCE.md` for what was and wasn't measured).

## What's still owed from the brief's fuller Journey-world spec

Indigo fog, celestial dust replacing the current dust treatment, a soft
ground trail, and the constellation continuing "from the same particles"
as this dissolve are all still the DOM/lightweight version built in the
prior "three-source fusion" pass, not rebuilt this pass. This dissolve
shot is additive to that existing Journey chapter, not a full rebuild of
it.
