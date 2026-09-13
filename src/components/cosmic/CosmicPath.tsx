"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { readSceneProgress, subscribeSceneFrame } from "./sceneProgress";
import { timeline } from "@/lib/content";

/**
 * Anchor points of the journey chapter's drawn path, in percentages of this
 * layer's box — the same loose S-curve the chapter's own SVG traces, so the
 * dust reads as belonging to it rather than as a second, unrelated shape.
 */
const ANCHORS: [number, number][] = [
  [2, 78],
  [30, 42],
  [50, 55],
  [72, 30],
  [98, 46],
];

function curveAt(x: number): number {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [x1, y1] = ANCHORS[i];
    const [x2, y2] = ANCHORS[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      // Smoothstep between anchors so the band curves rather than kinks.
      const s = t * t * (3 - 2 * t);
      return y1 + (y2 - y1) * s;
    }
  }
  return x < ANCHORS[0][0] ? ANCHORS[0][1] : ANCHORS[ANCHORS.length - 1][1];
}

/** Small deterministic PRNG — stable dust between renders, no hydration risk. */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Mote = {
  x: number;
  y: number;
  /**
   * Scatter offset from the curve, in `vh`. Deliberately a viewport unit
   * rather than a percentage: it is applied through `transform`, where a
   * percentage would resolve against the 1-3px mote itself instead of
   * against the layer. Keeping it in `transform` means the convergence
   * costs no layout.
   */
  dy: number;
  size: number;
  opacity: number;
  warm: boolean;
  kind: "memory" | "wake" | "ambient";
  /** Which of the five real moments this mote belongs to (memory + wake). */
  memory: number | null;
};

/** Motes trailing behind each remembered moment. */
const WAKE_PER_MEMORY = 4;
/** Loose, faint dust around the whole band. */
const AMBIENT_COUNT = 9;

function buildMotes(): Mote[] {
  const rand = makeRandom(20251125);
  const out: Mote[] = [];

  timeline.forEach((_, i) => {
    const x = 6 + i * 22;

    // The moment itself: slightly larger and warmer, sitting exactly on the
    // curve, brightening as the visitor passes its part of the chapter. No
    // text is ever drawn here — the words live in the DOM, in chapter 03.
    out.push({ x, y: curveAt(x), dy: 0, size: 2.6, opacity: 0.3, warm: true, kind: "memory", memory: i });

    // Its wake: a short trail of warm motes left *behind* it along the
    // direction of travel (left, the past), each smaller, fainter and more
    // dispersed than the last — a memory leaving light behind as it moves,
    // not a line joining one point to the next.
    for (let k = 1; k <= WAKE_PER_MEMORY; k++) {
      const wx = x - k * 3.1 - rand() * 1.3;
      if (wx < 0.5) continue;
      const spread = 0.35 + k * 0.75;
      out.push({
        x: wx,
        y: curveAt(wx),
        dy: (rand() < 0.5 ? -1 : 1) * spread * (0.4 + rand() * 0.6),
        size: Math.max(0.9, 2.1 - k * 0.32),
        opacity: Math.max(0.1, 0.44 - k * 0.08),
        warm: rand() < 0.85,
        kind: "wake",
        memory: i,
      });
    }
  });

  for (let n = 0; n < AMBIENT_COUNT; n++) {
    const x = 3 + rand() * 94;
    const spread = 4 + rand() * 10;
    out.push({
      x,
      y: curveAt(x),
      dy: (rand() < 0.5 ? -1 : 1) * spread,
      size: 0.8 + rand() * 0.8,
      opacity: 0.1 + rand() * 0.18,
      warm: rand() < 0.3,
      kind: "ambient",
      memory: null,
    });
  }

  return out;
}

/**
 * Built once at module scope. The PRNG above is seeded, so this is a pure
 * constant rather than per-render randomness — no hook, and no chance of
 * the dust reshuffling itself on a re-render.
 */
const MOTES = buildMotes();

