"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import CosmicPath from "@/components/cosmic/CosmicPath";

/**
 * Chapter 4. The path draws itself as the visitor scrolls through, over the
 * cosmic dust (CosmicPath) that already traces the same curve behind it.
 *
 * Restraint pass: the drawn stroke is a fine line now rather than a 2.5px
 * gold road — the dust layer carries the "glowing path", and two bright
 * paths on top of each other read as a diagram.
 */
export default function ChapterJourney() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useInViewReveal(root);

  useGSAP(
    () => {
      if (reduced) return;

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
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="journey"
      aria-labelledby="journey-title"
      // `overflow-x-clip` rather than `overflow-hidden`: the cosmic path
      // deliberately bleeds past this section's top and bottom edges so the
      // dust arrives before the chapter does, while horizontal overflow
      // stays clipped exactly as before.
      className="relative flex min-h-[90svh] w-full items-center justify-center overflow-x-clip bg-transparent px-[max(1.5rem,env(safe-area-inset-left))] py-32 sm:px-6"
    >
      <CosmicPath />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <p className="type-meta" data-reveal="fade">
          Chapter 04
        </p>
        <h2 id="journey-title" className="type-chapter mt-5" data-reveal="mask">
          <span className="reveal-line">The journey between us</span>
        </h2>
        <p className="type-emotion mx-auto mt-6 max-w-lg" data-reveal="fade">
          Not a straight line, but a glowing path of memories, growth and
          choosing each other.
        </p>

        <svg
          viewBox="0 0 600 160"
          className="mx-auto mt-14 w-full max-w-xl"
          aria-hidden="true"
        >
          <path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
          />
          <path
            data-path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.8"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          {[
            [10, 130],
            [180, 60],
            [300, 80],
            [430, 30],
            [590, 60],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={2.2}
              fill="var(--accent-soft)"
              opacity={0.6}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
