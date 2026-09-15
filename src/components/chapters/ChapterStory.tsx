"use client";

import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "@/lib/gsap";
import { timeline, journey, memories, memoriesIntro } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { useMotionEngineAlive } from "@/components/chapters/useMotionEngine";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { requestSceneRemeasure } from "@/components/cosmic/sceneProgress";
import { useActiveCardIndex } from "@/components/cosmic/storyCarouselState";
import { CARD_COUNT, buildCards } from "@/components/cosmic/StoryCarousel";

/**
 * Chapters 03 (Our story), 04 (The journey) and 05 (Memories), merged into
 * one chapter on request: a real 3D rolling/cylindrical carousel
 * (StoryCarousel.tsx, mounted in the persistent WebGL world) now carries
 * all three — the five timeline moments, the journey, and the five real
 * photographs — as one continuous scroll-driven ride, in place of what
 * used to be three separate DOM sections (ChapterTimeline.tsx,
 * ChapterJourney.tsx, MemoryGallery.tsx — all three kept on disk, unmounted
 * from page.tsx, the same "retire, don't delete" precedent AuroraRelic.tsx
 * already set in this project).
 *
 * This section stays pinned for a long scroll (enough for all eleven cards
 * to roll past at a readable pace) purely so `chapterProgress` — the
 * canonical scroll signal every WebGL object in this scene already reads —
 * advances slowly enough to watch, the same reason ChapterTimeline's own
 * pin existed. The DOM here does not drive the carousel; it only supplies:
 *
 * - The real, accessible content for all eleven moments, in full, so nnone
 *   of it is lost to a screen reader or search index just because only one
 *   card is visually prominent in the WebGL layer at a time — the same
 *   "decorative WebGL, accessible DOM twin" split every other chapter on
 *   this site already uses.
 * - One small, genuinely synced caption (`useActiveCardIndex`,
 *   storyCarouselState.ts) naming whichever card the carousel currently
 *   has at the front, so the visible page always agrees with what's on
 *   screen rather than running its own separate narrative.
 *
 * Skips its pin under the same conditions ChapterTimeline's did (reduced
 * motion, narrow/touch viewports where a pin fights native scroll, or a
 * stalled frame loop) — and falls back to a plain, fully readable list of
 * all eleven moments in document order, since the WebGL carousel's own
 * pacing is exactly what a pin was providing.
 */
export default function ChapterStory() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const narrow = useNarrowViewport();
  const coarsePointer = useCoarsePointer();
  const engineAlive = useMotionEngineAlive();
  const skipPin = reduced || narrow || coarsePointer || !engineAlive;

  useInViewReveal(root);

  const cards = useMemo(() => buildCards(), []);
  const activeIndex = useActiveCardIndex();
  const activeCard = cards[activeIndex] ?? cards[0];
  // The chapter's own quiet closing beat ("ordinary days"): the last card
  // is always the final photograph (memory-5, "The One I Would Keep") —
  // once it's the one at the front, its own genuine note
  // (content.ts — previously sr-only only, never shown) surfaces as the
  // chapter's last line before the Letter, rather than new invented copy.
  const isClosingBeat = activeIndex === cards.length - 1 && Boolean(activeCard.note);

  useGSAP(
    () => {
      if (skipPin || !root.current) return;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: `+=${CARD_COUNT * 90}%`,
        pin: true,
      });
      // Same fix ChapterTimeline's own pin already needed: the layout above
      // this chapter may have just changed height, and sceneProgress.ts
      // keeps its own bounds cache that doesn't know this pin-spacer's
      // final height until a frame after it commits.
      ScrollTrigger.refresh();
      requestAnimationFrame(requestSceneRemeasure);
      return () => st.kill();
    },
    { scope: root, dependencies: [skipPin], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="story"
      aria-labelledby="story-title"
      className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-transparent px-[max(1.5rem,env(safe-area-inset-left))] py-32 sm:px-6"
    >
      <h2 id="story-title" className="sr-only">
        Our story became a world
      </h2>
      <p className="sr-only">
        Every conversation, every smile and every small moment left a light
        behind.
      </p>

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <p className="type-meta" data-reveal="fade">
          Our story
        </p>

        {/* The one visible caption, genuinely synced to whichever card the
            WebGL carousel currently has at the front — never a fixed or
            timed crossfade of its own. */}
        <p className="type-meta mt-6 opacity-80" aria-hidden="true">
          {activeCard.meta}
        </p>
        <p className="type-emotion mx-auto mt-3 max-w-md" aria-hidden="true">
          {activeCard.line}
        </p>
        {/* Ordinary Days: the same synced-caption mechanism, one beat
            quieter — the chapter's real closing thought, not a new
            fabricated one, surfacing only once the story has actually
            arrived at its last photograph. */}
        {isClosingBeat && (
          <p
            className="type-story mx-auto mt-8 max-w-sm italic opacity-75"
            aria-hidden="true"
          >
            {activeCard.note}
          </p>
        )}
      </div>

      {/* Full accessible content for all eleven moments, in order — the
          real twin of what the carousel shows one card of at a time. Only
          rendered when the pin (and so the carousel's own pacing) is
          actually in play; when it's skipped the visible fallback list
          just below already carries this same content out loud, and
          rendering both would read it twice to a screen reader. */}
      {!skipPin && (
        <ol className="sr-only">
          {timeline.map((entry) => (
            <li key={entry.number}>
              <h3>
                {entry.number} — {entry.title}
              </h3>
              <p>{entry.line}</p>
            </li>
          ))}
          <li>
            <h3>{journey.title}</h3>
            <p>{journey.subtitle}</p>
          </li>
          <li>
            <h3>{memoriesIntro.title}</h3>
            <p>{memoriesIntro.subtitle}</p>
          </li>
          {memories.map((memory) => (
            <li key={memory.id}>
              <h3>{memory.title}</h3>
              <p>{memory.caption}</p>
              <p>{memory.note}</p>
            </li>
          ))}
        </ol>
      )}

      {/* Plain, fully visible fallback list — reduced motion, a touch/
          narrow viewport, or a stalled frame loop, any of which also means
          the WebGL carousel may not be worth relying on for pacing. */}
      {skipPin && (
        <ol className="relative z-10 mt-16 flex w-full max-w-xl flex-col gap-10 text-center">
          {timeline.map((entry) => (
            <li key={entry.number} data-reveal="fade">
              <p className="type-meta">
                {entry.number} — {entry.title}
              </p>
              <p className="type-chapter mt-3">{entry.line}</p>
            </li>
          ))}
          <li data-reveal="fade">
            <p className="type-meta">{journey.title}</p>
            <p className="type-chapter mt-3">{journey.subtitle}</p>
          </li>
          <li data-reveal="fade">
            <p className="type-meta">{memoriesIntro.title}</p>
            <p className="type-chapter mt-3">{memoriesIntro.subtitle}</p>
          </li>
          {memories.map((memory) => (
            <li key={memory.id} data-reveal="fade">
              <p className="type-meta">{memory.place}</p>
              <p className="type-chapter mt-3">{memory.caption}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
