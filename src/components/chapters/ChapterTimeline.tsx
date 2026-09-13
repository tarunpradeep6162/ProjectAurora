"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { timeline } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNarrowViewport } from "@/hooks/useMediaQuery";

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
 * Chapter 3 — pinned, scroll-driven storytelling sequence. The section is
 * pinned for the length of five viewport-heights of scroll; as the user
 * scrolls, GSAP crossfades between the five timeline entries. This is the
 * brief's required "pinned/scroll-driven storytelling sequence".
 *
 * Layered on top: the "Memory Constellation" — as the user scrolls through,
 * the five points gradually connect with thin lines, echoing the timeline
 * without ever forming a literal shape.
 *
 * With prefers-reduced-motion OR a narrow (phone) viewport, pinning and
 * scrubbing are disabled entirely and every entry is instead laid out as a
 * normal, statically readable list — pinned scrub sequences are the one
 * effect most prone to fighting touch scroll, so mobile gets the calmer,
 * always-legible fallback rather than a half-working pin.
 */
export default function ChapterTimeline() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const skipPin = reduced || narrow;

  useGSAP(
    () => {
      if (skipPin) return;

      const entries = gsap.utils.toArray<HTMLElement>("[data-timeline-entry]");
      if (entries.length === 0) return;

      gsap.set(entries, { opacity: 0, y: 40 });
      gsap.set(entries[0], { opacity: 1, y: 0 });

      const segments = gsap.utils.toArray<SVGLineElement>(
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
            gsap.to(el, {
              opacity: i === idx ? 1 : 0,
              y: i === idx ? 0 : i < idx ? -30 : 40,
              duration: 0.4,
              overwrite: "auto",
            });
          });
          // Constellation: each point doubles as the caption progress dot
          // (brief calls for the timeline dates/points themselves to
          // connect). Reveal point i and the segment leading to it in step
          // with overall scroll progress, not just the active caption, so
          // the line keeps gently building even while a caption holds.
          const raw = self.progress * (entries.length - 1);
          points.forEach((p, i) => {
            const reached = raw >= i - 0.05;
            p.classList.toggle("fill-accent", reached || i === idx);
            p.classList.toggle("fill-foreground-muted/30", !(reached || i === idx));
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

      return () => st.kill();
    },
    { scope: root, dependencies: [skipPin] }
  );

  return (
    <section
      ref={root}
      id="story"
      aria-label="Chapter 3: Our story became a world"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(217,167,92,0.1),transparent_65%)]"
      />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <span className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 03
        </span>
        <h2 className="font-display text-[clamp(1.8rem,5vw,3.2rem)] leading-tight text-foreground">
          Our story became a world
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-foreground-muted">
          Every conversation, every smile and every small moment left a light
          behind.
        </p>

        <div
          className={
            skipPin
              ? "mt-16 flex flex-col gap-10 text-left"
              : "relative mt-16 flex h-[220px] items-center justify-center"
          }
        >
          {timeline.map((entry) => (
            <div
              key={entry.number}
              data-timeline-entry={skipPin ? undefined : ""}
              className={
                skipPin
                  ? "border-l border-line pl-6"
                  : "absolute inset-0 flex flex-col items-center justify-center"
              }
            >
              <span className="text-[11px] tracking-[0.3em] text-accent-soft">
                {entry.number}
              </span>
              <h3 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
                {entry.title}
              </h3>
              <p className="mt-2 max-w-md text-balance italic text-foreground-muted">
                {entry.line}
              </p>
            </div>
          ))}
        </div>

        {/* Memory Constellation — the five moments gradually connect as the
            chapter scrolls. Purely decorative/atmospheric (aria-hidden); the
            same five moments are already conveyed in real text above and in
            the ChapterNav accessibility panel, so this never gates content. */}
        <div className="mx-auto mt-8 w-full max-w-md" aria-hidden="true">
          <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible">
            {!skipPin &&
              CONSTELLATION_POINTS.slice(0, -1).map(([x1, y1], i) => {
                const [x2, y2] = CONSTELLATION_POINTS[i + 1];
                return (
                  <line
                    key={i}
                    data-constellation-segment
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="var(--accent-soft)"
                    strokeWidth="0.5"
                    opacity="0.6"
                  />
                );
              })}
            {CONSTELLATION_POINTS.map(([x, y], i) => (
              <circle
                key={i}
                data-constellation-point
                cx={x}
                cy={y}
                r={skipPin ? 1.6 : 1.4}
                className="fill-foreground-muted/30 transition-colors duration-300"
                style={
                  skipPin
                    ? { fill: "var(--accent-soft)", opacity: 1 - i * 0.12 }
                    : undefined
                }
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
