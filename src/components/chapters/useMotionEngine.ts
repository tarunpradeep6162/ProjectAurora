"use client";

import { useSyncExternalStore } from "react";

type EngineState = "unknown" | "alive" | "stalled";

let engine: EngineState = "unknown";
let probing = false;
const listeners = new Set<() => void>();

function setEngine(next: EngineState) {
  if (engine === next) return;
  engine = next;
  listeners.forEach((fn) => fn());
}

/**
 * One shared probe: does a `requestAnimationFrame` callback actually arrive?
 * If not within ~1.2s the frame loop is stalled (a hidden tab, a sandboxed
 * preview, a throttled webview) and anything that hides story text until a
 * GSAP/ScrollTrigger update runs would leave that text unreachable. A hidden
 * tab is looked at again once it becomes visible, so a page opened in the
 * background still gets the full experience when it is brought forward.
 */
function probe() {
  if (probing || typeof window === "undefined" || engine === "alive") return;
  probing = true;
  let fired = false;
  const raf = window.requestAnimationFrame(() => {
    fired = true;
    probing = false;
    setEngine("alive");
  });
  window.setTimeout(() => {
    if (fired) return;
    window.cancelAnimationFrame(raf);
    probing = false;
    setEngine("stalled");
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", onVisible);
      probe();
    };
    document.addEventListener("visibilitychange", onVisible);
  }, 1200);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  probe();
  return () => {
    listeners.delete(fn);
  };
}

/**
 * True only once frames are verifiably being delivered. Pinned, scrubbed
 * sequences (which stack story text and show one piece at a time) should
 * treat `false` as "lay everything out statically instead".
 */
export function useMotionEngineAlive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => engine === "alive",
    () => false
  );
}
