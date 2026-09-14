"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A very small mouse-pointer drift on a chapter's copy block — recovered
 * from the live site's own implementation (a pointermove listener driving a
 * damped lerp, applied as a CSS transform to every `.aurora-copy` element,
 * strength 10px horizontal / 6px vertical, damping 0.08, mouse only,
 * disabled under reduced motion). This project already has the identical
 * pattern for the cosmic camera (`CameraRig` in CosmicScene.tsx) — same
 * `pointerType !== "mouse"` filter, same damped-lerp shape — so this reuses
 * that convention rather than introducing a new one.
 *
 * Purely decorative: never affects opacity or reveal state, so a stalled
 * `requestAnimationFrame` just leaves the block at rest instead of hiding
 * anything (the one hard rule this project holds for any text motion).
 */
export function usePointerParallax(
  ref: React.RefObject<HTMLElement | null>,
  { strengthX = 10, strengthY = 6, damping = 0.08 } = {}
) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return undefined;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      target.y = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    };

    const tick = () => {
      current.x += (target.x - current.x) * damping;
      current.y += (target.y - current.y) * damping;
      el.style.transform = `translate(${(current.x * strengthX).toFixed(2)}px, ${(current.y * strengthY).toFixed(2)}px)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [ref, reduced, strengthX, strengthY, damping]);
}
