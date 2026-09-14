"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { chapters } from "@/lib/content";

export type SceneProgressRef = {
  /** 0 (top of document) to 1 (bottom of document) scroll fraction across the whole page. */
  overall: number;
  /** Index into `chapters` for whichever chapter currently occupies the viewport's vertical center, or -1 before the first measurement. */
  chapterIndex: number;
  /** `chapters[chapterIndex]?.id`, or "" before the first measurement. */
  chapterId: string;
  /** 0-1 progress through that chapter's own section (viewport-center based). */
  chapterProgress: number;
  /**
   * Continuous 0-1 position through the *story* rather than the document:
   * `(chapterIndex + chapterProgress) / (chapters.length - 1)`. Unlike
   * `overall` (which is skewed by the pinned chapters' extra scroll length)
   * this advances at a steady one-eighth per chapter, which is what the
   * colour grading needs so no single stop-to-stop blend ever happens
   * faster than the chapter it belongs to.
   */
  storyPosition: number;
};

type Bounds = { id: string; start: number; end: number };

/**
 * One shared, module-level scroll state for the entire site.
 *
 * Previously each `useSceneProgress()` caller installed its own `scroll` +
 * `resize` listeners and its own bounds measurement. Now that the cosmic
 * grading layer, the chapter nav and the WebGL canvas all need the same
 * numbers, that would have meant three copies of the same work per scroll
 * event (and three sources of truth that could disagree by a frame). This
 * keeps exactly one listener alive, reference-counted across all consumers,
 * and hands every caller a ref onto the *same* state object.
 */
const state: SceneProgressRef = {
  overall: 0,
  chapterIndex: -1,
  chapterId: "",
  chapterProgress: 0,
  storyPosition: 0,
};

let bounds: Bounds[] = [];
let refCount = 0;
let teardown: (() => void) | null = null;
let lastNotifiedIndex = -1;

/** Fires on every scroll/resize update — for cheap, non-React consumers (CSS custom properties). */
const frameListeners = new Set<() => void>();
/** Fires only when the active chapter actually changes — safe for React `setState`. */
const chapterListeners = new Set<(index: number) => void>();

function measure(): Bounds[] {
  const scrollY = window.scrollY;
  return chapters.map((c) => {
    const el = document.getElementById(c.id);
    if (!el) return { id: c.id, start: 0, end: 0 };
    // Two things this has to get right, both caused by GSAP pinning:
    //
    // 1. `getBoundingClientRect` + scrollY, never `offsetTop`. `offsetTop`
    //    is measured from the nearest *positioned* ancestor, and pinning
    //    wraps the pinned element in a `position: relative` pin-spacer — so
    //    `offsetTop` silently collapses to ~0 for exactly those chapters.
    //
    // 2. When a chapter section is itself the pinned element (chapter 03),
    //    its own box is only one viewport tall no matter how much scroll
    //    the pin actually consumes; all the extra scroll length lives in
    //    the pin-spacer around it. Measuring the section would leave a
    //    multi-viewport stretch of the page belonging to no chapter at all,
    //    which froze the grading and left the cosmic path invisible for the
    //    whole of that chapter. Measure the spacer when there is one.
    const box = el.parentElement?.classList.contains("pin-spacer")
      ? el.parentElement
      : el;
    const rect = box.getBoundingClientRect();
    const start = rect.top + scrollY;
    return { id: c.id, start, end: start + rect.height };
  });
}

function update() {
  const scrollY = window.scrollY;
  const viewportCenter = scrollY + window.innerHeight * 0.5;
  const maxScroll = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight
  );
  state.overall = Math.min(1, Math.max(0, scrollY / maxScroll));

  let idx = bounds.findIndex(
    (b) => viewportCenter >= b.start && viewportCenter < b.end
  );
  if (idx === -1) {
    // Nothing contains the viewport centre — a gap between sections, or a
    // stale measurement taken before a pin-spacer resized. Fall back to the
    // last chapter that has already started rather than to chapter 1: a
    // gap two thirds of the way down the page is far more likely to belong
    // to the chapter above it than to the opening. (Snapping back to 0 here
    // is what made the grading jump backwards mid-story.)
    idx = 0;
    for (let i = bounds.length - 1; i >= 0; i--) {
      if (bounds[i].end > bounds[i].start && viewportCenter >= bounds[i].start) {
        idx = i;
        break;
      }
    }
  }
  const b = bounds[idx];
  state.chapterIndex = idx;
  state.chapterId = chapters[idx]?.id ?? "";
  state.chapterProgress =
    b && b.end > b.start
      ? Math.min(1, Math.max(0, (viewportCenter - b.start) / (b.end - b.start)))
      : 0;
  state.storyPosition = Math.min(
    1,
    Math.max(0, (idx + state.chapterProgress) / Math.max(1, chapters.length - 1))
  );

  frameListeners.forEach((fn) => fn());
  if (idx !== lastNotifiedIndex) {
    lastNotifiedIndex = idx;
    chapterListeners.forEach((fn) => fn(idx));
  }
}

