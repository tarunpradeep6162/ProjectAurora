"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { timeline } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { useMotionEngineAlive } from "@/components/chapters/useMotionEngine";
import { requestSceneRemeasure } from "@/components/cosmic/sceneProgress";

// Coordinates within a 0-100 x, 0-40 y viewBox — a slim horizontal strip so
// the constellation reads as a quiet underline to the timeline, not a
// separate illustration competing for attention. Deliberately irregular —
// never a literal shape (no heart, no arrow).
const CONSTELLATION_POINTS: [number, number][] = [
  [4, 28],
  [26, 8],
  [50, 32],
  [74, 6],
  [96, 22],
];

/**
 * A quadratic-bezier control point per segment, bowing gently above/below
 * the straight line between its two points — an orbit drifting through the
 * five moments rather than a ruled connect-the-dots path. Offsets are
 * modest (the viewBox is only 40 units tall) and alternate direction so the
 * whole path reads as one continuous, gently wandering arc.
 */
const CONSTELLATION_CONTROLS: [number, number][] = [
  [15, 10],
  [38, 28],
  [62, 10],
  [85, 22],
];

/**
 * Chapter 3 — pinned, scroll-driven storytelling sequence. The section pins
 * for five viewport-heights of scroll and crossfades between the five
 * timeline entries, while the "Memory Constellation" underneath gradually
 * connects.
 *
 * The crossfade is driven by a `data-state` attribute (active / past /
 * future) with CSS transitions, not by inline `opacity: 0`. Previously
 * MotionSafetyNet force-revealed the four waiting entries 3.5s after load,
 * so all five sat on top of each other until the pin engaged.
 *
 * Pinning is skipped — every entry laid out as a plain, readable list — on
 * prefers-reduced-motion, on phones and other touch-first devices (pins
 * fight touch scrolling), and
 * whenever animation frames are not verifiably being delivered, since a
 * stalled ScrollTrigger would otherwise leave four of the five moments
 * unreachable.
 */
