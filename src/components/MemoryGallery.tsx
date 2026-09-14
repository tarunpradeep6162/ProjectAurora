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
 * Chapter 5 — five real photographs, each its own shot rather than five
 * identical panels. Previously this pinned the section and cross-faded five
 * stacked, identically-framed panels; that assumed every photo was the same
 * shape filling the same frame, which fought giving each memory its own
 * composition. Dropped in favour of normal scroll flow — every memory reads
 * in document order, at its own size, with its own kind of stillness or
 * motion, chosen from what the photo and its words actually are:
 *
 *   01  The Blue Himalayan          — establishing: wide, quiet recall-in
 *   02  Travel With Your Soul       — a small frame adrift in dark space
 *   03  Cold Morning, Warm Coffee   — intimate portrait, a focus pull
 *   04  Somewhere We Got Lost       — the one moment allowed to fill the
 *                                     screen (the chapter's single signature
 *                                     expansion — see HeroMemory)
 *   05  The One I Would Keep        — small and still again on purpose: its
 *                                     own words call it the one she'd keep,
 *                                     and it hands the chapter to the Letter
 *
 * None of that is arbitrary — it follows the photos' own aspect ratios and
 * what each caption already says (see the JOURNEY CINEMATOGRAPHY / MEMORIES
 * commit history for the full reasoning). No image, caption, date or order
 * was invented or changed; `content.ts` and `photoFraming.ts` are untouched.
 *
 * Chapter-wide cosmic dimming (dimmer stars, quieter glow) and the warm
 * hand-off from Chapter 04 (`.memories-arrival`, `--seam-arrival`) already
 * existed before this pass and are unchanged.
 */
export default function MemoryGallery() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const coarsePointer = useCoarsePointer();
  const engineAlive = useMotionEngineAlive();
  // The one pinned, expanding shot (Memory 04) needs real, verified frames
  // and a fine pointer to ever feel like a "premium expansion" rather than a
  // jump; anywhere that isn't true it simply renders large and static.
  const heroCapable = !reduced && !narrow && !coarsePointer && engineAlive;

  useInViewReveal(root);

  const [m1, m2, m3, m4, m5] = memories;

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

      {/* The heading stays for screen readers/document structure; visually
          each photograph below now speaks for itself — image first, one
          line second, per photo, rather than a gallery intro up top. */}
      <h2 id="memories-title" className="sr-only">
        Memories suspended in time
      </h2>
      <p className="sr-only">
        Moments drift around us like photographs that never learned how to
        fade.
      </p>

      <div className="memory-sequence">
        <EstablishingMemory memory={m1} reduced={reduced} />
        <QuietMemory memory={m2} align="end" />
        <IntimateMemory memory={m3} reduced={reduced} />
        <HeroMemory memory={m4} capable={heroCapable} />
        <QuietMemory memory={m5} align="center" resolution />
      </div>
    </section>
  );
}

type Memory = (typeof memories)[number];

// No `01 / 05` counter — these read in normal scroll order, not as a
// slideshow, so a position counter has nothing to orient against; the
// place name alone is the small line, matching the brief's exact
// small/large structure (small: place, large: caption).
function MemoryMeta({ memory }: { memory: Memory }) {
  return <p className="type-meta memory-meta">{memory.place}</p>;
}

/**
 * Memory 01 — establishing. Wide, centred, a great deal of quiet air above
 * and below it. Arrives with the "remembering" treatment the brief asks
 * for: a little soft, a little close, a little dim, resolving to sharp,
 * true size and normal exposure — like a memory coming into focus rather
 * than a slide simply fading in. One-shot (`toggleActions`), never a scrub:
 * it plays once as the visitor arrives and never seesaws if they scroll
 * back over it.
 */
