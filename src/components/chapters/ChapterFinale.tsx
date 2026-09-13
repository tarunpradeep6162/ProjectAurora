"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { site } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function ChapterFinale() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-finale-line]", {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: root.current,
          start: "top 55%",
        },
      });
    },
    { scope: root, dependencies: [reduced] }
  );

  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
      aria-label="Chapter 8: And this is only the beginning"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-32 text-center"
    >
      {/* Same cut as the portal's: the site-wide cosmic sky already carries
          the stars here, and the finale reads better with the gold bloom and
          the words alone than with a second, faster star layer over it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(217,167,92,0.12),transparent_65%)]"
      />

      <div className="relative z-10 mx-auto max-w-xl">
        <span data-finale-line className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 08
        </span>
        <h2
          data-finale-line
          className="font-display text-[clamp(1.9rem,5.5vw,3.4rem)] leading-tight text-foreground"
        >
          And this is only the beginning
        </h2>
        <p data-finale-line className="mt-6 text-balance text-foreground-muted">
          The universe grows quiet, but our story continues beyond the final
          star.
        </p>
        <p data-finale-line className="mt-8 font-display text-xl italic text-accent-soft">
          This whole universe is made out of ordinary days with you.
        </p>
        <p data-finale-line className="mt-3 font-display text-xl italic text-accent-soft">
          The best ones have not happened yet.
        </p>
        <p
          data-finale-line
          className="mt-8 font-display text-[clamp(1.6rem,4vw,2.4rem)] text-foreground"
        >
          Happy Birthday, my love.
        </p>

        <div
          data-finale-line
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {actions.map((action) => (
            <button
              key={action.target}
              type="button"
              onClick={() => scrollTo(action.target)}
              className="rounded-full border border-line px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase text-foreground-muted transition-colors hover:border-accent hover:text-accent-soft"
            >
              {action.label}
            </button>
          ))}
        </div>

        <footer
          data-finale-line
          className="mt-20 text-[10px] tracking-[0.25em] uppercase text-foreground-muted/60"
        >
          {site.footer}
        </footer>
      </div>
    </section>
  );
}
