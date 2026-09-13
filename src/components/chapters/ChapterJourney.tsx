"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import CosmicPath from "@/components/cosmic/CosmicPath";

export default function ChapterJourney() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) {
        gsap.set("[data-path]", { strokeDashoffset: 0 });
        return;
      }

      const path = root.current?.querySelector<SVGPathElement>("[data-path]");
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            end: "bottom 40%",
            scrub: 1,
          },
        });
      }
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <section
      ref={root}
      id="journey"
      aria-label="Chapter 4: The journey between us"
      // `overflow-x-clip` rather than `overflow-hidden`: the cosmic path
      // deliberately bleeds past this section's top and bottom edges so the
      // dust arrives before the chapter does, while horizontal overflow
      // stays clipped exactly as before.
      className="relative flex min-h-[90vh] w-full items-center justify-center overflow-x-clip bg-transparent px-6 py-32"
    >
      <CosmicPath />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <span className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 04
        </span>
        <h2 className="font-display text-[clamp(1.8rem,5vw,3.2rem)] leading-tight text-foreground">
          The journey between us
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-foreground-muted">
          Not a straight line, but a glowing path of memories, growth and
          choosing each other.
        </p>

        <svg
          viewBox="0 0 600 160"
          className="mx-auto mt-12 w-full max-w-xl"
          aria-hidden="true"
        >
          <path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--line)"
            strokeWidth="1.5"
          />
          <path
            data-path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[
            [10, 130],
            [180, 60],
            [300, 80],
            [430, 30],
            [590, 60],
          ].map(([cx, cy], i) => (
            // Small and semi-transparent. At r=5 and full opacity these read
            // as UI bullets pinned to a diagram; the chapter wants a path
            // with a few waypoints on it, not a chart.
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={2.6}
              fill="var(--accent-soft)"
              opacity={0.65}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
