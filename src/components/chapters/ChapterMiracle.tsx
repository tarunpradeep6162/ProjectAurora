"use client";

import { useRef } from "react";
import Image from "next/image";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";

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
  useInViewReveal(root);

  return (
    <section
      ref={root}
      id="miracle"
      aria-labelledby="miracle-title"
      className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-transparent py-32"
    >
      <div data-miracle-bg className="miracle-photo absolute inset-0" aria-hidden="true">
        <Image
          src="/images/album.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[35%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/35 to-background/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="type-meta" data-reveal="fade">
          Chapter 02
        </p>
        <h2
          id="miracle-title"
          tabIndex={-1}
          className="type-chapter mt-6"
          data-reveal="mask"
        >
          <span className="reveal-line">You are my favourite miracle</span>
        </h2>
        <p className="type-emotion mx-auto mt-8 max-w-xl" data-reveal="fade">
          A cinematic beginning for the person who made ordinary days feel
          extraordinary.
        </p>
      </div>
    </section>
  );
}