function remeasure() {
  bounds = measure();
  update();
}

/**
 * Force a remeasure from outside this module, for content that changes the
 * document's height well after mount and the two deferred remeasures in
 * `acquire()` — e.g. the birthday chapter's wish text, which only exists in
 * the DOM once the candle sequence reaches its "revealed" phase. Without
 * this, every chapter boundary below that point (including the finale)
 * stays measured against the shorter, pre-reveal document for the rest of
 * the visit, which silently breaks the active-chapter tracking every seam
 * transition, the nav's finale-recede and the cosmic grading depend on.
 * A no-op before the first `acquire()`, same as a stray resize would be.
 */
export function requestSceneRemeasure(): void {
  if (refCount > 0) remeasure();
}

function acquire() {
  refCount += 1;
  if (refCount > 1) return;

  remeasure();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", remeasure);
  // Layout can still settle a tick after mount (web fonts swapping in,
  // images reflowing, GSAP's pinned sections inserting their spacers) —
  // a couple of deferred remeasures keep chapter boundaries accurate
  // without polling every frame.
  const t1 = window.setTimeout(remeasure, 500);
  const t2 = window.setTimeout(remeasure, 1800);

  teardown = () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", remeasure);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}

function release() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && teardown) {
    teardown();
    teardown = null;
  }
}

/**
 * Shared, ref-based (non-re-rendering) tracker for "how far through the
 * whole cinematic scroll are we, and which chapter currently owns the
 * viewport's center" — read every frame inside the persistent cosmic
 * `<Canvas>` (fog depth drift, the second moon, the couple model's
 * chapter-gated visibility, the letter chapter's calmer starfield) so none
 * of it fights React's render cycle. Same "mutate a ref, read it in
 * useFrame" approach as CosmicScene's original per-portal scroll tracker,
 * extended with chapter membership now that the backdrop spans the whole
 * site instead of just the portal.
 *
 * Every caller shares one listener and one state object (see above), so
 * this can be used freely from as many components as need it.
 */
export function useSceneProgress(): RefObject<SceneProgressRef> {
  const ref = useRef<SceneProgressRef>(state);

  useEffect(() => {
    acquire();
    return release;
  }, []);

  return ref;
}

/**
 * Subscribe to *every* scroll update. Intended for consumers that write
 * straight to the DOM (CSS custom properties) rather than through React
 * state — see CosmicAtmosphere. Returns an unsubscribe function.
 */
export function subscribeSceneFrame(fn: () => void): () => void {
  acquire();
  frameListeners.add(fn);
  fn();
  return () => {
    frameListeners.delete(fn);
    release();
  };
}

/**
 * React-state-safe subscription: fires only when the active chapter index
 * actually changes, so it can drive `setState` without re-rendering on
 * every scroll event.
 *
 * This is deliberately scroll-driven rather than `IntersectionObserver`-
 * driven. IntersectionObserver never fires at all in some sandboxed
 * embedding contexts, which would silently freeze the chapter nav on
 * chapter 1 forever; a plain scroll computation has no such failure mode
 * and reuses the one listener this module already owns.
 */
export function useActiveChapterIndex(): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    acquire();
    const fn = (i: number) => setIndex(i < 0 ? 0 : i);
    chapterListeners.add(fn);
    fn(state.chapterIndex);
    return () => {
      chapterListeners.delete(fn);
      release();
    };
  }, []);

  return index;
}

/** Read the live shared scene state without subscribing (callers must already hold a subscription). */
export function readSceneProgress(): SceneProgressRef {
  return state;
}

/**
 * Document-space top edge of a chapter section, or `null` before the first
 * measurement. Used by the seam transitions to locate the boundary between
 * two chapters without measuring the DOM again on every scroll event.
 */
export function chapterTop(id: string): number | null {
  const b = bounds.find((x) => x.id === id);
  return b && b.end > b.start ? b.start : null;
}

/**
 * True once scroll has reached (or passed) the named chapter. Intended for
 * effects that, once triggered, should stay revealed rather than reversing
 * if the visitor scrolls back up — callers keep their own latch (see
 * Moon.tsx's secondary moon) since this reads only the current position.
 */
export function hasReachedChapter(s: SceneProgressRef, id: string): boolean {
  const idx = chapters.findIndex((c) => c.id === id);
  return idx !== -1 && s.chapterIndex >= idx;
}

/** True while the named chapter itself currently owns the viewport center. */
export function isChapterActive(s: SceneProgressRef, id: string): boolean {
  return s.chapterId === id;
}