function EstablishingMemory({
  memory,
  reduced,
}: {
  memory: Memory;
  reduced: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced || !frameRef.current) return;
      const tween = gsap.fromTo(
        frameRef.current,
        { opacity: 0, scale: 1.025, filter: "blur(8px) brightness(0.82)" },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: frameRef.current,
            start: "top 82%",
            end: "top 45%",
            toggleActions: "play none none reverse",
          },
        }
      );
      // A stalled frame loop must not leave the very first photograph stuck
      // at opacity 0 — MotionSafetyNet would eventually force it visible,
      // but a photograph should never wait 3.5s for a global sweep when a
      // few extra lines here can just finish its own reveal on time.
      const failsafe = window.setTimeout(() => {
        if (tween.progress() < 1) tween.progress(1);
      }, 3200);
      return () => {
        window.clearTimeout(failsafe);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <figure className="memory-shot memory-shot--establishing">
      <div
        ref={frameRef}
        className="memory-shot__frame memory-shot__frame--wide"
        style={reduced ? undefined : { opacity: 0 }}
      >
        <Image
          src={memory.src}
          alt={photoFraming[memory.id]?.alt ?? ""}
          width={memory.width}
          height={memory.height}
          sizes="(min-width: 1024px) 64rem, 92vw"
          className="h-full w-full object-cover"
          style={{ objectPosition: focusFor(memory.id) }}
        />
      </div>
      <figcaption className="memory-shot__caption memory-shot__caption--centered" data-reveal="fade">
        <MemoryMeta memory={memory} />
        <h3 className="sr-only">{memory.title}</h3>
        <p className="type-emotion memory-shot__title mx-auto mt-2 max-w-sm">{memory.caption}</p>
        <p className="sr-only">{memory.note}</p>
      </figcaption>
    </figure>
  );
}

/**
 * A small photograph adrift in a great deal of dark — used twice, at
 * opposite emotional moments: Memory 02 (a quiet beat between the opener
 * and the portrait) sits off to one side; Memory 05 (`resolution`) sits
 * centred and is given extra space below it, since its own words call it
 * the one she'd keep and it is the last thing before the Letter. Motion is
 * the shared, ordinary fade every other quiet element on this site already
 * uses — nothing bespoke, on purpose.
 */
function QuietMemory({
  memory,
  align,
  resolution = false,
}: {
  memory: Memory;
  align: "end" | "center";
  resolution?: boolean;
}) {
  return (
    <figure
      className={`memory-shot memory-shot--quiet memory-shot--${align}${
        resolution ? " memory-shot--resolution" : ""
      }`}
    >
      <div className="memory-shot__frame memory-shot__frame--small" data-reveal="fade">
        <Image
          src={memory.src}
          alt={photoFraming[memory.id]?.alt ?? ""}
          width={memory.width}
          height={memory.height}
          sizes="(min-width: 768px) 26rem, 74vw"
          className="h-full w-full object-cover"
          style={{ objectPosition: focusFor(memory.id) }}
        />
      </div>
      <figcaption
        className={`memory-shot__caption memory-shot__caption--${align === "center" ? "centered" : "quiet"}`}
        data-reveal="fade"
      >
        <MemoryMeta memory={memory} />
        <h3 className="sr-only">{memory.title}</h3>
        <p className="type-emotion memory-shot__title mt-2 max-w-xs">{memory.caption}</p>
        <p className="sr-only">{memory.note}</p>
      </figcaption>
    </figure>
  );
}

/**
 * Memory 03 — an intimate portrait, off-axis, with the caption resting in
 * the negative space beside it rather than over it. Carries this chapter's
 * one focus-pull: the photo itself starts a little soft and sharpens as it
 * arrives, so attention settles onto it rather than the words that were
 * already legible. One-shot, same as the establishing shot.
 */
