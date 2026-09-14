# Theatre.js — Authoring Guide (Aurora V3)

Factual status: **evaluated and installed, not yet wired to drive anything.**
This document exists so the next pass (or a future session) doesn't have to
redo the compatibility research.

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

## The pattern to use, when this gets wired up

```ts
import { getProject, types } from "@theatre/core";

const project = getProject("Aurora V3");
const sheet = project.sheet("Journey Camera");

const cameraObj = sheet.object("camera", {
  position: types.compound({ x: 0, y: 0, z: 0 }),
  fov: types.number(50, { range: [20, 90] }),
});

cameraObj.onValuesChange((values) => {
  camera.position.set(values.position.x, values.position.y, values.position.z);
  camera.fov = values.fov;
  camera.updateProjectionMatrix();
});
```

`onValuesChange` fires outside React's render cycle — call it once in a
`useEffect`, mutate the existing R3F refs directly, same discipline this
project already uses for `useFrame` (never `setState` per frame).

`@theatre/studio` (the visual scrubber UI) must only ever be imported
behind a dev-only gate:

```ts
if (process.env.NODE_ENV === "development") {
  const studio = (await import("@theatre/studio")).default;
  studio.initialize();
}
```

Never a static top-level import — that would pull the studio UI into the
production bundle.

## Ownership boundary (per the brief, reaffirmed, not yet enforced in code)

Theatre.js would own: camera position/target, major lighting values, large
scene transforms, staged character placement. GSAP keeps: DOM masks, title
reveals, nav, microinteractions. **Nothing currently violates this only
because nothing has been moved to Theatre yet** — the existing camera rig
(`CameraRig` in `CosmicScene.tsx`) still owns the camera via its own
hand-authored monotone-cubic spline over `CAMERA_KEYS`, untouched this pass.

## Why this wasn't wired up this pass

Time was spent on the brief's one explicitly *mandatory* deliverable (the
real GPU particle photo dissolve, see `ACTIVE_THEORY_TRANSLATION.md`)
instead. Moving the camera rig to Theatre is a real, isolated, doable next
step — it does not require touching anything else this document covers.
