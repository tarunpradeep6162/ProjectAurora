"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useMediaQuery";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { birthdayCard } from "@/lib/content";

/** The flame bending, shrinking, flickering and going out. Mirrors `flame-out` in globals.css. */
const FLAME_OUT_MS = 650;
/** Tuned: the held darkness once the flame has gone (brief: 800-1200ms). */
const DARK_HOLD_MS = 950;
/** One star, then another. */
const STARS_MS = 1500;
/** The universe returning before the wish is spoken. */
const UNIVERSE_MS = 1100;

/**
 * lit       → a single real-looking candle, near-black around it
 * out       → the flame bends, shrinks, flickers and goes out; a thread of smoke
 * dark      → held darkness (DARK_HOLD_MS); navigation has receded
 * stars     → one star, then another
 * universe  → the darkness lifts back into the sky
 * revealed  → the wish
 */
type Phase = "lit" | "out" | "dark" | "stars" | "universe" | "revealed";

/**
 * Chapter 7 — the candle.
 *
 * Physically plain: near-black, one candle, its own soft warm falloff and a
 * tiny instruction. Tapping or clicking the candle is the primary action
 * (it is a real `<button>` with a generous target); the microphone "blow"
 * detector stays strictly optional and is only offered on precise-pointer
 * devices, exactly as before.
 *
 * Every phase change is a plain `setTimeout` writing a `data-phase`
 * attribute; all motion is CSS. Nothing waits on requestAnimationFrame, and
 * no text is ever hidden by an inline style. prefers-reduced-motion skips
 * the whole sequence and shows the wish at once.
 */
export default function CandleInteraction() {
  const root = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("lit");
  const [micState, setMicState] = useState<
    "idle" | "listening" | "denied" | "unsupported"
  >("idle");
  const reduced = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const blownRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  useInViewReveal(root);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      timers.forEach((t) => window.clearTimeout(t));
      document.documentElement.removeAttribute("data-aurora-hush");
    };
  }, []);

  function stopMic() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function extinguish() {
    if (blownRef.current) return;
    blownRef.current = true;
    stopMic();

    if (reduced) {
      setPhase("revealed");
      return;
    }

    const html = document.documentElement;
    html.setAttribute("data-aurora-hush", "");
    setPhase("out");

    const at = (ms: number, fn: () => void) =>
      timersRef.current.push(window.setTimeout(fn, ms));

    at(FLAME_OUT_MS, () => setPhase("dark"));
    at(FLAME_OUT_MS + DARK_HOLD_MS, () => setPhase("stars"));
    at(FLAME_OUT_MS + DARK_HOLD_MS + STARS_MS, () => setPhase("universe"));
    at(FLAME_OUT_MS + DARK_HOLD_MS + STARS_MS + UNIVERSE_MS, () => {
      setPhase("revealed");
      html.removeAttribute("data-aurora-hush");
    });
  }

  async function enableMicBlow() {
    if (blownRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      setMicState("listening");

      const check = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 42) {
          extinguish();
          return;
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
    } catch {
      setMicState("denied");
    }
  }

  const lit = phase === "lit";
  const darkened = phase === "out" || phase === "dark" || phase === "stars";

  return (
    <section
      ref={root}
      id="birthday"
      aria-labelledby="birthday-title"
      data-phase={phase}
      className="candle-chapter"
    >
      <div aria-hidden="true" className="candle-room" />

      {/* The held darkness, and the two stars that come back first. Fixed to
          the viewport so the whole frame goes dark, not just this section. */}
      <div
        aria-hidden="true"
        className="wish-veil"
        data-active={darkened ? "" : undefined}
      >
        <span className="wish-star wish-star--one" />
        <span className="wish-star wish-star--two" />
      </div>

      <header className="candle-header">
        <p className="type-meta" data-reveal="fade">
          Chapter 07
        </p>
        <h2 id="birthday-title" className="type-chapter mt-5" data-reveal="mask">
          <span className="reveal-line">Happy Birthday, Dheepika</span>
        </h2>
        <p className="type-emotion mx-auto mt-5 max-w-[30rem]" data-reveal="fade">
          May this new year of your life carry wonder, peace, laughter and all
          the love you deserve.
        </p>
      </header>

      <div className="candle-stage">
        <button
          type="button"
          className="candle"
          onClick={extinguish}
          // aria-disabled rather than disabled: a disabled button drops
          // keyboard focus to <body> the moment the flame goes out.
          aria-disabled={!lit}
          aria-label={
            lit ? "Blow out the candle" : "The candle has been blown out"
          }
        >
          <span aria-hidden="true" className="candle__light" />
          <span aria-hidden="true" className="candle__flame">
            <span className="candle__flame-shape">
              <span className="candle__flame-edge" />
              <span className="candle__flame-body" />
              <span className="candle__flame-core" />
              <span className="candle__flame-base" />
            </span>
          </span>
          {!lit && (
            <svg
              aria-hidden="true"
              className="candle__smoke"
              viewBox="0 0 40 150"
              fill="none"
            >
              <path
                d="M20 150 C 17 132, 25 122, 20 106 S 12 80, 21 62 S 29 30, 18 0"
                stroke="rgba(214, 206, 196, 0.5)"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          )}
          <span aria-hidden="true" className="candle__wick" />
          <span aria-hidden="true" className="candle__wax" />
        </button>

        <div className="candle-caption" aria-live="polite">
          {lit ? (
            <>
              <p className="type-emotion candle-prompt">{birthdayCard.wishPrompt}</p>
              <p className="type-meta candle-instruction">
                {coarsePointer ? "Tap to blow out the candle" : "Click to blow out the candle"}
              </p>
              {micState === "idle" && !coarsePointer && (
                <button type="button" onClick={enableMicBlow} className="btn-quiet">
                  or blow into your microphone
                </button>
              )}
              {micState === "listening" && (
                <p className="type-meta candle-instruction">Listening&hellip;</p>
              )}
              {micState === "denied" && (
                <p className="type-meta candle-instruction">
                  Microphone unavailable — a tap works just as well.
                </p>
              )}
              {micState === "unsupported" && (
                <p className="type-meta candle-instruction">
                  No microphone here — a tap works just as well.
                </p>
              )}
            </>
          ) : (
            phase === "revealed" && (
              <div className="candle-wish candle-card">
                {birthdayCard.lines.map((line) => (
                  <p key={line} className="type-emotion">
                    {line}
                  </p>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
