"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { memories } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * Chapter 5 — "Road of Memories". The brief's required pinned scrollytelling
 * sequence through the real travel/motorcycle photos: the section pins for
 * one viewport-height per photo, each photograph fills the frame, a small
 * caption sits near the bottom-left edge (not centered — it should read like
 * a corner timestamp, not a slide title), and the next memory slides over
 * the previous one with a slight horizontal drift suggesting forward travel.
 * The effect is deliberately subtle: a slow drift, not a swipe.
 *
 * On prefers-reduced-motion OR a narrow (phone) viewport, pinning is
 * disabled and every photo instead lays out as a normal full-height panel
 * in the regular scroll flow — pinned+scrubbed sequences are the ones most
 * prone to fighting touch scroll, so mobile gets the calmer fallback rather
 * than a half-working pin.
 */
export default function MemoryGallery() {
  const root = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const skipPin = reduced || narrow;
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-memory-panel]");
      if (panels.length === 0) return;

      if (skipPin) {
        // Normal-flow fallback: gentle per-panel reveal only, no pinning.
        panels.forEach((panel) => {
          const img = panel.querySelector("[data-memory-img]");
          const caption = panel.querySelector("[data-memory-caption]");
          gsap.fromTo(
            img,
            { scale: 1.1 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
          gsap.fromTo(
            caption,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: panel, start: "top 65%" },
            }
          );
          ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) setActive(panels.indexOf(panel));
            },
          });
        });
        return;
      }

      // Pinned "Road of Memories": every panel is stacked in the same
      // frame; scroll progress crossfades + drifts between them so the
      // next photograph overtakes the last, with motion reading as
      // forward travel (a slow horizontal drift), not a slide-transition.
      gsap.set(panels, { opacity: 0, xPercent: 0, scale: 1.06 });
      gsap.set(panels[0], { opacity: 1, scale: 1 });

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
          setActive(idx);
          panels.forEach((panel, i) => {
            const isActive = i === idx;
            const isPast = i < idx;
            gsap.to(panel, {
              opacity: isActive ? 1 : 0,
              xPercent: isActive ? 0 : isPast ? -6 : 6,
              scale: isActive ? 1 : 1.06,
              duration: 0.6,
              ease: "power2.out",
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
      id="memories"
      aria-label="Chapter 5: Memories suspended in time — the road of memories"
      className="relative w-full bg-transparent"
    >
      <div className="relative z-10 px-6 pt-32 pb-16 text-center">
        <span className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 05
        </span>
        <h2 className="font-display text-[clamp(1.8rem,5vw,3.2rem)] leading-tight text-foreground">
          Memories suspended in time
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-foreground-muted">
          Moments drift around us like photographs that never learned how to
          fade.
        </p>
      </div>

      {/* In pinned mode all five photographs stack in the same DOM region
          and only one is visually active at a time; that layering has no
          reliable meaning for assistive tech, so the same five captions are
          also given here as a plain, always-present list. */}
      {!skipPin && (
        <ul className="sr-only">
          {memories.map((memory) => (
            <li key={memory.id}>
              {memory.title} — {memory.caption}
            </li>
          ))}
        </ul>
      )}

      <div
        ref={frameRef}
        data-memory-frame
        aria-hidden={!skipPin}
        className={
          skipPin
            ? "flex flex-col"
            : "relative h-screen w-full overflow-hidden"
        }
      >
        {memories.map((memory, i) => (
          <div
            key={memory.id}
            data-memory-panel
            className={
              skipPin
                ? "relative flex h-screen w-full items-end justify-start overflow-hidden"
                : "absolute inset-0 flex items-end justify-start overflow-hidden"
            }
          >
            <div
              data-memory-img
              className="absolute inset-0"
              style={{ willChange: "transform" }}
            >
              <Image
                src={memory.src}
                alt={`${memory.title} ${memory.caption}`}
                width={memory.width}
                height={memory.height}
                sizes="100vw"
                priority={i === 0}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-deep via-background-deep/10 to-transparent" />
            </div>

            {/* Caption near the bottom-left edge, like a corner timestamp —
                deliberately not centered, so the photograph itself stays
                the subject of the frame. */}
            <div
              data-memory-caption
              className="relative z-10 max-w-sm px-6 pb-14 sm:px-10 sm:pb-16 text-left"
            >
              <span className="text-[11px] tracking-[0.3em] uppercase text-accent-soft">
                {String(i + 1).padStart(2, "0")} / {memories.length}
              </span>
              <h3 className="mt-3 font-display text-2xl italic text-foreground sm:text-3xl">
                {memory.title}
              </h3>
              <p className="mt-2 max-w-xs text-balance text-sm text-foreground-muted sm:text-base">
                {memory.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="relative z-20 flex justify-center gap-2 py-6"
        aria-hidden="true"
      >
        {memories.map((m, i) => (
          <span
            key={m.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-accent" : "w-1.5 bg-foreground-muted/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
