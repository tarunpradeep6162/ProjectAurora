"use client";

import { useEffect, useRef, useState } from "react";
import { chapters, hiddenMessages } from "@/lib/content";

/**
 * Softer wayfinding labels for the nav panel's chapter list — the panel
 * itself is the one place a slightly more descriptive list still belongs
 * (it's a menu, not the page's primary visual presentation), but "Our
 * Story" reads better here than the literal chapter titles used to drive
 * document structure elsewhere.
 */
const NAV_LABELS: Record<string, string> = {
  portal: "The Beginning",
  miracle: "A Favourite Miracle",
  // Chapters 03-05 (story/journey/memories) are one merged chapter now —
  // see content.ts — so this single label covers all three.
  story: "Our Story",
  letter: "My Letter",
  birthday: "Your Wish",
  finale: "Forever",
};
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useActiveChapterIndex } from "@/components/cosmic/sceneProgress";
import { markMessageFound, useFoundMessages } from "@/components/HiddenMessages";

/**
 * Accessibility & Chapters panel.
 *
 * A genuine navigation + accessibility feature:
 *  - Keyboard operable (Tab / Enter / Space) chapter jump list, 44px rows.
 *  - Tarun's eight hidden messages, revealable here as plain text, so
 *    nobody has to find a star in the page to read them. Found-state is
 *    shared with the stars.
 *  - ESC closes the panel and returns focus to its button.
 *  - Reports the active chapter through an ARIA live region.
 *
 * Restraint pass: one compact control in the corner that also shows where
 * you are ("03 / 08"). The permanent dot rail down the right-hand edge is
 * gone, and so are the pill shape and the frosted glass. The control
 * recedes entirely while the candle holds its darkness (`.chrome-recede`).
 */
function HiddenMessageRow({ index, isFound }: { index: number; isFound: boolean }) {
  const messageId = `hidden-message-text-${index}`;
  // The button stays mounted once revealed so keyboard focus is never dropped.
  return (
    <div>
      <button
        type="button"
        onClick={() => markMessageFound(index)}
        aria-expanded={isFound}
        aria-controls={messageId}
        className="block min-h-11 w-full rounded-[2px] px-3 py-2.5 text-left text-[0.8125rem] tracking-[0.08em] text-[rgba(221,211,197,0.7)] transition-colors hover:bg-white/[0.03] hover:text-foreground"
      >
        <span className="mr-2 text-[12px] tracking-[0.24em] text-[rgba(200,168,106,0.8)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        {isFound ? `Hidden message ${index + 1}` : `Reveal hidden message ${index + 1}`}
      </button>
      <p
        id={messageId}
        hidden={!isFound}
        className="px-3 pb-3 font-display text-[0.95rem] italic leading-snug text-[rgba(241,236,227,0.86)]"
      >
        {hiddenMessages[index].message}
      </p>
    </div>
  );
}

