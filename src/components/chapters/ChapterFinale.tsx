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

  const actions = [
    { label: "Replay the Journey", target: "portal" },
    { label: "Revisit the Memories", target: "memories" },
    { label: "Read the Letter Again", target: "letter" },
    { label: "Back to the Celebration", target: "birthday" },
  ];

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
        <p className="type-meta" data-reveal="fade">
          Chapter 08
        </p>
        <h2 id="finale-title" className="type-chapter mt-6" data-reveal="mask">
          <span className="reveal-line">And this is only the beginning</span>
        </h2>
        <p className="type-emotion mx-auto mt-7 max-w-[28rem]" data-reveal="fade">
          The universe grows quiet, but our story continues beyond the final
          star.
        </p>

        <div className="finale-lines">
          <p className="type-emotion" data-reveal="fade">
            This whole universe is made out of ordinary days with you.
          </p>
          <p className="type-emotion mt-4" data-reveal="fade">
            The best ones have not happened yet.
          </p>
        </div>

        <p className="type-chapter finale-birthday" data-reveal="mask">
          <span className="reveal-line">Happy Birthday, my love.</span>
        </p>

        <nav aria-label="Revisit the story" className="finale-actions" data-reveal="fade">
          {actions.map((action) => (
            <button
              key={action.target}
              type="button"
              onClick={() => scrollTo(action.target)}
              className="btn-quiet"
            >
              {action.label}
            </button>
          ))}
        </nav>

        <footer className="finale-dedication" data-reveal="fade">
          <p className="type-meta">{site.footer}</p>
        </footer>
      </div>
    </section>
  );
}
