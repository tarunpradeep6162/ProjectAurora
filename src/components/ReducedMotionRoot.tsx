"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Stamps a `data-reduced-motion` attribute on <html> and toggles GSAP's
 * global default so every ScrollTrigger / tween created afterwards respects
 * the user's preference automatically, without each component re-checking it.
 */
export default function ReducedMotionRoot() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-reduced-motion",
      reduced ? "true" : "false"
    );
  }, [reduced]);

  return null;
}
