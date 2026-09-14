"use client";

import { useEffect, useRef, useState } from "react";
import { useCoarsePointer } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LABELS: Record<string, string> = {
  enter: "Enter",
  wish: "Wish",
};

/**
 * A small, contextual cursor label — Project Aurora's own take on Utsubo's
 * "occasional active participation" cursor (see
 * UTSUBO_INSPIRED_AURORA_AUDIT.md). Fine-pointer desktop only, off entirely
 * under reduced motion and on touch, and scoped to exactly two moments that
 * genuinely ask for a decision: the opening portal's "Begin the Journey"
 * and the birthday candle. Not a persistent follower circle, and not
 * present anywhere else in the site.
 *
 * Elements opt in with `data-cursor="enter" | "wish"`. The dot's position
 * is written straight to CSS custom properties on every real pointermove
 * (mouse only) — no React state per move, so this never re-renders on
 * pointer movement, only when the hovered label actually changes.
 */
export default function CinematicCursor() {
  const coarsePointer = useCoarsePointer();
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const active = !coarsePointer && !reduced;

  useEffect(() => {
    if (!active) return;

    const dot = dotRef.current;
    if (!dot) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      dot.style.setProperty("--cx", `${event.clientX}px`);
      dot.style.setProperty("--cy", `${event.clientY}px`);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target as HTMLElement | null;
      const hovered = target?.closest<HTMLElement>("[data-cursor]");
      setLabel(hovered?.dataset.cursor ?? null);
    };

    const onLeaveWindow = () => setLabel(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerleave", onLeaveWindow);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerleave", onLeaveWindow);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="cinematic-cursor"
      data-active={label ? "" : undefined}
    >
      <span className="cinematic-cursor__dot" />
      <span className="cinematic-cursor__label">{label ? LABELS[label] : ""}</span>
    </div>
  );
}
