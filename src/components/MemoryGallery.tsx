"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { memories } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { useMotionEngineAlive } from "@/components/chapters/useMotionEngine";
import { focusFor, photoFraming } from "@/components/chapters/photoFraming";

/**
 * Chapter 5 — "Road of Memories". On a desktop the section pins for one
 * viewport-height per photograph; each fills the frame with its caption at
 * the bottom-left like a corner timestamp, and the next memory overtakes
 * the last with a slow horizontal drift.
 *
 * The crossfade is a `data-state` attribute with CSS transitions (never
 * inline `opacity: 0`, which MotionSafetyNet would force-reveal, stacking
 * all five photographs with the last one on top).
 *
 * On phones and other touch-first devices, with prefers-reduced-motion, or
 * whenever animation frames are
 * not verifiably being delivered, there is no pin: each photograph is its
 * own framed panel in normal scroll flow, cropped around the rider's face
 * (photoFraming.ts), with its caption fading in as it arrives.
 */
export default function MemoryGallery() {
  const root = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  // Touch-first devices of any width (a phone held landscape, a tablet).
  const coarsePointer = useCoarsePointer();
  const engineAlive = useMotionEngineAlive();
  const skipPin = reduced || narrow || coarsePointer || !engineAlive;

  useInViewReveal(root);

  useGSAP(
    () => {
      if (skipPin) return;
      const panels = gsap.utils.toArray<HTMLElement>("[data-memory-panel]");
      if (panels.length === 0) return;

      const st = ScrollTrigger.create({
        trigger: frameRef.current,
        start: "top top",
        end: `+=${panels.length * 100}%`,
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          const idx = Math.min(
            panels.length - 1,
            Math.floor(self.progress * panels.length)
          );
          panels.forEach((panel, i) => {
            const state = i === idx ? "active" : i < idx ? "past" : "future";
            if (panel.dataset.state !== state) panel.dataset.state = state;
          });
        },
      });

      ScrollTrigger.refresh();
      return () => st.kill();
    },
    { scope: root, dependencies: [skipPin], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="memories"
      aria-labelledby="memories-title"
      className="relative w-full bg-transparent"
    >
      {/* The journey's dust, arriving as light — see .memories-arrival in
          globals.css and --seam-arrival in CosmicAtmosphere.tsx. */}
      <span className="memories-arrival" aria-hidden="true" />

      <div className="relative z-10 px-[max(1.5rem,env(safe-area-inset-left))] pt-32 pb-16 text-center sm:px-6">
        <p className="type-meta" data-reveal="fade">
          Chapter 05
        </p>
        <h2 id="memories-title" className="type-chapter mt-5" data-reveal="mask">
          <span className="reveal-line">Memories suspended in time</span>
        </h2>
        <p className="type-emotion mx-auto mt-6 max-w-lg" data-reveal="fade">
          Moments drift around us like photographs that never learned how to
          fade.
        </p>
      </div>

      {/* In pinned mode all five photographs stack in the same region and
          only one is visible at a time; that layering has no reliable
          meaning for assistive tech, so the captions are also given here as
          a plain, always-present list. */}
      {!skipPin && (
        <ul className="sr-only">
          {memories.map((memory) => (
            <li key={memory.id}>
              {memory.title}, {memory.place}. {memory.caption} {memory.note}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={frameRef}
        aria-hidden={skipPin ? undefined : true}
        className={
          skipPin
            ? "memory-flow"
            : "memory-stage relative h-svh w-full overflow-hidden"
        }
      >
        {memories.map((memory, i) => (
          <figure
            key={memory.id}
            data-memory-panel
            data-state={skipPin ? undefined : i === 0 ? "active" : "future"}
            className={skipPin ? "memory-panel" : "memory-panel memory-panel--stacked"}
          >
            <div className="memory-panel__photo">
              <Image
                src={memory.src}
                alt={photoFraming[memory.id]?.alt ?? ""}
                width={memory.width}
                height={memory.height}
                sizes="100vw"
                className="h-full w-full object-cover"
                style={{ objectPosition: focusFor(memory.id) }}
              />
            </div>

            <figcaption
              className="memory-panel__caption"
              data-reveal={skipPin ? "fade" : undefined}
            >
              <p className="type-meta">
                {String(i + 1).padStart(2, "0")} / {String(memories.length).padStart(2, "0")}
                <span aria-hidden="true" className="memory-panel__sep" />
                {memory.place}
              </p>
              <h3 className="type-emotion memory-panel__title">{memory.title}</h3>
              <p className="type-story mt-2 max-w-xs">{memory.caption}</p>
              <p className="type-story memory-panel__note max-w-xs">{memory.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
