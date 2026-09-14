# Aurora V3 — Performance

Factual record of what was checked this pass, and what wasn't — per the
brief's own instruction to profile rather than guess, this document says
plainly where that didn't happen yet rather than implying more rigor than
occurred.

## What was actually verified

- `npm run lint` — clean, 0 errors/warnings.
- `npx tsc --noEmit` — clean.
- `npm run build` (production, Turbopack) — succeeds; all routes still
  prerender as static content (`○ /`, `○ /_not-found`,
  `○ /opengraph-image`, `○ /twitter-image`).
- Live browser check: `PhotoDissolve.tsx` mounts and renders only once its
  texture is loaded and the chapter is near (`useNearChapter`, 150% root
  margin) — confirmed via screenshots at two different scroll positions
  showing the photo coherent at low dissolve and scattered at high
  dissolve.
- Confirmed exactly one of {WebGL particle version, DOM fallback} is ever
  visible at a time (`getComputedStyle` on the DOM ghost during an active
  WebGL dissolve showed `display: none`).

## What was not measured this pass

No frame-timing/FPS profile was taken (e.g. Chrome performance panel, R3F
`PerformanceMonitor`) on either desktop or a real mid-tier mobile device.
The 5400/1600 point-count split is a device-class judgment call (coarse
pointer or narrow viewport → 1600), consistent with this project's
existing tiering pattern elsewhere (`CosmicTier`, `TarunRunner`'s own
dust/geometry LOD), not a profiled number for *this* specific shader.

## Why the counts are where they are, not higher

The brief explicitly said not to default to "100k particles" and to start
lower. 5400 points is: enough to keep the photo's silhouette and dominant
tones legible mid-dissolve (verified visually, not just assumed), and
small next to this project's existing WebGL load — `StarField`'s and
`CosmicPath`'s own particle counts, running in the same persistent canvas,
are the real budget context this shares.

## Cost added by this pass, concretely

- One texture load (`memory-5.jpg`, already used elsewhere in the site —
  no new network asset).
- One `BufferGeometry` with three attributes (`position`, `aTarget`,
  `aUv`), sized `count × (3+3+2)` floats, built once, not per-frame.
- One `ShaderMaterial` — two small GLSL programs, no dependency on Drei or
  a postprocessing pipeline.
- `@theatre/core`/`@theatre/studio` are installed but import nothing at
  runtime yet — zero bundle or runtime cost from Theatre.js currently
  exists in the shipped site. `@theatre/studio` is a devDependency
  specifically so it can never ship even by accident.

## This pass's additions

- **StardustTrail**: one `BufferGeometry` sized for a fixed 420-particle
  pool (140 on coarse-pointer/narrow-viewport devices) — allocated once,
  never resized. Per-frame cost when idle (no pointer movement): one
  `useFrame` closure doing a handful of scalar comparisons, zero buffer
  writes (the `spawnCount > 0` branch, which is the only place attribute
  arrays are touched, is skipped entirely). Per-frame cost while actively
  spawning: at most 3 particles' worth of `BufferAttribute.setXYZ` calls
  (2 on mobile) — small, fixed, and independent of total particle count.
  Not separately profiled against an FPS counter this pass; verified only
  by direct observation (screenshots, console) that it doesn't visibly
  affect frame pacing during interactive testing.
- **Theatre.js runtime cost**: `TheatreClock`'s `useFrame` sets one number
  (`masterSheet.sequence.position`) every frame — Theatre's internal
  reactive graph (`onValuesChange` subscribers on two objects, "Camera"
  and "World") re-evaluates from that on frames where the value actually
  changed. Not benchmarked in isolation this pass; the production build's
  bundle size is the more relevant number here since `@theatre/core` has
  no per-frame cost proportional to scene complexity (it's a value graph,
  not a renderer). `@theatre/studio` — the actually-heavy dev-only
  package — confirmed absent from the production output (see
  `THEATRE_AUTHORING_GUIDE.md`).

## Recommended next profiling step (not done this pass)

Before extending `PhotoDissolve`-style shaders to more chapters (the
brief's fuller Journey rebuild, couple scene, etc.), get one real
Chrome performance trace on a mid-tier Android device scrolling through
Journey, and one on the lowest `CosmicTier` desktop path, before raising
any particle count further.
