"use client";

import { useEffect, useRef, useState } from "react";
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
  return ANCHORS[ANCHORS.length - 1][1];
}

/** Small deterministic PRNG — stable dust between renders, no hydration risk. */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Particle = {
  x: number;
  y: number;
  /**
   * Scatter offset from the curve, in `vh`. Deliberately a viewport unit
   * rather than a percentage: it is applied through `transform`, where a
   * percentage would resolve against the 1-3px particle itself instead of
   * against the layer. Keeping it in `transform` means the convergence
   * costs no layout for any of the ~47 particles.
   */
  dy: number;
  size: number;
  opacity: number;
  warm: boolean;
  /** 0-4 for the five particles that stand in for the five real moments. */
  memory: number | null;
};

const DUST_COUNT = 42;

function buildParticles(): Particle[] {
  const rand = makeRandom(20251125);
  const out: Particle[] = [];

  for (let i = 0; i < DUST_COUNT; i++) {
    const x = rand() * 100;
    const spread = 1.5 + rand() * 11;
    const dy = (rand() < 0.5 ? -1 : 1) * spread;
    out.push({
      x,
      y: curveAt(x),
      dy,
      size: rand() < 0.82 ? 1 + rand() * 1.2 : 2 + rand() * 1.4,
      opacity: 0.16 + rand() * 0.4,
      warm: rand() < 0.45,
      memory: null,
    });
  }

  // Five slightly larger, slightly warmer points sitting exactly on the
  // curve — one per real moment in the timeline. They brighten a little as
  // the visitor passes their part of the chapter. No text is ever drawn
  // here: the moments' actual words live in the DOM, in chapter 03.
  timeline.forEach((_, i) => {
    const x = 6 + i * 22;
    out.push({
      x,
      y: curveAt(x),
      dy: 0,
      size: 2.6,
      opacity: 0.3,
      warm: true,
      memory: i,
    });
  });

  return out;
}

/**
 * Built once at module scope. The PRNG above is seeded, so this is a pure
 * constant rather than per-render randomness — no hook, and no chance of
 * the dust reshuffling itself on a re-render.
 */
const PARTICLES = buildParticles();

/**
 * The faint guide curve, sampled from `curveAt` rather than drawn as
 * straight segments between the anchors — a polyline through five points
 * would show visible kinks even at this opacity.
 */
const CURVE_D = (() => {
  const points: string[] = [];
  for (let x = 0; x <= 100; x += 2) points.push(`${x} ${curveAt(x).toFixed(2)}`);
  return `M ${points.join(" L ")}`;
})();

function smoothstep(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * The cosmic path (brief §23-25): a suggestion of forward travel through
 * the journey chapter, built from tiny particles, warm dust and one very
 * low-opacity curve. Explicitly *not* a lit road — there is no continuous
 * bright stroke, no grid, no colour outside the site's candlelight range,
 * and nothing that reads as a surface to walk on. It is meant to be noticed
 * about as much as dust in a projector beam.
 *
 * It also carries the chapter 03 -> 04 transition. `--seam-constellation`
 * peaks exactly on that boundary, and the particles' scatter is multiplied
 * by its inverse: at the seam every point sits on the line (a constellation
 * — the same aligned-points language as the Memory Constellation just
 * above), and they disperse into travelling dust as the visitor moves down
 * into the journey. The remembered moments become the road between them.
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

    const apply = () => {
      const { storyPosition, chapterId, chapterProgress } = readSceneProgress();
      const presence = smoothstep(
        1 - Math.abs(storyPosition - JOURNEY_CENTRE) / HALF
      );
      el.style.setProperty("--path-in", presence.toFixed(4));

      const p = chapterId === "journey" ? chapterProgress : storyPosition > JOURNEY_CENTRE ? 1 : 0;
      for (let i = 0; i < timeline.length; i++) {
        const centre = (i + 0.5) / timeline.length;
        const m = smoothstep(1 - Math.abs(p - centre) / 0.17);
        el.style.setProperty(`--m${i}`, m.toFixed(4));
      }
    };

    return subscribeSceneFrame(apply);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div ref={rootRef} className="cosmic-path" aria-hidden="true">
      <svg
        className="cosmic-path__curve"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={CURVE_D}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {PARTICLES.map((particle, i) => (
        <span
          key={i}
          className={
            particle.memory === null
              ? "cosmic-path__dust"
              : "cosmic-path__dust cosmic-path__dust--memory"
          }
          style={
            {
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.warm
                ? "var(--accent)"
                : "var(--foreground-muted)",
              "--dy": `${particle.dy.toFixed(2)}vh`,
              "--o": particle.opacity.toFixed(3),
              "--m":
                particle.memory === null ? "0" : `var(--m${particle.memory}, 0)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
