"use client";

import { useRef } from "react";
import Image from "next/image";
import { memories, site } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useActiveChapterIndex } from "@/components/cosmic/sceneProgress";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { focusFor } from "@/components/chapters/photoFraming";

/**
 * Three of the real photographs, returning as ghosts behind the last words —
 * slow cross-dissolves at very low opacity, never cards, never a gallery.
 * Decorative duplicates of images already shown (with their captions) in
 * chapter 05, so they carry empty alt text.
 */
const GHOST_IDS = ["memory-5", "memory-1", "memory-3"];
const ghosts = GHOST_IDS.map((id) => memories.find((m) => m.id === id)).filter(
  (m): m is (typeof memories)[number] => Boolean(m)
);

const FINALE_INDEX = 7;

/**
 * Chapter 8 — the deepest composition on the site, not the brightest.
 *
 * The words arrive one at a time with a great deal of dark between them.
 * The birthday line is given its weight by the silence before it rather
 * than by size or light, and the dedication closes the page alone, after
 * an enormous empty space, exactly as written in content.ts.
 */
export default function ChapterFinale() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const activeIndex = useActiveChapterIndex();
  useInViewReveal(root, { enter: 0.84, stagger: 220 });

  // The ghosts only move while the finale is actually on screen.
  const ghostsLive = activeIndex >= FINALE_INDEX - 1;

  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  }

  return (
    <section
      ref={root}
      id="finale"
      aria-labelledby="finale-title"
      className="finale"
    >
      <div
        aria-hidden="true"
        className="finale-ghosts"
        data-live={ghostsLive ? "" : undefined}
      >
        {ghosts.map((memory, i) => (
          <div
            key={memory.id}
            className="finale-ghost"
            style={{ "--i": i } as React.CSSProperties}
          >
            <Image
              src={memory.src}
              alt=""
              fill
              sizes="100vw"
              className="finale-ghost__img"
              style={{ objectPosition: focusFor(memory.id) }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="finale-depth" />

      <div className="finale-inner">
        {/* "And this is only the beginning" and its subtitle stay for
            screen readers/document structure; visually this chapter now
            opens directly on silence, then the one line that matters. */}
        <h2 id="finale-title" className="sr-only">
          And this is only the beginning
        </h2>
        <p className="sr-only">
          The universe grows quiet, but our story continues beyond the final
          star.
        </p>
        <p className="sr-only" data-reveal="fade">
          This whole universe is made out of ordinary days with you. The best
          ones have not happened yet.
        </p>

        <p className="type-chapter finale-birthday" data-reveal="mask">
          <span className="reveal-line">Happy Birthday, my love.</span>
        </p>

        <nav aria-label="Revisit the story" className="finale-actions" data-reveal="fade">
          <button type="button" onClick={() => scrollTo("portal")} className="btn-quiet">
            Replay our story
          </button>
        </nav>

        <footer className="finale-dedication" data-reveal="fade">
          <p className="type-meta">Created with love by {site.author}</p>
          <p className="type-meta mt-1">For {site.recipient}</p>
          <p className="type-meta mt-1">{site.birthday}</p>
        </footer>
      </div>
    </section>
  );
}