function smoothstep(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

function moteStyle(mote: Mote): CSSProperties {
  const style: Record<string, string> = {
    left: `${mote.x}%`,
    top: `${mote.y}%`,
    width: `${mote.size}px`,
    height: `${mote.size}px`,
    background: mote.warm ? "var(--accent)" : "var(--foreground-muted)",
    "--dy": `${mote.dy.toFixed(2)}vh`,
    "--o": mote.opacity.toFixed(3),
  };
  if (mote.kind === "memory") {
    style["--m"] = `var(--m${mote.memory}, 0)`;
  } else if (mote.kind === "wake") {
    // Faint until its moment has been passed, then it holds as a trail.
    style.opacity = `calc(var(--o) * (0.22 + 0.78 * var(--r${mote.memory}, 0)))`;
  }
  return style as CSSProperties;
}

/**
 * The cosmic path (brief §23-25): memories leaving a trail through space.
 * Five warm points — one per real moment — each trailing a short wake of
 * fading motes behind it, plus a little loose dust. Sparse and warm, and
 * explicitly *not* a road: no continuous stroke (an earlier faint guide line
 * was removed because any unbroken line reads as a path to walk along), no
 * grid, no colour outside the site's candlelight range. It is meant to be
 * noticed about as much as dust in a projector beam.
 *
 * Scroll drives three things: the layer's presence around chapter 04; each
 * moment brightening as the visitor reaches it (`--m{i}`); and each wake
 * filling in once that moment has been passed (`--r{i}`), so the trail
 * behind the visitor is always more complete than the way ahead.
 *
 * It also carries the chapter 03 -> 04 transition. `--seam-constellation`
 * peaks exactly on that boundary, and the motes' scatter is multiplied by
 * its inverse: at the seam every point sits on the line (a constellation —
 * the same aligned-points language as the Memory Constellation just above),
 * and they disperse into travelling dust as the visitor moves down into the
 * journey.
 *
 * Brightness also follows the shared `--grade-quiet` (grade.ts), like every
 * other cosmic layer.
 *
 * Driven entirely by CSS custom properties written from the shared scroll
 * store — no rAF, no IntersectionObserver, no ResizeObserver — so it cannot
 * be left blank or frozen by an environment where those never fire.
 */
export default function CosmicPath() {
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Rendered only after mount, matching the site's existing Starfield
    // approach: nothing randomized (even deterministically) needs to be in
    // the server payload for a purely atmospheric layer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Depends on `mounted`: this component renders `null` on its first
    // pass, so without that dependency the effect would run once against a
    // still-null ref, bail out, and never subscribe at all — leaving the
    // dust permanently at zero opacity.
    const el = rootRef.current;
    if (!mounted || !el) return;

    const JOURNEY_CENTRE = 3 / 7; // chapter 04 of 8, in storyPosition terms
    const HALF = 1.7 / 7;
    const count = timeline.length;
    // Last written values, so an unchanged property is never rewritten
    // (every write invalidates style for all the motes underneath).
    const last = new Map<string, string>();
    const write = (name: string, value: number) => {
      const text = value.toFixed(3);
      if (last.get(name) === text) return;
      last.set(name, text);
      el.style.setProperty(name, text);
    };

    const apply = () => {
      const { storyPosition, chapterId, chapterProgress } = readSceneProgress();
      write(
        "--path-in",
        smoothstep(1 - Math.abs(storyPosition - JOURNEY_CENTRE) / HALF)
      );

      const p =
        chapterId === "journey" ? chapterProgress : storyPosition > JOURNEY_CENTRE ? 1 : 0;
      for (let i = 0; i < count; i++) {
        const centre = (i + 0.5) / count;
        write(`--m${i}`, smoothstep(1 - Math.abs(p - centre) / 0.17));
        write(`--r${i}`, smoothstep((p - centre + 0.06) / 0.16));
      }
    };

    return subscribeSceneFrame(apply);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      className="cosmic-path"
      aria-hidden="true"
      style={{ opacity: "calc(var(--path-in, 0) * (1 - var(--grade-quiet, 0) * 0.6))" }}
    >
      {MOTES.map((mote, i) => (
        <span
          key={i}
          className={
            mote.kind === "memory"
              ? "cosmic-path__dust cosmic-path__dust--memory"
              : "cosmic-path__dust"
          }
          style={moteStyle(mote)}
        />
      ))}
    </div>
  );
}
