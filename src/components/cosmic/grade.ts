/**
 * Site-wide cosmic colour grading.
 *
 * One stop per chapter, interpolated by `SceneProgressRef.storyPosition`
 * (a steady one-eighth of the range per chapter) rather than by raw
 * document scroll — so every stop-to-stop blend is spread across at least
 * the back half of one chapter plus the front half of the next, i.e. never
 * less than a full viewport height and, across the two pinned chapters,
 * several. There is no keyframe or class switch anywhere in this path: the
 * only thing that ever happens is a linear RGB lerp between neighbouring
 * stops, which is what keeps the mood shift from reading as a gradient
 * "changing over" at some particular scroll position.
 *
 * The same function feeds both the CSS atmosphere layer (DOM custom
 * properties) and the WebGL fog/nebula, so the two can never disagree
 * about what colour the universe currently is.
 */

export type GradeStop = {
  /** Deep background wash — the colour of the dark between the stars. */
  base: string;
  /** The faint bloom sitting inside that dark. */
  glow: string;
  /** 0-1 strength of that bloom. */
  glowStrength: number;
  /**
   * 0-1 "quiet the sky down" amount: dims and slows the starfield. Highest
   * where a photograph or a flame should be the only thing being looked at.
   */
  quiet: number;
  /** 0-1 multiplier on the film-grain overlay; lowered over photography. */
  grain: number;
};

/** Ordered to match `chapters` in `@/lib/content` exactly. */
export const GRADE_STOPS: GradeStop[] = [
  // 01 portal — opening black, sparse stars.
  { base: "#050506", glow: "#2a2118", glowStrength: 0.5, quiet: 0.15, grain: 1 },
  // 02 miracle — early memories, warm brown-black. Holds a real photograph.
  { base: "#0d0a07", glow: "#3a2a18", glowStrength: 0.46, quiet: 0.3, grain: 0.55 },
  // 03 story — the Memory Constellation: slightly more celestial structure.
  { base: "#080a12", glow: "#23304a", glowStrength: 0.44, quiet: 0.1, grain: 0.9 },
  // 04 journey — night indigo, the deepest "travelling" colour.
  { base: "#06070f", glow: "#1a2036", glowStrength: 0.5, quiet: 0.18, grain: 0.85 },
  // 05 memories — deliberately neutral and quiet: the photographs are the
  // subject here, so the sky steps back rather than tinting them.
  { base: "#080807", glow: "#221c14", glowStrength: 0.26, quiet: 0.5, grain: 0.3 },
  // 06 letter — calmer, warmer black; the universe turning inward.
  { base: "#0e0b08", glow: "#3a2a1b", glowStrength: 0.5, quiet: 0.62, grain: 0.75 },
  // 07 birthday — near-total darkness, so one flame can carry the frame.
  { base: "#040403", glow: "#1e1408", glowStrength: 0.24, quiet: 0.55, grain: 0.6 },
  // 08 finale — obsidian and Aurora gold.
  { base: "#070605", glow: "#4a3720", glowStrength: 0.6, quiet: 0.2, grain: 0.9 },
];

export type Grade = {
  base: string;
  glow: string;
  glowStrength: number;
  quiet: number;
  grain: number;
  /** Linear components of `base`, for the WebGL fog. */
  baseRgb: [number, number, number];
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgbString(rgb: [number, number, number]) {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;
}

const RGB_STOPS = GRADE_STOPS.map((s) => ({
  base: hexToRgb(s.base),
  glow: hexToRgb(s.glow),
}));

/**
 * Interpolate the grade at a 0-1 story position. Linear (not eased)
 * between stops on purpose — easing would concentrate the change into the
 * middle of each blend, which is exactly the visible "switch" this is
 * meant to avoid.
 */
export function gradeAt(position: number): Grade {
  const last = GRADE_STOPS.length - 1;
  const p = Math.min(1, Math.max(0, position)) * last;
  const i = Math.min(last, Math.floor(p));
  const j = Math.min(last, i + 1);
  const t = p - i;

  const a = GRADE_STOPS[i];
  const b = GRADE_STOPS[j];
  const ra = RGB_STOPS[i];
  const rb = RGB_STOPS[j];

  const baseRgb: [number, number, number] = [
    mix(ra.base[0], rb.base[0], t),
    mix(ra.base[1], rb.base[1], t),
    mix(ra.base[2], rb.base[2], t),
  ];
  const glowRgb: [number, number, number] = [
    mix(ra.glow[0], rb.glow[0], t),
    mix(ra.glow[1], rb.glow[1], t),
    mix(ra.glow[2], rb.glow[2], t),
  ];

  return {
    base: rgbString(baseRgb),
    glow: rgbString(glowRgb),
    glowStrength: mix(a.glowStrength, b.glowStrength, t),
    quiet: mix(a.quiet, b.quiet, t),
    grain: mix(a.grain, b.grain, t),
    baseRgb,
  };
}
