"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { chapters, hiddenMessages } from "@/lib/content";

/* ------------------------------------------------------------------------
   Found-state store, shared by the stars and the chapters panel
   ------------------------------------------------------------------------ */

const found = new Set<number>();
const EMPTY: readonly number[] = [];
let snapshot: readonly number[] = EMPTY;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function markMessageFound(index: number) {
  if (found.has(index)) return;
  found.add(index);
  snapshot = [...found].sort((a, b) => a - b);
  listeners.forEach((listener) => listener());
}

/** Indices of the hidden messages found so far this visit. */
export function useFoundMessages(): readonly number[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY
  );
}

/* ------------------------------------------------------------------------
   Stars
   ------------------------------------------------------------------------ */

/** Chapter index a message belongs to: one per chapter, in order. */
function chapterIndexFor(position: number) {
  return Math.min(chapters.length - 1, Math.floor(position * chapters.length));
}

function HiddenStar({ index, target }: { index: number; target: HTMLElement }) {
  const { position, side, message } = hiddenMessages[index];
  const [open, setOpen] = useState(false);
  const messageId = useId();
  const foundList = useFoundMessages();

  // Where the message sat within its chapter on the original site.
  const within = position * chapters.length - chapterIndexFor(position);
  const top = Math.min(0.88, Math.max(0.12, within));

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return createPortal(
    <div
      className="hidden-star"
      data-side={side}
      data-found={foundList.includes(index) ? "" : undefined}
      style={{ top: `${top * 100}%`, "--star-index": index } as React.CSSProperties}
    >
      <button
        type="button"
        className="hidden-star__button"
        aria-expanded={open}
        aria-controls={messageId}
        aria-label={`Hidden message ${index + 1} of ${hiddenMessages.length}`}
        onClick={() => {
          setOpen((v) => !v);
          markMessageFound(index);
        }}
      >
        <span aria-hidden="true" className="hidden-star__point" />
      </button>
      <p id={messageId} className="hidden-star__message type-story" hidden={!open}>
        {message}
      </p>
    </div>,
    target
  );
}

/**
 * Tarun's eight hidden messages, restored from the original site where they
 * were stars to find along the journey. Each sits in the margin of its own
 * chapter, on the side it was placed originally, as a faint point of light
 * that opens its message when tapped. They are the same messages the
 * chapters panel lists, so nobody has to find a star to read them.
 *
 * Deliberately independent of requestAnimationFrame, IntersectionObserver
 * and scroll events: placement is plain CSS inside each chapter section, and
 * revealing is a click. The candle chapter's star waits for the wish.
 */
export default function HiddenMessages() {
  const [targets, setTargets] = useState<(HTMLElement | null)[] | null>(null);

  useEffect(() => {
    // Deferred a tick: the chapter sections are the portal targets.
    const id = window.setTimeout(() => {
      setTargets(
        hiddenMessages.map((m) =>
          document.getElementById(chapters[chapterIndexFor(m.position)].id)
        )
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!targets) return null;
  return (
    <>
      {targets.map((target, i) =>
        target ? <HiddenStar key={i} index={i} target={target} /> : null
      )}
    </>
  );
}