export default function ChapterTimeline() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  // Touch-first devices of any width (a phone held landscape, a tablet):
  // a pinned scrub fights momentum scrolling there.
  const coarsePointer = useCoarsePointer();
  const engineAlive = useMotionEngineAlive();
  const skipPin = reduced || narrow || coarsePointer || !engineAlive;

  useInViewReveal(root);

  useGSAP(
    () => {
      if (skipPin) return;

      const entries = gsap.utils.toArray<HTMLElement>("[data-timeline-entry]");
      if (entries.length === 0) return;

      const segments = gsap.utils.toArray<SVGPathElement>(
        "[data-constellation-segment]"
      );
      const points = gsap.utils.toArray<SVGCircleElement>(
        "[data-constellation-point]"
      );
      segments.forEach((seg) => {
        const length = seg.getTotalLength();
        gsap.set(seg, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(points, { opacity: 0.25, scale: 0.8, transformOrigin: "center" });
      if (points[0]) gsap.set(points[0], { opacity: 1, scale: 1 });

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${entries.length * 100}%`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(
            entries.length - 1,
            Math.floor(self.progress * entries.length)
          );
          entries.forEach((el, i) => {
            const state = i === idx ? "active" : i < idx ? "past" : "future";
            if (el.dataset.state !== state) el.dataset.state = state;
          });
          // Constellation: each point doubles as the caption progress dot.
          // Reveal point i and the segment leading to it in step with
          // overall scroll progress, so the line keeps gently building even
          // while a caption holds.
          const raw = self.progress * (entries.length - 1);
          points.forEach((p, i) => {
            const reached = raw >= i - 0.05;
            gsap.to(p, {
              opacity: reached ? 1 : 0.35,
              scale: i === idx ? 1.3 : reached ? 1 : 0.8,
              duration: 0.4,
              overwrite: "auto",
            });
          });
          segments.forEach((seg, i) => {
            const segProgress = gsap.utils.clamp(0, 1, raw - i);
            const length = seg.getTotalLength();
            gsap.to(seg, {
              strokeDashoffset: length * (1 - segProgress),
              duration: 0.4,
              overwrite: "auto",
            });
          });
        },
      });

      // The layout above this chapter just changed from list to stage;
      // every later trigger's start/end must be measured against that.
      ScrollTrigger.refresh();
      // GSAP's own refresh above only recalculates *GSAP's* triggers.
      // sceneProgress.ts keeps its own, independent bounds cache (chapter
      // index, camera arc position, everything staged off "journey" being
      // active) and was never told this 500vh pin-spacer just appeared —
      // discovered by scrolling normally and finding the chapter indicator
      // two whole chapters ahead of what was actually on screen, the same
      // stale-bounds failure mode already fixed once for the candle/wish
      // sequence. Same fix here: a frame late so the pin-spacer's own final
      // height has definitely committed before it's measured.
      requestAnimationFrame(requestSceneRemeasure);

      return () => st.kill();
    },
    { scope: root, dependencies: [skipPin], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="story"
      aria-labelledby="story-title"
      className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-transparent px-[max(1.5rem,env(safe-area-inset-left))] py-32 sm:px-6"
    >
      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* "Our story became a world" carries the section for screen readers
            and the document outline; visually this chapter opens on the one
            line that actually sounds spoken, not a heading-plus-subtitle
            pair — the individual moments below already do the rest of the
            storytelling one at a time. */}
        <h2 id="story-title" className="sr-only">
          Our story became a world
        </h2>
        <p className="type-meta" data-reveal="fade">
          Our story
        </p>
        <p className="type-emotion mx-auto mt-6 max-w-lg" data-reveal="fade">
          Every conversation, every smile and every small moment left a light
          behind.
        </p>

        <ol
          className={
            skipPin
              ? "mt-20 flex flex-col gap-14 text-left"
              : "timeline-stage relative mt-16 h-[240px]"
          }
        >
          {timeline.map((entry, i) => (
            <li
              key={entry.number}
              data-timeline-entry={skipPin ? undefined : ""}
              data-state={skipPin ? undefined : i === 0 ? "active" : "future"}
              data-reveal={skipPin ? "fade" : undefined}
              className={
                skipPin
                  ? "flex flex-col items-center text-center"
                  : "absolute inset-0 flex flex-col items-center justify-center"
              }
            >
              {/* Each moment keeps its own heading for the document
                  outline/screen readers; visually the number+title collapse
                  into one small line so the feeling below it, not the
                  label, carries the weight. */}
              <h3 className="sr-only">
                {entry.number} — {entry.title}
              </h3>
              <p aria-hidden="true" className="type-meta">
                {entry.number} — {entry.title}
              </p>
              <p className="type-chapter timeline-entry-title mt-3 max-w-md">
                {entry.line}
              </p>
            </li>
          ))}
        </ol>

        {/* Memory Constellation — purely decorative (aria-hidden, exempt from
            the motion safety net); the same five moments are real text
            above. An orbit, not a ruled line: each segment is a gentle
            bezier arc (CONSTELLATION_CONTROLS), so the path drifts the way
            a real constellation's sightline does rather than connecting
            dots mechanically. Points carry a slow, staggered twinkle
            (off under reduced motion) so the whole thing reads as
            discovered starlight, not an illustrated diagram. */}
        <div className="mx-auto mt-10 w-full max-w-md" aria-hidden="true">
          <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible">
            {!skipPin &&
              CONSTELLATION_POINTS.slice(0, -1).map(([x1, y1], i) => {
                const [x2, y2] = CONSTELLATION_POINTS[i + 1];
                const [cx, cy] = CONSTELLATION_CONTROLS[i];
                return (
                  <path
                    key={i}
                    data-constellation-segment
                    d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--accent-soft)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                );
              })}
            {CONSTELLATION_POINTS.map(([x, y], i) => (
              <circle
                key={i}
                data-constellation-point
                data-motion-exempt
                className="constellation-point"
                cx={x}
                cy={y}
                r={skipPin ? 1.4 : 1.2}
                style={
                  {
                    fill: "var(--accent-soft)",
                    opacity: skipPin ? 0.85 - i * 0.12 : undefined,
                    "--twinkle-delay": `${i * 0.6}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
