"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const VISITED_KEY = "aurora-visited";

/**
 * First-visit vs. return-visit (brief section 81): a first-time visitor gets
 * the full slow portal choreography. Someone re-opening the link later gets
 * a shortened, still-visible entrance so they aren't stuck re-watching the
 * same ~2s sequence, with a small "Replay Intro" affordance to bring it back.
 * This only ever affects animation *timing*, never what content renders —
 * the localStorage read happens inside an effect, after hydration, so the
 * server-rendered markup is identical either way.
 */
export default function ChapterPortal() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [isReturning, setIsReturning] = useState(false);
  const [replayToken, setReplayToken] = useState(0);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(VISITED_KEY) === "1";
      // Intentional one-time client-only read: whether this is a returning
      // visitor can only be known after mount, and it only ever adjusts
      // animation timing (never what renders), so this is exempt from the
      // usual lint guidance against setState-in-effect — same justified
      // pattern as Starfield's client-only star generation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReturning(seen);
      window.localStorage.setItem(VISITED_KEY, "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — default to full intro.
    }
  }, []);

  useGSAP(
    () => {
      const selectors = ["[data-portal-ring]", "[data-portal-line]", "[data-portal-cta]"];

      if (reduced) {
        gsap.set(selectors, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      // Returning visitors get the same beats at roughly a third of the
      // duration — still a real reveal, never an abrupt cut.
      const speed = isReturning ? 0.35 : 1;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(
        "[data-portal-ring]",
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 1.8 * speed }
      )
        .fromTo(
          "[data-portal-line]",
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 1.2 * speed, stagger: 0.18 * speed },
          `-=${1.1 * speed}`
        )
        .fromTo(
          "[data-portal-cta]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 1 * speed },
          `-=${0.5 * speed}`
        );
    },
    { scope: root, dependencies: [reduced, isReturning, replayToken] }
  );

  function scrollToNext() {
    document
      .getElementById("miracle")
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  function replayIntro() {
    try {
      window.localStorage.removeItem(VISITED_KEY);
    } catch {
      // ignore
    }
    setIsReturning(false);
    setReplayToken((t) => t + 1);
  }

  return (
    <section
      ref={root}
      id="portal"
      aria-label="Chapter 1: Enter the universe"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-transparent"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,167,92,0.16),transparent_60%)]"
      />
      {/* The local CSS starfield that used to sit here is gone. Back when
          the 3D backdrop was scoped to this one chapter it was doing real
          work; now that the graded cosmic sky and the WebGL starfield both
          span the whole site, it was a third layer of stars rotating at its
          own speed over the top of two others — the exact "grain + stars +
          nebula all at once" mush the backdrop refinement is meant to undo.
          Dropping it also removes a permanently-running CSS animation from
          the first paint of the page. */}

      <div
        data-portal-ring
        aria-hidden="true"
        className="pointer-events-none absolute h-[60vmin] w-[60vmin] rounded-full border border-accent/30"
        style={{
          boxShadow:
            "0 0 120px 40px rgba(217,167,92,0.08), inset 0 0 80px rgba(217,167,92,0.08)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <span
          data-portal-line
          className="mb-4 text-[11px] tracking-[0.35em] uppercase text-accent-soft"
        >
          Chapter 01
        </span>
        <h1
          data-portal-line
          className="text-balance font-display text-[clamp(2.4rem,7vw,5.5rem)] leading-[1.05] text-foreground"
        >
          Project Aurora
        </h1>
        <p
          data-portal-line
          className="mt-2 text-[clamp(0.9rem,1.6vw,1.15rem)] tracking-[0.25em] uppercase text-foreground-muted"
        >
          An Interactive Love Story
        </p>
        <p
          data-portal-line
          className="mt-8 max-w-xl text-balance font-display text-lg italic text-foreground-muted"
        >
          A portal opens into a world made from love, light and memory.
        </p>

        <div data-portal-cta className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={scrollToNext}
            className="rounded-full border border-accent/60 bg-accent/10 px-8 py-3 text-xs tracking-[0.3em] uppercase text-accent-soft transition-colors hover:bg-accent/20"
          >
            Begin the Journey
          </button>
          <span className="text-[10px] tracking-[0.3em] uppercase text-foreground-muted/70">
            or scroll
          </span>
          {isReturning && (
            <button
              type="button"
              onClick={replayIntro}
              className="mt-2 text-[10px] tracking-[0.25em] uppercase text-foreground-muted/60 underline decoration-dotted underline-offset-4 hover:text-accent-soft"
            >
              Replay Intro
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
