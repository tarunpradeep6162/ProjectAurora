"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { chapters } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useActiveChapterIndex } from "@/components/cosmic/sceneProgress";

/**
 * Accessibility & Chapters panel.
 *
 * This is a genuine navigation + accessibility feature, not a decorative
 * copy of the reference site's panel:
 *  - Keyboard operable (Tab / Enter / Space) chapter jump list.
 *  - Every chapter's "hidden message" (its emotional through-line) is
 *    exposed as real text here, so it is available to screen-reader users
 *    and to anyone with reduced motion who may not trigger the equivalent
 *    scroll-driven reveal in the chapter itself.
 *  - ESC closes the panel.
 *  - Reports the active chapter as an ARIA live region for non-visual users.
 */
export default function ChapterNav() {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Was an `IntersectionObserver` over the eight sections. That has a real
  // failure mode: in some embedding contexts IntersectionObserver callbacks
  // never fire at all, which would silently freeze the nav — and its ARIA
  // live region — reporting "Chapter 01" for the entire visit, including
  // for screen-reader users who have no other way to tell where they are.
  // The shared scroll store already computes exactly this, has no such
  // failure mode, and adds no second listener to the page.
  const activeIndex = useActiveChapterIndex();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    setOpen(false);
  }

  return (
    <>
      <div className="fixed top-5 left-4 sm:top-6 sm:left-6 z-50">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="chapter-nav-panel"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-line bg-background-deep/70 px-4 py-2 text-[11px] tracking-[0.18em] uppercase text-foreground-muted backdrop-blur-sm hover:text-accent-soft hover:border-accent transition-colors"
        >
          <span aria-hidden="true">&#9776;</span>
          Chapters &amp; Accessibility
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              id="chapter-nav-panel"
              ref={panelRef}
              role="dialog"
              aria-label="Chapter navigation and accessibility panel"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0.01 : 0.28, ease: [0.19, 1, 0.22, 1] }}
              className="mt-3 w-[min(90vw,380px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-background-deep/95 p-5 shadow-2xl backdrop-blur-md"
            >
              <h2 className="font-display text-lg text-accent-soft mb-1">
                Chapters
              </h2>
              <p className="text-xs text-foreground-muted mb-4 leading-relaxed">
                Jump to any chapter. Each entry also reveals its hidden
                message in text — a non-visual equivalent of the chapter&apos;s
                scroll-driven reveal, always available regardless of motion
                settings.
              </p>
              <ol className="space-y-1">
                {chapters.map((chapter, i) => (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(chapter.id)}
                      className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                        i === activeIndex
                          ? "bg-accent/15 text-accent-soft"
                          : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <span className="block text-[10px] tracking-[0.2em] opacity-70">
                        {chapter.number}
                      </span>
                      <span className="block font-display text-base leading-tight">
                        {chapter.title}
                      </span>
                      <span className="block text-[11px] italic opacity-70 mt-0.5">
                        {chapter.hiddenMessage}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="mt-4 pt-4 border-t border-line text-[11px] text-foreground-muted leading-relaxed">
                Reduced motion is currently{" "}
                <strong className="text-accent-soft">
                  {reduced ? "on" : "off"}
                </strong>{" "}
                (detected from your system settings). When on, this site
                disables scroll-driven parallax and shortens transitions
                automatically.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chapter dots — top-right quick jump, also keyboard accessible */}
      <nav
        aria-label="Chapter progress"
        className="fixed top-1/2 right-4 sm:right-6 z-40 -translate-y-1/2 hidden md:flex flex-col gap-3"
      >
        {chapters.map((chapter, i) => (
          <button
            key={chapter.id}
            type="button"
            onClick={() => jumpTo(chapter.id)}
            aria-label={`Go to chapter ${chapter.number}: ${chapter.title}`}
            aria-current={i === activeIndex}
            className="group relative flex items-center justify-end"
          >
            <span
              className={`h-2 w-2 rounded-full border transition-all duration-300 ${
                i === activeIndex
                  ? "bg-accent border-accent scale-125"
                  : "bg-transparent border-foreground-muted/50 group-hover:border-accent-soft"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="sr-only" role="status" aria-live="polite">
        {chapters[activeIndex]
          ? `Chapter ${chapters[activeIndex].number}: ${chapters[activeIndex].title}`
          : ""}
      </div>
    </>
  );
}
