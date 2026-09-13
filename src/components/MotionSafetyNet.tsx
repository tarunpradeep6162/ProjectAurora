"use client";

import { useEffect } from "react";

/**
 * Guarantees no element is left permanently invisible if a GSAP/Framer Motion
 * timeline never completes (rAF paused, tab backgrounded, JS error mid-sequence).
 * Runs once after the longest expected cinematic reveal (~3.5s); if a tween is
 * still holding an element at opacity 0 by then, force it visible with
 * `!important` so it beats any inline style GSAP/Framer left behind.
 * See master prompt "REQUESTANIMATIONFRAME RELIABILITY" / "NO INVISIBLE HERO BUG".
 */
export default function MotionSafetyNet() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // `[data-motion-exempt]` opts an element out. Purely atmospheric
      // layers whose whole job is to be invisible until scroll brings them
      // in (the cosmic backdrop before its first frame, for instance) are
      // not "stuck" content — forcing them visible, and stripping their
      // transform and filter along with it, would be the bug rather than
      // the fix. Nothing carrying text is ever exempt.
      const stuck = document.querySelectorAll<HTMLElement>(
        '[style*="opacity: 0"]:not([data-motion-exempt]), [style*="opacity:0"]:not([data-motion-exempt])'
      );
      stuck.forEach((el) => {
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("transform", "none", "important");
        el.style.setProperty("filter", "none", "important");
      });
    }, 3500);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
