# Theatre.js — Authoring Guide (Aurora V3)

Factual status, updated after a second pass: **evaluated, installed, and
now genuinely wired** — a project, a master sheet, nine semantic objects,
a live master-sequence clock, and a real (if currently no-op-by-default)
camera correction + world offset actually applied to the scene every
frame. What's still missing is keyframed authorship of the primary camera
arc and the six not-yet-connected semantic objects — see "What's still
owed," below, for exactly what that requires and why it wasn't attempted
blind.

## The compatibility finding

Checked directly against the npm registry, not assumed:

| Package | Peer deps that matter | Verdict |
|---|---|---|
| `@theatre/core@0.7.2` | only `@theatre/dataverse` (same-family, auto-resolved) | Installed. Zero conflict. |
| `@theatre/studio@0.7.2` | only `@theatre/core: "*"` | Installed as devDependency. Zero conflict. |
| `@theatre/r3f@latest` | `@react-three/fiber: "^8.13.6"` | **Not installed.** This project runs `@react-three/fiber@^9.7.0` — a major version past what `@theatre/r3f` accepts. |

So: no `@theatre/r3f`, no `<SheetProvider>` / `e()` JSX wrapper pattern
that package normally gives you. The path this project uses instead is
`@theatre/core`'s standalone API, driving plain Three.js objects/refs by
hand inside `useFrame` — which is exactly the fallback the brief itself
pre-authorized for this scenario.

## What's actually built, in `src/theatre/`

`auroraProject.ts` — one project (`"Project Aurora V3"`), one master sheet
(`"Master Experience"`), and nine `sheet.object(...)` calls using exactly
the vanilla `@theatre/core` API this doc originally sketched (no
`@theatre/r3f`, confirmed still incompatible — see below). The dev-only
Studio gate is the officially documented pattern, read from Theatre's own
`.d.ts` comment on `IStudio.initialize()`, not improvised:

```ts
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  import("@theatre/studio").then((studioModule) => {
    studioModule.default.initialize();
  });
}
```

A dynamic `import()` rather than a static one specifically so a production
build never even emits a reachable reference to fetch — verified by
grepping a real `next build` output for `"Outline Menu"` (a string that
only exists inside Studio's own UI code) and finding zero matches.

`TheatreDirector.tsx` exports three things, all real and live:
- `TheatreClock` — a `useFrame` component that sets
  `masterSheet.sequence.position = storyPosition * 120` every frame. This
  is the genuinely-live "one shared cinematic clock": open Studio locally
  and its timeline playhead visibly scrubs as the real site is scrolled.
- `useTheatreCameraCorrection()` — subscribes to the "Camera" object's
  `onValuesChange` into a plain ref (never React state). `CameraRig` in
  `CosmicScene.tsx` reads it every frame and applies `fovBias`
  (additive), `driftMultiplier` (scales the existing idle-float/parallax
  amplitude), and `positionBoost` (additive x/y/z) *after* computing the
  existing hand-authored spline's target pose — a correction layer, not a
  replacement.
- `useTheatreWorldOffset()` — same pattern, feeding a new `<WorldGroup>`
  wrapper (`CosmicScene.tsx`) around every visual object (stars, nebula,
  moons, Tarun, the couple, the photo dissolve) — not the camera or the
  lights, so an offset world still gets lit and framed correctly.

All of the above default to exact no-ops (`fovBias:0`, `driftMultiplier:1`,
`positionBoost:{0,0,0}`, `offset:{0,0,0}`) and were verified live: the
camera arc and world layout are visually unchanged from before this pass
with Studio open and untouched.

## What's still owed: keyframed ownership of the primary camera arc

The brief's list ("Theatre Core must genuinely control at least: master
sequence, global camera...") is only partially met. The master sequence
and a correction layer are real; the *primary* per-chapter arc
(`CAMERA_KEYS`/`sampleCameraArc` in `CosmicScene.tsx`) is still computed
by the existing hand-authored monotone-cubic spline, unchanged.

This was a deliberate decision, not an oversight, for a concrete, checked
reason: Theatre's own public `.d.ts`
(`node_modules/@theatre/core/dist/index.d.ts`) types the project state
format as `__UNSTABLE_Project_OnDiskState`, and `IProjectConfig.state` is
typed `$IntentionalAny` with the doc comment "as exported by the studio."
Read directly from the installed package, not assumed. Theatre's sanctioned
authoring workflow is: a human opens Studio, places keyframes visually on
the sequence timeline, then exports `auroraState.json` through Studio's own
export flow for production determinism. Hand-typing that JSON blindly
against a format its own authors mark unstable was evaluated and rejected
as exactly the kind of guess this project's standing rules warn against —
a state file Theatre's loader might reject outright, or worse, silently
misinterpret.

**The real next step**: open `npm run dev` locally, Studio self-initializes
(see the dev-gate above), open its Outline panel (visible in
`AURORA_V3_ARCHITECTURE.md`'s live screenshots — this pass confirmed all
nine objects genuinely appear there), select "Camera," scrub the sequence
to each chapter's position (`chapterAnchor(index) * 120`, using
`CosmicScene.tsx`'s existing `RESOLVED_KEYS`/`chapterAnchor` as the exact
reference values — the 8-chapter table in `CAMERA_KEYS` is the ground
truth to key against), and place real keyframes. Export via Studio's UI to
`src/theatre/auroraState.json`, then pass it to `getProject`:
`getProject("Project Aurora V3", { state })`. At that point `CameraRig`
could be simplified to read `theatreCamera.value` directly instead of
computing `sampleCameraArc` — but that swap should only happen once the
keyframed values are verified to reproduce the existing, already-tuned
motion, not before.

## Ownership boundary (per the brief, now partially real)

Theatre owns: the master sequence clock (real), a camera correction layer
(real, currently inert), a world offset (real, currently inert). GSAP
still owns: DOM masks, title reveals, nav, microinteractions — untouched.
The primary camera transform is still the hand-authored spline, not yet
Theatre's, so there is no current risk of the two systems fighting over
the same property — the correction layer is explicitly additive/
multiplicative on top of the spline's output, never a second writer to the
same base value.
