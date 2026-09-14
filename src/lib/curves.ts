/**
 * Small allocation-free easing/lookup helpers shared by every hand-authored
 * motion curve in the project (the cake, the story islands, the post-wish
 * celebration). One copy, so every timeline reads the same way.
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

/**
 * How "in focus" a slot is within a continuous 0-1 progress: `slot`'s own
 * window of `progress`, eased in, held, eased out. `windowHalfWidth` is the
 * half-width of that window — a bigger number means neighbouring slots
 * overlap more as one fades and the next rises.
 */
export function focusWindow(
  progress: number,
  slot: number,
  windowHalfWidth: number
): number {
  const x = (progress - slot + windowHalfWidth) / (2 * windowHalfWidth);
  return keyframes(x, [[0, 0], [0.25, 1], [0.75, 1], [1, 0]]);
}

/** `index`'s position among `count` evenly spaced slots across 0-1. */
export function slotPosition(index: number, count: number): number {
  return count <= 1 ? 0.5 : index / (count - 1);
}
