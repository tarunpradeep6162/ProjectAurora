"use client";

import { getProject, types } from "@theatre/core";
import auroraState from "./auroraState.json";

/**
 * One project, one master sheet, for the whole site — module-scope so every
 * consumer (TheatreDirector, CameraRig, a future Studio session opened
 * locally) shares the exact same instances. Only ever imported from inside
 * CosmicScene.tsx's chunk, which is itself loaded via `next/dynamic(...,
 * {ssr:false})` from CosmicBackdrop — so this never executes during SSR.
 *
 * `auroraState.json` is passed as `config.state` — not hand-written (see
 * THEATRE_AUTHORING_GUIDE.md for why hand-writing Theatre's on-disk state
 * format was evaluated and rejected), but genuinely produced by Theatre
 * Studio's own public `studio.createContentOfSaveFile()` API, run once in
 * dev. It's currently minimal (`sheetsById: {}` — no keyframes authored
 * yet), but it is real, schema-valid, tool-generated JSON, and its mere
 * presence matters as much as its content right now: without *some*
 * `config.state`, `@theatre/core` itself throws a real, uncaught error in
 * any browser where Studio isn't attached — including every production
 * visitor — exactly one second after `getProject()` runs (see its own
 * source: "you need to set config.state, otherwise your project's state
 * will be empty and nothing will animate"). That was shipped once as a
 * real production bug in this project's history and is fixed by this file
 * existing at all, independent of whether it holds real keyframes yet.
 */
export const AURORA_SEQUENCE_LENGTH = 120;

export const auroraProject = getProject("Project Aurora V3", { state: auroraState });
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
 * The Aurora Relic — the hero's central sculptural object
 * (`AuroraRelic.tsx`). A correction layer over its own hand-authored idle
 * motion (rotation drift, breathing position), exactly the same shape as
 * the Camera object above: defaults are no-ops, real and live once
 * someone opens Studio and nudges them.
 */
export const theatreAuroraRelic = masterSheet.object("AuroraRelic", {
  rotationBoost: types.compound({
    x: types.number(0, { range: [-1, 1] }),
    y: types.number(0, { range: [-1, 1] }),
    z: types.number(0, { range: [-1, 1] }),
  }),
  positionBoost: types.compound({
    x: types.number(0, { range: [-1, 1] }),
    y: types.number(0, { range: [-1, 1] }),
    z: types.number(0, { range: [-1, 1] }),
  }),
  scaleMultiplier: types.number(1, { range: [0.5, 1.5], label: "Scale ×" }),
});

/** The Relic's dedicated three-point-style lighting — genuinely applied every frame in AuroraRelic.tsx, not a correction layer this time, since these lights have no other authored source to correct. */
export const theatreRelicKey = masterSheet.object("RelicKey", {
  intensity: types.number(2.4, { range: [0, 6] }),
  color: types.rgba({ r: 0.94, g: 0.88, b: 0.75, a: 1 }),
});
export const theatreRelicRim = masterSheet.object("RelicRim", {
  intensity: types.number(1.6, { range: [0, 6] }),
  color: types.rgba({ r: 0.68, g: 0.62, b: 0.86, a: 1 }),
});

/** The floating memory-block field around the Relic (`MemoryBlocks.tsx`). `assembly` is how "apart" the blocks sit — 1 is their authored resting positions; a future entry sequence could animate this toward 0 (gathered) or beyond 1 (separating) without this pass having to build that sequence now. */
export const theatreMemoryBlocks = masterSheet.object("MemoryBlocks", {
  assembly: types.number(1, { range: [0, 1.6], label: "Assembly" }),
});

/**
 * The hero's tulip garden (`TulipGarden.tsx`), which replaced the Aurora
 * Relic as the portal's signature visual. `reveal` and `windStrength` are
 * correction layers over the garden's own hand-authored presence curve and
 * idle sway — same pattern as `Camera`/`AuroraRelic` above — defaulting to
 * exact no-ops. `keyIntensity`/`rimIntensity` are applied directly, the
 * same way `RelicKey`/`RelicRim` are, since the garden's lighting has no
 * other authored source to correct against.
 */
export const theatreTulipGarden = masterSheet.object("TulipGarden", {
  reveal: types.number(1, { range: [0, 1.4], label: "Reveal" }),
  windStrength: types.number(1, { range: [0, 2], label: "Wind" }),
  keyIntensity: types.number(2.2, { range: [0, 6] }),
  rimIntensity: types.number(1.3, { range: [0, 6] }),
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
    // Dev-only convenience for the next real authoring session: once
    // someone places real keyframes in Studio, re-export via
    // `window.__theatreStudio.createContentOfSaveFile("Project Aurora V3")`
    // and overwrite auroraState.json with the result. Never runs in
    // production regardless (see the guard above).
    (window as unknown as { __theatreStudio?: unknown }).__theatreStudio = studioModule.default;
  });
}
