"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { memories } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { focusFor } from "@/components/chapters/photoFraming";
import CosmicPath from "@/components/cosmic/CosmicPath";

/**
 * Three of the real photographs, appearing as faint ghosts along the road —
 * the same restrained device the finale later reprises for its own ghosts
 * (memory-1 and memory-5 appear in both, an intentional, subtle echo: the
 * same light that passed by here is what she gets back at the end).
 * Decorative duplicates of images shown properly, with their captions, in
 * chapter 05 — carry empty alt text for that reason. memory-2 is skipped
 * here on purpose: its frame has baked-in text ("Travel With Your Soul")
 * that reads as noise at low opacity.
 */
const GHOST_IDS = ["memory-4", "memory-1", "memory-5"];
const ghosts = GHOST_IDS.map((id) => memories.find((m) => m.id === id)).filter(
  (m): m is (typeof memories)[number] => Boolean(m)
);

/**
 * Chapter 4. The path draws itself as the visitor scrolls through, over the
 * cosmic dust (CosmicPath) that already traces the same curve behind it, and
 * a handful of real photographs pass by as ghosts, staggered across the same
 * scroll range — the road visibly carrying memories rather than an empty
 * line, without turning into a second photo gallery (that stays chapter 05's
 * job). They fade out before the path finishes drawing, so what's left by
 * the end is only points of light — the same points the constellation picks
 * up next.
 *
 * Restraint pass: the drawn stroke is a fine line now rather than a 2.5px
 * gold road — the dust layer carries the "glowing path", and two bright
 * paths on top of each other read as a diagram.
 */
export default function ChapterJourney() {
  const root = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useInViewReveal(root);
  // The live site's own subtle mouse drift on chapter copy — recovered
  // exact strength/damping (see usePointerParallax.ts). Ghosts deliberately
  // do not get their own parallax layer — one more drifting layer here would
  // read as busier, not more cinematic.
  usePointerParallax(copyRef);

  useGSAP(
    () => {
      if (reduced) return;

      // One timeline, one ScrollTrigger, spanning the whole chapter — the
      // drawn path and the ghost photographs both live on it so they can
      // never drift out of agreement with each other, and so this stays one
      // scrubbed trigger for the section rather than several redundant ones
      // covering the identical range.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
          end: "bottom 40%",
          scrub: 1,
        },
      });

      const path = root.current?.querySelector<SVGPathElement>("[data-path]");
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      }

      // Each ghost gets a narrow window of its own on the same 0-1 timeline
      // — arrive, hold briefly, fade — staggered so only one is ever
      // prominent, and all three are gone well before the path finishes (the
      // "photos fade but points remain" beat, handing off to the
      // constellation next).
      const ghostEls = gsap.utils.toArray<HTMLElement>("[data-journey-ghost]");
      ghostEls.forEach((el, i) => {
        const start = 0.08 + i * 0.24;
        gsap.set(el, { opacity: 0, scale: 1.04 });
        tl.to(el, { opacity: 0.14, scale: 1, ease: "sine.out", duration: 0.18 }, start)
          .to(el, { opacity: 0.14, duration: 0.1 }, start + 0.18)
          .to(el, { opacity: 0, scale: 0.98, ease: "sine.in", duration: 0.16 }, start + 0.28);
      });
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

      <div aria-hidden="true" className="journey-ghosts">
        {ghosts.map((memory, i) => (
          <div
            key={memory.id}
            data-journey-ghost
            data-motion-exempt
            className="journey-ghost"
            style={{ "--i": i } as React.CSSProperties}
          >
            <Image
              src={memory.src}
              alt=""
              fill
              sizes="40vw"
              className="journey-ghost__img"
              style={{ objectPosition: focusFor(memory.id) }}
            />
          </div>
        ))}
      </div>

      <div ref={copyRef} className="relative z-10 mx-auto w-full max-w-2xl text-center">
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
