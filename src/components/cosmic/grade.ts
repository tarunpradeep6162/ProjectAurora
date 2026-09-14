/**
 * Site-wide cosmic colour grading.
 *
 * One stop per chapter, interpolated by `SceneProgressRef.storyPosition`.
 * There is no keyframe or class switch anywhere in this path: the only thing
 * that ever happens is a linear RGB lerp between neighbouring stops, which is
 * what keeps the mood shift from reading as a gradient "changing over" at
 * some particular scroll position.
 *
 * Where each stop sits. `storyPosition` is `(chapterIndex + chapterProgress)
 * / (chapters - 1)`, so a stop placed at `k / (chapters - 1)` is only reached
 * at the very *start* of chapter k and is already blending away by the time
 * that chapter's content is centred — which is what this table used to do,
 * and why a photograph or the candle never actually sat under its own
 * chapter's grade. Stops are now anchored *inside* their chapter: by default
 * at its centre, or held flat across a `hold` range of that chapter's own
 * progress where a photograph, a body of text or the flame owns the screen.
 * The last chapter is the exception: `storyPosition` saturates at 1 as soon
 * as it begins, so its stop is anchored at 1.
 *
 * `quiet` is the one "step the sky back" control for the whole cosmos. The
 * starfield, nebula, moons, cosmic path and CSS fallback stars all read it —
 * nothing keeps a parallel brightness table — so "when a photo or text owns
 * the screen, the galaxy behind it dims" is expressed here, once, per chapter.
 *
 * The same function feeds both the CSS atmosphere layer (DOM custom
 * properties) and the WebGL fog/nebula/moons, so the two can never disagree
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
   * 0-1 "quiet the sky down" amount: dims (and slows) every cosmic layer.
   * Highest where a photograph, the letter or a flame should be the only
   * thing being looked at.
   */
  quiet: number;
  /** 0-1 multiplier on the film-grain overlay; lowered over photography. */
  grain: number;
  /**
   * Range of this chapter's own progress (0-1) across which the stop is held
   * exactly, before blending toward its neighbours. Defaults to the chapter
   * centre, `[0.5, 0.5]`. Ignored for the last chapter (see above). Keep holds
   * narrow enough that every blend still spans roughly a viewport of scroll.
   */
  hold?: readonly [number, number];
};

/**
 * Ordered to match `chapters` in `@/lib/content` exactly. Pink/violet love
 * theme, restrained: every stop keeps its original near-black luminance,
 * hold range and quiet/grain pacing — the hue moved from amber-gold to
 * violet and dusty rose, but at noticeably lower saturation than a first
 * pass at this theme used, so colour still reads as light emerging from
 * darkness rather than a coloured wash sitting over it. `glowStrength` is
 * trimmed too, chapter by chapter, for the same reason. Only the finale
 * is allowed to warm toward actual champagne — everywhere else stays
 * closer to charcoal-plum than to pink.
 */
export const GRADE_STOPS: GradeStop[] = [
  // 01 portal — obsidian and violet: the galaxy's edge.
  { base: "#050406", glow: "#1c1428", glowStrength: 0.38, quiet: 0.15, grain: 1 },
  // 02 miracle — used to hold `quiet` high because a real photograph sat
  // behind the heading for the middle of the chapter and the sky needed to
  // step back for it. That photograph is gone (see ChapterMiracle.tsx) and
  // this chapter is now the one place the galaxy itself is the subject
  // (its own dense nebula, MiracleNebula.tsx) — so the sky no longer steps
  // back here at all; the old 0.36/hold pairing was silently dimming and
  // freezing the very starfield this chapter is now supposed to show off.
  { base: "#0a070a", glow: "#2e1a22", glowStrength: 0.34, quiet: 0.08, grain: 0.55 },
  // 03 story — the timeline and its constellation: deep violet structure.
  { base: "#08070d", glow: "#211a30", glowStrength: 0.32, quiet: 0.1, grain: 0.9 },
  // 04 journey — a touch richer than story: still night-violet, not brighter.
  { base: "#07060c", glow: "#241d34", glowStrength: 0.36, quiet: 0.18, grain: 0.85 },
  // 05 memories — deliberately neutral and quiet: full-frame photographs are
  // the subject for almost the whole pinned chapter, so the sky steps back
  // across that whole stretch rather than peaking at one point in it.
  {
    base: "#0a0709",
    glow: "#241a1e",
    glowStrength: 0.22,
    quiet: 0.6,
    grain: 0.3,
    hold: [0.15, 0.85],
  },
  // 06 letter — warm charcoal and an extremely muted plum; the universe
  // turning inward while a body of text is being read.
  {
    base: "#0c0a0b",
    glow: "#2a1c24",
    glowStrength: 0.32,
    quiet: 0.66,
    grain: 0.75,
    hold: [0.3, 0.7],
  },
  // 07 birthday — almost total black, so one flame can carry the frame.
  {
    base: "#030203",
    glow: "#160e14",
    glowStrength: 0.18,
    quiet: 0.8,
    grain: 0.6,
    hold: [0.35, 0.5],
  },
  // 08 finale — deep violet-black, champagne and restrained Aurora rose;
  // the one stop allowed real warmth, and only here.
  { base: "#08060a", glow: "#5c4030", glowStrength: 0.46, quiet: 0.2, grain: 0.9 },
];

