/**
 * Timing curves for the birthday cake, ported value-for-value from the
 * original Project Aurora cake scene. Every function writes into a caller
 * owned object instead of returning a new one, because they run every frame.
 */

type Frames = ReadonlyArray<readonly [number, number]>;

/** Piecewise-linear lookup, clamped at both ends. */
export function keyframes(t: number, frames: Frames): number {
  const first = frames[0];
  const last = frames[frames.length - 1];
  const x = Math.min(last[0], Math.max(first[0], t));
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, v0] = frames[i];
    const [t1, v1] = frames[i + 1];
    if (x <= t1) {
      const k = t1 === t0 ? 0 : (x - t0) / (t1 - t0);
      return v0 + (v1 - v0) * k;
    }
  }
  return last[1];
}

/** Seconds for the entrance to run from nothing to fully lit. */
export const ENTRANCE_SECONDS = 4.5;

/** Entrance progress at which the cake is fully up and every candle is lit. */
export const FULLY_LIT_PROGRESS = 0.6;

const PRESENT: Frames = [[0, 0], [0.08, 0], [0.28, 1]];
const PRESENT_REDUCED: Frames = [[0, 0], [0.15, 1]];
const LIFT: Frames = [[0, 0], [0.1, 0], [0.34, 1]];
const PULSE: Frames = [[0, 0], [0.36, 0], [0.44, 1], [0.56, 0]];

/** How far the cake has risen into frame, and the warm pulse as it arrives. */
export function stageCake(
  progress: number,
  reduced: boolean,
  out: { present: number; lift: number; pulse: number }
) {
  if (reduced) {
    out.present = keyframes(progress, PRESENT_REDUCED);
    out.lift = 1;
    out.pulse = 0;
    return;
  }
  out.present = keyframes(progress, PRESENT);
  out.lift = keyframes(progress, LIFT);
  out.pulse = keyframes(progress, PULSE);
}

/** Candles light one after another as the entrance completes. */
export function candleLit(
  progress: number,
  index: number,
  count: number,
  reduced: boolean
): number {
  if (reduced) return progress > 0.4 ? 1 : 0;
  const offset = count <= 1 ? 0 : (index / count) * 0.08;
  const start = 0.38 + offset;
  const end = 0.46 + offset;
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

/** The flame's live flicker: three detuned waves, so it never visibly loops. */
export function flicker(time: number, reduced: boolean): number {
  if (reduced) return 0.85;
  return (
    0.82 +
    Math.sin(time * 7.3) * 0.06 +
    Math.sin(time * 11.7 + 1.3) * 0.045 +
    Math.sin(time * 3.1 + 2.7) * 0.035
  );
}

/** Seconds for the flames to flare and die after the wish. */
export const FLAME_OUT_SECONDS = 0.9;

const FLAME_OUT: Frames = [[0, 1], [0.15, 1.25], [FLAME_OUT_SECONDS, 0]];
const SMOKE: Frames = [[0, 0], [FLAME_OUT_SECONDS, 1], [3.5, 0]];

/**
 * After the wish: the flames flare once and go out, then smoke rises and
 * thins. `elapsed` is null until the candles are blown out.
 */
export function blowOut(
  elapsed: number | null,
  reduced: boolean,
  out: { flame: number; smoke: number }
) {
  if (elapsed === null) {
    out.flame = 1;
    out.smoke = 0;
    return;
  }
  const t = reduced ? elapsed * 1.6 : elapsed;
  out.flame = keyframes(t, FLAME_OUT);
  out.smoke = keyframes(t, SMOKE);
}

/** Mutable per-frame state shared by everything inside the cake canvas. */
export type CakeMotion = {
  progress: number;
  present: number;
  lift: number;
  pulse: number;
  elapsed: number | null;
  flame: number;
  smoke: number;
  /** Scene brightness: 1 lit, low while the chapter holds its darkness. */
  dim: number;
};

export function createCakeMotion(): CakeMotion {
  return {
    progress: 0,
    present: 0,
    lift: 0,
    pulse: 0,
    elapsed: null,
    flame: 1,
    smoke: 0,
    dim: 1,
  };
}
