"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * Chapter 2. A quiet photograph and a single line of type, held still.
 *
 * The heading used to rise out of its mask on a GSAP ScrollTrigger tween
 * whose start state was a translate — which MotionSafetyNet (opacity only)
 * could not rescue, so wherever the frame loop stalled the heading stayed
 * hidden below its own clip. It now uses the shared, attribute-driven
 * reveal (useInViewReveal), which cannot strand text.
 *
 * This is also where "Begin the Journey" lands: ChapterPortal sets
 * `data-emerge="light"` on this section at the brightest point of its warm
 * bloom, then removes it, and the photograph's CSS transition carries it
 * from overexposed light back to its resting grade (see `.miracle-photo`).
 */
export default function ChapterMiracle() {
  const root = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const coarsePointer = useCoarsePointer();
  // Slow camera depth, not a visibly sliding photo — and off entirely for
  // touch/narrow devices and reduced motion, per the brief's mobile pass.
  const skipParallax = reduced || narrow || coarsePointer;
  useInViewReveal(root);

  // Parallax lives on its own inner layer, not `.miracle-photo` itself:
  // that element already owns a CSS-driven transform (the portal's warm
  // "emerge" bloom, `data-emerge="light"`) and a GSAP inline transform on
  // the same element would fight it. The wrapper is 24% taller than the
  // frame (12% bled past each edge) so even the full ±6% drift — which
  // moves at most ~6.7% of the frame's own height — never uncovers an
  // edge; `.miracle-photo`'s own `overflow-hidden` (via the section) clips
  // the excess.
  useGSAP(
    () => {
      if (skipParallax || !parallaxRef.current) return;
      const tween = gsap.fromTo(
        parallaxRef.current,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: root, dependencies: [skipParallax], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="miracle"
      aria-labelledby="miracle-title"
      className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-transparent py-32"
    >
      <div data-miracle-bg className="miracle-photo absolute inset-0" aria-hidden="true">
        <div ref={parallaxRef} className="absolute inset-x-0 -inset-y-[12%]">
          <Image
            src="/images/album.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[35%_30%]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/35 to-background/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="type-meta" data-reveal="fade">
          The beginning
        </p>
        {/* One line, not a heading-plus-subtitle pair — and the line that
            actually sounds like Tarun speaking, not the site describing
            itself. The subtitle's own wording ("a cinematic beginning...")
            is exactly the site-describing-itself phrasing this pass is
            removing, so it moves to sr-only instead of the heading. */}
        <h2
          id="miracle-title"
          tabIndex={-1}
          className="type-emotion mx-auto mt-6 max-w-xl"
          data-reveal="fade"
        >
          You are my favourite miracle
        </h2>
        <p className="sr-only">
          A cinematic beginning for the person who made ordinary days feel
          extraordinary.
        </p>
      </div>
    </section>
  );
}