function IntimateMemory({
  memory,
  reduced,
}: {
  memory: Memory;
  reduced: boolean;
}) {
  const photoRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced || !photoRef.current) return;
      const tween = gsap.fromTo(
        photoRef.current,
        { filter: "blur(5px)" },
        {
          filter: "blur(0px)",
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: photoRef.current,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );
      // Same reasoning as the establishing shot's failsafe: a photograph
      // should not stay soft-focus indefinitely if the frame loop stalls.
      const failsafe = window.setTimeout(() => {
        if (tween.progress() < 1) tween.progress(1);
      }, 2800);
      return () => {
        window.clearTimeout(failsafe);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <figure className="memory-shot memory-shot--intimate">
      <div
        ref={photoRef}
        className="memory-shot__frame memory-shot__frame--portrait"
        data-reveal="fade"
      >
        <Image
          src={memory.src}
          alt={photoFraming[memory.id]?.alt ?? ""}
          width={memory.width}
          height={memory.height}
          sizes="(min-width: 768px) 28rem, 84vw"
          className="h-full w-full object-cover"
          style={{ objectPosition: focusFor(memory.id) }}
        />
      </div>
      <figcaption className="memory-shot__caption memory-shot__caption--intimate" data-reveal="fade">
        <MemoryMeta memory={memory} />
        <h3 className="sr-only">{memory.title}</h3>
        <p className="type-emotion memory-shot__title mt-2 max-w-xs">{memory.caption}</p>
        <p className="sr-only">{memory.note}</p>
      </figcaption>
    </figure>
  );
}

/**
 * Memory 04 — this chapter's one signature moment: a contained frame that
 * expands toward full-bleed as the visitor scrolls through it, then gives
 * way to the next, quieter memory. Pinned only where a fine pointer and
 * verified frames make that feel premium rather than janky; everywhere else
 * it simply renders large and still — the strongest photo on the page
 * either way, just not the one moving one.
 *
 * Expansion is done entirely with `clip-path` (a compositor-friendly
 * property) on a frame that is already full-bleed-sized underneath, rather
 * than animating `width`/`height` — same visual result, none of the layout
 * cost.
 */
function HeroMemory({
  memory,
  capable,
}: {
  memory: Memory;
  capable: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!capable || !sectionRef.current || !frameRef.current) return;
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=70%",
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          // 15% inset (a contained frame with room around it) easing to 0
          // (full-bleed). Radius shrinks with it, so the contained frame
          // reads as a photograph and the expanded one as the screen itself.
          const inset = 15 * (1 - self.progress);
          const radius = 18 * (1 - self.progress);
          frameRef.current!.style.clipPath =
            `inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`;
        },
      });
      // The four memories above this one (and everything below it, all the
      // way to the Letter) can still be settling their own layout the first
      // time this runs — a pin created against a stale document height is
      // exactly what leaves the next memory's spacer too short and the two
      // overlapping. Same fix ChapterTimeline's own pin already uses.
      ScrollTrigger.refresh();
      return () => st.kill();
    },
    { dependencies: [capable], revertOnUpdate: true }
  );

  return (
    <figure
      ref={sectionRef}
      className={`memory-shot memory-shot--hero${capable ? "" : " memory-shot--hero-static"}`}
    >
      <div
        ref={frameRef}
        className="memory-shot__frame memory-shot__frame--hero"
        data-reveal={capable ? undefined : "fade"}
        style={capable ? { clipPath: "inset(15% 15% 15% 15% round 18px)" } : undefined}
      >
        <Image
          src={memory.src}
          alt={photoFraming[memory.id]?.alt ?? ""}
          width={memory.width}
          height={memory.height}
          sizes="100vw"
          className="h-full w-full object-cover"
          style={{ objectPosition: focusFor(memory.id) }}
        />
        <div className="memory-shot__hero-gradient" aria-hidden="true" />
        <figcaption className="memory-shot__caption memory-shot__caption--hero">
          <MemoryMeta memory={memory} />
          <h3 className="sr-only">{memory.title}</h3>
          <p className="type-emotion memory-shot__title mt-2 max-w-xs">{memory.caption}</p>
          <p className="sr-only">{memory.note}</p>
        </figcaption>
      </div>
    </figure>
  );
}
