"use client";

import { useEffect, type RefObject } from "react";
import { subscribeSceneFrame } from "@/components/cosmic/sceneProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Options = {
  /** Fraction of the viewport height an element's top must rise above before it reveals. */
  enter?: number;
  /**
   * If an element is first noticed with its top already above this fraction
   * of the viewport, the visitor has scrolled past faster than any reveal —
   * show it at once rather than make them wait for a fade.
   */
  instant?: number;
  /** Delay between elements that cross the line in the same check (ms). */
  stagger?: number;
};

/** Scroll speed (px/s) above which everything that crosses reveals instantly. */
const FAST_SCROLL = 2400;
const MAX_STAGGER_STEPS = 3;

/**
 * The site's one reveal mechanism for story text (see `[data-reveal]` in
 * globals.css). Two variants: `data-reveal="fade"` for body copy and
 * `data-reveal="mask"` (with a `.reveal-line` child) for titles.
 *
 * Built so that text can never be left hidden:
 *  - Nothing is hidden in the server markup. Only elements that are still
 *    below the fold when this runs get `data-reveal-pending`; anything
 *    already on screen (a reload mid-page) is simply left visible.
 *  - It drives attributes, never inline `opacity` — so MotionSafetyNet's
 *    3.5s sweep does not fight it — and the actual fade is a CSS transition.
 *  - It listens to the shared scroll store *and* polls on a plain timer, so
 *    it still reveals everything where scroll events,
 *    `requestAnimationFrame` or `IntersectionObserver` never fire.
 *  - Fast scrolling, or arriving via a jump, reveals instantly.
 *  - prefers-reduced-motion: nothing is ever hidden at all.
 */
export function useInViewReveal(
  rootRef: RefObject<HTMLElement | null>,
  { enter = 0.88, instant = 0.3, stagger = 140 }: Options = {}
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const all = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const viewport = () =>
      window.innerHeight || document.documentElement.clientHeight || 1;

    let pending = all.filter(
      (el) => el.getBoundingClientRect().top > viewport() * enter
    );
    if (pending.length === 0) return;

    // Hide without a transition (otherwise the text would visibly fade *out*
    // on mount), commit that style, then re-enable transitions for the
    // eventual reveal.
    pending.forEach((el) => {
      el.setAttribute("data-reveal-instant", "");
      el.setAttribute("data-reveal-pending", "");
    });
    root.getBoundingClientRect();
    pending.forEach((el) => el.removeAttribute("data-reveal-instant"));

    let lastY = window.scrollY;
    let lastT = performance.now();
    let unsubscribe: (() => void) | null = null;
    let poll: number | null = null;

    const stop = () => {
      unsubscribe?.();
      unsubscribe = null;
      if (poll !== null) window.clearInterval(poll);
      poll = null;
    };

    const check = () => {
      const now = performance.now();
      const y = window.scrollY;
      const speed = Math.abs(y - lastY) / Math.max(16, now - lastT);
      lastY = y;
      lastT = now;
      const fast = speed * 1000 > FAST_SCROLL;

      const h = viewport();
      // At the very end of the document nothing can scroll any higher, so
      // anything on screen must reveal even if it sits below the line.
      const atEnd =
        y + h >= document.documentElement.scrollHeight - 4;
      let step = 0;
      pending = pending.filter((el) => {
        const top = el.getBoundingClientRect().top;
        if (top > h * enter && !(atEnd && top < h)) return true;
        if (fast || top < h * instant) {
          el.setAttribute("data-reveal-instant", "");
        } else {
          el.style.setProperty(
            "--reveal-delay",
            `${Math.min(step, MAX_STAGGER_STEPS) * stagger}ms`
          );
          step += 1;
        }
        el.removeAttribute("data-reveal-pending");
        return false;
      });
      if (pending.length === 0) stop();
    };

    unsubscribe = subscribeSceneFrame(check);
    poll = window.setInterval(check, 320);

    return () => {
      stop();
      all.forEach((el) => {
        el.removeAttribute("data-reveal-pending");
        el.removeAttribute("data-reveal-instant");
        el.style.removeProperty("--reveal-delay");
      });
    };
  }, [rootRef, reduced, enter, instant, stagger]);
}