export default function ChapterNav() {
  const [open, setOpen] = useState(false);
  const foundMessages = useFoundMessages();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Shared scroll store rather than IntersectionObserver, which never fires
  // in some embedding contexts (see sceneProgress.ts).
  const activeIndex = useActiveChapterIndex();
  const current = chapters[activeIndex] ?? chapters[0];
  const inFinale = activeIndex === chapters.length - 1;
  const inLetter = current.id === "letter";

  // Let the finale close the site without this fixed control sitting over
  // its own revisit links (see `.chrome-recede` / `data-finale-hush` in
  // globals.css). Reuses the same active-chapter signal already driving the
  // "08 / 08" indicator above, so no new observer is needed.
  useEffect(() => {
    const html = document.documentElement;
    if (inFinale) html.setAttribute("data-finale-hush", "");
    else html.removeAttribute("data-finale-hush");
    return () => html.removeAttribute("data-finale-hush");
  }, [inFinale]);

  // The Letter is the one chapter this site asks to read as a quiet scene
  // rather than a page — see `.letter-hush` for the sky, and this for the
  // corner chrome (this same nav button, the audio toggle) receding the
  // same way it already does for the finale, so nothing reads as "website"
  // while Tarun's words are on screen.
  useEffect(() => {
    const html = document.documentElement;
    if (inLetter) html.setAttribute("data-letter-hush", "");
    else html.removeAttribute("data-letter-hush");
    return () => html.removeAttribute("data-letter-hush");
  }, [inLetter]);

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
    el.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
    setOpen(false);
  }

  return (
    <>
      <nav
        aria-label="Chapters"
        className="chrome-recede fixed top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-50 sm:top-6 sm:left-6"
      >
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="chapter-nav-panel"
          onClick={() => setOpen((v) => !v)}
          className="chrome-button"
        >
          <span aria-hidden="true" className="flex w-3.5 flex-col gap-[4px]">
            <span className="block h-px w-full bg-current" />
            <span className="block h-px w-2/3 bg-current" />
          </span>
          <span className="hidden sm:inline">Our Story</span>
          <span className="sr-only sm:hidden">Our Story and accessibility</span>
          <span aria-hidden="true" className="tabular-nums text-[rgba(200,168,106,0.8)]">
            {current.number}
            <span className="text-[rgba(221,211,197,0.62)]"> / {String(chapters.length).padStart(2, "0")}</span>
          </span>
        </button>

        {/* Plain conditional render with a CSS entrance (`.nav-panel`), no
            exit animation: an animation-library exit waits on
            requestAnimationFrame, and where frames stall the panel could
            never unmount after Esc. */}
        {open && (
          <div
            id="chapter-nav-panel"
            ref={panelRef}
            role="dialog"
            aria-label="Chapter navigation and accessibility panel"
            className="nav-panel mt-2 max-h-[min(72svh,40rem)] w-[min(calc(100vw-2rem),23rem)] overflow-y-auto overscroll-contain rounded-[2px] border border-[rgba(215,185,122,0.2)] bg-[rgba(8,8,7,0.97)] p-4 sm:p-5"
          >
            <h2 className="type-meta mb-2 px-2">Our Story</h2>
            <p className="type-story mb-3 px-2 text-[0.8125rem] leading-relaxed text-[rgba(221,211,197,0.6)]">
              Find your way back to any moment.
            </p>
            <ol>
              {chapters.map((chapter, i) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(chapter.id)}
                    aria-current={i === activeIndex ? "location" : undefined}
                    className={`block min-h-11 w-full rounded-[2px] border-l px-3 py-2.5 text-left transition-colors ${
                      i === activeIndex
                        ? "border-[rgba(215,185,122,0.8)] bg-[rgba(215,185,122,0.06)] text-accent-soft"
                        : "border-transparent text-[rgba(221,211,197,0.78)] hover:bg-white/[0.03] hover:text-foreground"
                    }`}
                  >
                    <span className="block font-display text-[1.05rem] leading-tight">
                      {NAV_LABELS[chapter.id] ?? chapter.title}
                    </span>
                    <span className="mt-0.5 block font-display text-[0.9rem] italic leading-snug opacity-80">
                      {chapter.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <section
              aria-labelledby="hidden-messages-heading"
              className="mt-4 border-t border-[rgba(215,185,122,0.16)] pt-4"
            >
              <h2 id="hidden-messages-heading" className="type-meta mb-2 px-2">
                Hidden messages
              </h2>
              <p
                className="type-story mb-2 px-2 text-[0.8125rem] leading-relaxed text-[rgba(221,211,197,0.6)]"
                aria-live="polite"
              >
                {foundMessages.length} of {hiddenMessages.length} found among the
                stars.
              </p>
              <ol>
                {hiddenMessages.map((m, i) => (
                  <li key={m.message}>
                    <HiddenMessageRow index={i} isFound={foundMessages.includes(i)} />
                  </li>
                ))}
              </ol>
            </section>
            <div className="type-story mt-3 border-t border-[rgba(215,185,122,0.16)] px-2 pt-3 text-[0.75rem] leading-relaxed text-[rgba(221,211,197,0.6)]">
              Reduced motion is currently{" "}
              <strong className="font-normal text-accent-soft">
                {reduced ? "on" : "off"}
              </strong>{" "}
              (detected from your system settings). When on, this site
              disables scroll-driven parallax and shortens transitions
              automatically.
            </div>
          </div>
        )}
      </nav>

      <div className="sr-only" role="status" aria-live="polite">
        {`Chapter ${current.number}: ${current.title}`}
      </div>
    </>
  );
}
