/**
 * The post-wish celebration, ported from the original Project Aurora's
 * heart/infinity/butterfly star-shapes and falling confetti. Positions and
 * scales are re-tuned for this cake canvas's tight, close-up camera (the
 * original staged them across a whole open sky); the shapes, colours,
 * particle counts and timing curves are the original's.
 */

export type ShapeKind = "heart" | "infinity" | "butterfly";

/** A classic parametric heart curve, sampled to `count` outline points. */
function heartPoints(count: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = 16 * Math.sin(a) ** 3;
    const y =
      13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    points.push([x / 17, y / 17]);
  }
  return points;
}

/** A figure-eight (lemniscate), sampled to `count` outline points. */
function infinityPoints(count: number): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const denom = 1 + Math.sin(a) ** 2;
    points.push([(Math.cos(a) / denom) * 1.05, ((Math.sin(a) * Math.cos(a)) / denom) * 1.6]);
  }
  return points;
}

/** Hand-authored outline, wings-open silhouette. */
const BUTTERFLY_POINTS: [number, number][] = [
  [0, 0.55], [0, 0.1], [0, -0.45],
  [-0.28, 0.72], [-0.72, 0.55], [-0.85, 0.1], [-0.55, -0.15], [-0.62, -0.6], [-0.22, -0.4],
  [0.28, 0.72], [0.72, 0.55], [0.85, 0.1], [0.55, -0.15], [0.62, -0.6], [0.22, -0.4],
  [-0.12, 0.78], [0.12, 0.78],
];

const SHAPE_OUTLINES: Record<ShapeKind, [number, number][]> = {
  heart: heartPoints(14),
  infinity: infinityPoints(16),
  butterfly: BUTTERFLY_POINTS,
};

/** Resample a shape's outline into `count` points, each with a little jitter off the line. */
export function shapeParticlePositions(kind: ShapeKind, count: number): Float32Array {
  const outline = SHAPE_OUTLINES[kind];
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const f = (i / count) * outline.length;
    const a = outline[Math.floor(f) % outline.length];
    const b = outline[(Math.floor(f) + 1) % outline.length];
    const s = f - Math.floor(f);
    out[i * 3] = a[0] + (b[0] - a[0]) * s + (Math.random() - 0.5) * 0.08;
    out[i * 3 + 1] = a[1] + (b[1] - a[1]) * s + (Math.random() - 0.5) * 0.08;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
  }
  return out;
}

export const SHAPE_KINDS: ShapeKind[] = ["heart", "infinity", "butterfly"];

export type ShapeBurst = {
  /** Local to the cake canvas — close over the flames, not scattered across a sky. */
  position: [number, number, number];
  scale: number;
  shape: ShapeKind;
  color: string;
};

/**
 * Six burst slots in the original (three on phones); re-placed to sit around
 * and above the cake within this canvas's tight framing instead of the
 * original's wide-open sky.
 */
export const SHAPE_BURSTS: ShapeBurst[] = [
  { position: [-1.5, 2.4, -0.6], scale: 0.5, shape: "heart", color: "#ff8dc3" },
  { position: [1.4, 2.9, -1.1], scale: 0.62, shape: "infinity", color: "#ffd98a" },
  { position: [0.1, 3.6, -1.6], scale: 0.72, shape: "butterfly", color: "#9ad4ff" },
  { position: [-1.9, 3.2, -1.8], scale: 0.66, shape: "heart", color: "#c9a6ff" },
  { position: [1.7, 1.9, -0.3], scale: 0.46, shape: "infinity", color: "#ffb3d9" },
  { position: [-0.4, 4.1, -2.2], scale: 0.8, shape: "butterfly", color: "#8fe6b8" },
];

export type ConfettiKind = {
  scale: [number, number, number];
  color: string;
  spin: number;
};

/** Four thin-plane confetti "kinds", ratios and colours the original's. */
export const CONFETTI_KINDS: ConfettiKind[] = [
  { scale: [0.055, 0.055, 0.012], color: "#dff0ff", spin: 1.6 },
  { scale: [0.09, 0.05, 0.02], color: "#ffc3e0", spin: 0.7 },
  { scale: [0.03, 0.16, 0.01], color: "#e8c98f", spin: 1.1 },
  { scale: [0.045, 0.045, 0.045], color: "#fff2c8", spin: 2 },
];

/** Confetti falls between these two heights, local to the cake canvas. */
export const CONFETTI_TOP = 3.4;
export const CONFETTI_BOTTOM = -1.3;