export type Grade = {
  base: string;
  glow: string;
  glowStrength: number;
  quiet: number;
  grain: number;
  /** 0-255 sRGB components of `base`, for the WebGL fog. */
  baseRgb: [number, number, number];
};

/**
 * Non-allocating grade sample for per-frame WebGL consumers. Fill one of
 * these once (see `createGradeSample`) and pass it to `sampleGrade` every
 * frame instead of calling `gradeAt`, which has to build strings for CSS.
 */
export type GradeSample = {
  quiet: number;
  glowStrength: number;
  grain: number;
  /** 0-255 sRGB components of `base`. */
  baseR: number;
  baseG: number;
  baseB: number;
};

export function createGradeSample(): GradeSample {
  return { quiet: 0, glowStrength: 0, grain: 0, baseR: 0, baseG: 0, baseB: 0 };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgbString(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

const RGB_STOPS = GRADE_STOPS.map((s) => ({
  base: hexToRgb(s.base),
  glow: hexToRgb(s.glow),
}));

const LAST = GRADE_STOPS.length - 1;

/** Story-position anchors of each stop's hold range (see the header comment). */
const HOLD_START = GRADE_STOPS.map((s, k) =>
  k === LAST ? 1 : (k + (s.hold?.[0] ?? 0.5)) / LAST
);
const HOLD_END = GRADE_STOPS.map((s, k) =>
  k === LAST ? 1 : (k + (s.hold?.[1] ?? 0.5)) / LAST
);

/**
 * Story position at which a chapter's content is centred — the same anchor
 * the grade stops use by default. Exported so other authored tables (the
 * camera arc in CosmicScene) key their stops to exactly the same moments.
 */
export function chapterAnchor(index: number): number {
  if (index >= LAST) return 1;
  return Math.max(0, (index + 0.5) / LAST);
}

/** Scratch result of `locate`, reused so lookups never allocate. */
const loc = { i: 0, j: 0, t: 0 };

function locate(position: number) {
  const p = Math.min(1, Math.max(0, position));
  loc.i = LAST;
  loc.j = LAST;
  loc.t = 0;
  for (let k = 0; k <= LAST; k++) {
    if (p <= HOLD_END[k]) {
      if (k === 0 || p >= HOLD_START[k]) {
        loc.i = k;
        loc.j = k;
        loc.t = 0;
      } else {
        const span = Math.max(1e-6, HOLD_START[k] - HOLD_END[k - 1]);
        loc.i = k - 1;
        loc.j = k;
        loc.t = (p - HOLD_END[k - 1]) / span;
      }
      break;
    }
  }
  return loc;
}

/** Fill `out` with the grade at a 0-1 story position. Allocation-free. */
export function sampleGrade(position: number, out: GradeSample): GradeSample {
  const { i, j, t } = locate(position);
  const a = GRADE_STOPS[i];
  const b = GRADE_STOPS[j];
  const ra = RGB_STOPS[i].base;
  const rb = RGB_STOPS[j].base;
  out.quiet = mix(a.quiet, b.quiet, t);
  out.glowStrength = mix(a.glowStrength, b.glowStrength, t);
  out.grain = mix(a.grain, b.grain, t);
  out.baseR = mix(ra[0], rb[0], t);
  out.baseG = mix(ra[1], rb[1], t);
  out.baseB = mix(ra[2], rb[2], t);
  return out;
}

/** Just the quiet amount at a 0-1 story position. Allocation-free. */
export function quietAt(position: number): number {
  const { i, j, t } = locate(position);
  return mix(GRADE_STOPS[i].quiet, GRADE_STOPS[j].quiet, t);
}

let memoPosition = Number.NaN;
let memoGrade: Grade | null = null;

/**
 * Interpolate the grade at a 0-1 story position. Linear (not eased) between
 * stops on purpose — easing would concentrate the change into the middle of
 * each blend, which is exactly the visible "switch" this is meant to avoid.
 *
 * Memoized on the position: some callers (the starfield) ask every frame,
 * while the position only changes on scroll, so repeated calls return the
 * same object instead of rebuilding strings and arrays 60 times a second.
 * Treat the result as read-only.
 */
export function gradeAt(position: number): Grade {
  if (memoGrade && position === memoPosition) return memoGrade;

  const { i, j, t } = locate(position);
  const a = GRADE_STOPS[i];
  const b = GRADE_STOPS[j];
  const ra = RGB_STOPS[i];
  const rb = RGB_STOPS[j];

  const baseRgb: [number, number, number] = [
    mix(ra.base[0], rb.base[0], t),
    mix(ra.base[1], rb.base[1], t),
    mix(ra.base[2], rb.base[2], t),
  ];

  memoPosition = position;
  memoGrade = {
    base: rgbString(baseRgb[0], baseRgb[1], baseRgb[2]),
    glow: rgbString(
      mix(ra.glow[0], rb.glow[0], t),
      mix(ra.glow[1], rb.glow[1], t),
      mix(ra.glow[2], rb.glow[2], t)
    ),
    glowStrength: mix(a.glowStrength, b.glowStrength, t),
    quiet: mix(a.quiet, b.quiet, t),
    grain: mix(a.grain, b.grain, t),
    baseRgb,
  };
  return memoGrade;
}
