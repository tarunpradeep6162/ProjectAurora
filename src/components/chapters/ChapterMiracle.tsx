"use client";

import { useRef } from "react";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";

/**
 * Chapter 2. Held still, over a dense, vivid nebula — no photograph.
 *
 * Used to have a real photograph (`/images/album.jpg`) as this chapter's
 * background, then a CSS gradient standing in for a nebula. Checked that
 * CSS version live against a specific reference photo (saturated
 * teal/cyan and magenta cloud, real stars scattered through it) and found
 * it flat and starless — a mostly-opaque gradient div necessarily either
 * shows nothing behind it or occludes the persistent starfield the same
 * way the old photo did. Replaced with real WebGL: `MiracleNebula.tsx`,
 * mounted in the persistent world (CosmicScene.tsx) alongside the site's
 * shared, deliberately-restrained galaxy shader, fading in only while this
 * chapter owns the viewport. This section stays fully transparent so that
 * shows straight through, the same as every other photo-less chapter.
 *
 * "11:11" is real, not decorative — confirmed with Tarun directly rather
 * than assumed, per this project's standing rule to never invent
 * relationship content.
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
 * bloom back down to its resting, barely-there state (see globals.css).
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
        <p className="type-numeral mt-4" data-reveal="fade">
          11<span className="type-numeral-colon">:</span>11
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
