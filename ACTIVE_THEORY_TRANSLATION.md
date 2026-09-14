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

## The other signature shot: the stardust pointer/touch trail

| Active Theory principle | Aurora V3 translation |
|---|---|
| The pointer has real presence in the world, not just a CSS hover state | `StardustTrail.tsx` places particles along the ray from the camera through the pointer's own NDC position, in the actual 3D scene, not a 2D DOM overlay. |
| Motion should respond to *how* you move, not just where you are | Emission is driven by smoothed pointer/touch velocity (NDC units/sec), not raw position — a still cursor emits nothing; a fast one emits near the (hard) clamp. |
| Restraint: presence, not spectacle | "No giant follower circle" — implemented as a genuinely short-lived trail (0.55-1.25s per particle) that provably fades to nothing within ~2s of no movement, verified live, not just a config value. |
| Context-aware — a device doesn't behave the same everywhere | Per-chapter intensity table (full by default, 0.4 during photographs, 0 during Letter/Birthday, 0.15 during the finale) damped smoothly, not switched abruptly, so a chapter transition never pops the trail on/off. |

`src/components/cosmic/StardustTrail.tsx`: one `THREE.Points`, one
`BufferGeometry` with a fixed-size ring buffer (420 particles desktop, 140
mobile), one GLSL shader pair. Spawning writes only the newly-touched
particle slots' attributes (`position`, `aVelocity`, `aBirth`,
`aLifetime`, `aColor`) each frame — never a full-buffer rewrite. Age is
computed in the vertex shader from a `uTime` uniform minus each particle's
own `aBirth`, so idle (never-yet-spawned) particles carry `aBirth = -9999`
and are simply always-fully-faded, with no separate "hide unused slots"
branch needed. Palette is weighted toward warm ivory/champagne
(`#efe0c0`), with rare rose (`#c98fa0`) and lavender (`#a79bc4`) — never
rainbow, matching this project's existing accent family.

Verified live, not just written: dragged the pointer across chapter 01 and
observed a genuine warm additive-blended glow at the cursor's path that
faded to nothing within ~2 seconds of stopping; repeated the same drag on
chapter 07 (Birthday) and confirmed zero visible trail; repeated again on
chapter 04 (Journey, default intensity) and confirmed the trail resumed.
Zero console errors across all three states.

**Not verified this pass**: an OS-level `prefers-reduced-motion` live
toggle test specifically for this new component (the Browser pane tooling
available this pass had no direct control for that emulation). The gate
itself (`if (reduced) return null` via the project's existing
`useReducedMotion()` hook) is the identical, already-proven pattern used
by every other motion-bearing component in this codebase — trusted by
code-pattern consistency rather than re-proven live for this one file.

## The hero centerpiece: the Aurora Relic + memory blocks

| Active Theory principle | Aurora V3 translation |
|---|---|
| One unforgettable sculptural object, carefully staged | `AuroraRelic.tsx` — two intertwined, tapering tube forms, an abstract embrace rather than a literal one, the hero's one central object. |
| Floating fragments at real depth, some near-camera, some behind | `MemoryBlocks.tsx` — an instanced field across near/mid/far z-bands relative to the portal camera, not a flat decorative scatter. |
| Reflective, premium materials without heavy realtime cost | `MeshPhysicalMaterial` with a modest `clearcoat` (not full `transmission`/reflection probes) — reads as polished without the GPU cost. |
| Restrained pointer presence, not a game | Fine-pointer-only rotation bias on the Relic (a couple of degrees) and depth-scaled parallax on the blocks, both damped, both off for touch. |

**Relic geometry**: `THREE.TubeGeometry` around a `CatmullRomCurve3`
path, two strands (phase-offset by π). The *path's* own distance from the
shared axis tapers to ~0 at both ends (`sin(t·π)` envelope) while the
tube's cross-sectional radius stays constant — core `TubeGeometry` has no
native per-point radius control, so the taper lives in the curve instead.
A documented, working simplification, not an oversight.

**Blocks**: `RoundedBoxGeometry` (real bevel, from `three/examples/jsm`,
the same import path `CoupleModel.tsx` already established for
`GLTFLoader`), three `InstancedMesh` groups by material family (dark
glass / champagne / rose), one shared geometry per shape reused across
every instance of that shape. Deterministic seeded layout (25 November,
this project's own recurring seed) — never `Math.random()` at render.

**Not built this pass** (all explicitly out of scope, not silently
dropped): the "Enter Our Universe" camera-through-blocks entry sequence,
block→photo transitions, Journey/Couple/Birthday/Finale reuse of the same
blocks, and dedicated `RELIC_REVEAL`/`BLOCK_ASSEMBLY`/etc. Theatre
sequence ranges (the existing single master-clock mapping is unchanged).
A false "invisible on mobile" alarm was raised and then retracted while
testing this system — see `AURORA_V3_ARCHITECTURE.md` for the actual
cause (a testing-tool artifact, not a product bug) and the lesson for
future verification.

## What's still owed from the brief's fuller Journey-world spec

Indigo fog, celestial dust replacing the current dust treatment, a soft
ground trail, and the constellation continuing "from the same particles"
as this dissolve are all still the DOM/lightweight version built in the
prior "three-source fusion" pass, not rebuilt this pass. This dissolve
shot is additive to that existing Journey chapter, not a full rebuild of
it.
