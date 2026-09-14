"use client";

import { getProject, types } from "@theatre/core";

/**
 * One project, one master sheet, for the whole site — module-scope so every
 * consumer (TheatreDirector, CameraRig, a future Studio session opened
 * locally) shares the exact same instances. Only ever imported from inside
 * CosmicScene.tsx's chunk, which is itself loaded via `next/dynamic(...,
 * {ssr:false})` from CosmicBackdrop — so this never executes during SSR.
 *
 * No `state` is passed to `getProject` yet: nothing has been authored in
 * Studio in this pass. See THEATRE_AUTHORING_GUIDE.md for why hand-writing
 * Theatre's on-disk state format was evaluated and rejected rather than
 * attempted — it's typed `__UNSTABLE_Project_OnDiskState` in Theatre's own
 * public `.d.ts`, and the project's own docstring says it's "as exported by
 * the studio," not meant for external authoring. Every prop below is
 * therefore its own static default — live-tunable in Studio locally, real
 * and inspectable, until an actual authoring session exports
 * `auroraState.json` for production determinism.
 */
export const AURORA_SEQUENCE_LENGTH = 120;

export const auroraProject = getProject("Project Aurora V3");
export const masterSheet = auroraProject.sheet("Master Experience");

/**
 * A live correction layer over the existing hand-authored camera spline
 * (CosmicScene.tsx's `sampleCameraArc`/`CAMERA_KEYS`) — not a replacement
 * for it. Defaults are no-ops (0 bias, ×1 drift, zero boost), so nothing
 * about the shipped camera arc changes until someone opens Studio locally
 * and nudges these. See THEATRE_AUTHORING_GUIDE.md's "what's still owed"
 * section for why the primary per-chapter arc itself isn't keyframed here.
 */
export const theatreCamera = masterSheet.object("Camera", {
  fovBias: types.number(0, { range: [-10, 10], label: "FOV bias" }),
  driftMultiplier: types.number(1, { range: [0, 2], label: "Drift ×" }),
  positionBoost: types.compound({
    x: types.number(0, { range: [-1, 1] }),
    y: types.number(0, { range: [-1, 1] }),
    z: types.number(0, { range: [-1, 1] }),
  }),
});

/**
 * Whole-scene offset applied to the group wrapping every visual object in
 * CosmicScene's Universe (stars, nebula, moons, Tarun, the couple, the
 * photo dissolve) — not the camera or the lights, which stay world-space so
 * they keep illuminating/framing the offset content correctly. Defaults to
 * (0,0,0): a real, live, currently-inert hook.
 */
export const theatreWorld = masterSheet.object("World", {
  offset: types.compound({
    x: types.number(0, { range: [-2, 2] }),
    y: types.number(0, { range: [-2, 2] }),
    z: types.number(0, { range: [-2, 2] }),
  }),
});

/**
 * Created as real, inspectable, Studio-editable objects per the brief's
 * named list — not yet wired into any visual output. Honestly unfinished:
 * see AURORA_V3_ARCHITECTURE.md for exactly what "wired" would mean for
 * each of these and why they weren't reached this pass.
 */
export const theatreHeroWorld = masterSheet.object("HeroWorld", {
  auroraIntensity: types.number(1, { range: [0, 2] }),
});
export const theatreJourneyWorld = masterSheet.object("JourneyWorld", {
  fogDensity: types.number(1, { range: [0, 2] }),
});
export const theatreJourneyLight = masterSheet.object("JourneyLight", {
  warmth: types.number(1, { range: [0, 2] }),
});
export const theatreConstellationWorld = masterSheet.object("ConstellationWorld", {
  spread: types.number(1, { range: [0, 2] }),
});
export const theatreCoupleWorld = masterSheet.object("CoupleWorld", {
  presenceBoost: types.number(0, { range: [-1, 1] }),
});
export const theatreBirthdayWorld = masterSheet.object("BirthdayWorld", {
  candleWarmth: types.number(1, { range: [0, 2] }),
});
export const theatreFinaleWorld = masterSheet.object("FinaleWorld", {
  pullback: types.number(1, { range: [0, 2] }),
});

/**
 * Studio is a development-only authoring tool — this is the one and only
 * place it is ever imported, and only behind this guard. `import()` is
 * lazy: in a production build the condition is false, the `.then()` branch
 * never executes, and a production visitor's browser never requests the
 * Studio chunk. `@theatre/studio` is a devDependency specifically so this
 * can never accidentally ship even if this guard were removed by mistake in
 * a non-production environment check.
 */
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  import("@theatre/studio").then((studioModule) => {
    // Silently ignores a second call — safe against React StrictMode's
    // double-invoke or a fast-refresh re-import of this module.
    studioModule.default.initialize();
  });
}
