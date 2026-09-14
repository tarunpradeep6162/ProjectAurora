"use client";

import { useRef } from "react";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";

/**
 * Chapter 2. Held still, with nothing in front of the site's own persistent
 * galaxy — a single line of type, no photograph.
 *
 * Used to have a real photograph (`/images/album.jpg`) as this chapter's
 * background. Removed on request: the site already renders one continuous
 * WebGL galaxy fixed behind every chapter (`CosmicBackdrop`/`CosmicScene`,
 * z-index -2) — that IS "the pure galaxy 3D model," and a flat photo
 * sitting in front of it here was blocking it rather than living inside it.
 * This chapter now stays fully transparent so that backdrop shows straight
 * through, the same way every photo-less chapter on the site already does.
 *
 * The heading used to rise out of its mask on a GSAP ScrollTrigger tween
 * whose start state was a translate — which MotionSafetyNet (opacity only)
 * could not rescue, so wherever the frame loop stalled the heading stayed
 * hidden below its own clip. It now uses the shared, attribute-driven
 * reveal (useInViewReveal), which cannot strand text.
 *
 * This is also where "Begin the Journey" lands: ChapterPortal sets
 * `data-emerge="light"` on this section at the brightest point of its warm
 * bloom, then removes it, and `.miracle-glow`'s CSS transition carries that
 * bloom back down to its resting, barely-there state (see globals.css) —
 * the same transition the photograph used to carry, now driven by a plain
 * radial gradient instead of an image, so the galaxy behind it is never
 * occluded even mid-transition.
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
      <div data-miracle-bg className="miracle-glow absolute inset-0" aria-hidden="true" />

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
