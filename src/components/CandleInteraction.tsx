"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";
import { useLowPowerDevice } from "@/hooks/useLowPowerDevice";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { useMotionEngineAlive } from "@/components/chapters/useMotionEngine";
import { subscribeSceneFrame, requestSceneRemeasure } from "@/components/cosmic/sceneProgress";
import { FLAME_OUT_SECONDS } from "@/components/cake/cakeMotion";
import { birthdayCard } from "@/lib/content";

// WebGL has no server render, and Three.js should only download once the
// chapter is close.
const CakeCanvas = dynamic(() => import("@/components/cake/CakeCanvas"), { ssr: false });

/** The CSS candle's flame going out. Mirrors `flame-out` in globals.css. */
const CSS_FLAME_OUT_MS = 650;
/** Tuned: the held darkness once the flame has gone (brief: 800-1200ms). */
const DARK_HOLD_MS = 950;
/** One star, then another. */
const STARS_MS = 1500;
/** The universe returning before the wish is spoken. */
const UNIVERSE_MS = 1100;

/**
 * lit       → the cake rises into the dark and its candles light one by one
 * out       → the flames flare and go out; smoke rises
 * dark      → held darkness (DARK_HOLD_MS); navigation has receded
 * stars     → one star, then another
 * universe  → the darkness lifts back into the sky
 * revealed  → the wish
 */
type Phase = "lit" | "out" | "dark" | "stars" | "universe" | "revealed";

/**
 * Where the stage is relative to the viewport: `near` latches once it is
 * within a couple of screens (time to fetch and build the cake), `visible`
 * tracks whether it is on screen right now (the canvas only renders then).
 * Polled as well as scroll-driven, because scroll events and observers do
 * not fire in every environment this site has to work in.
 */
function useStageProximity(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || 1;
      if (r.top < h * 2.5 && r.bottom > -h * 1.5) setNear(true);
      setVisible(r.top < h && r.bottom > 0);
    };
    const unsubscribe = subscribeSceneFrame(measure);
    const poll = window.setInterval(measure, 300);
    return () => {
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [ref]);

  return { near, visible };
}

/**
 * Chapter 7 — the candle.
 *
 * The birthday cake from the original Project Aurora, lit candles and all,
 * rendered in its own small canvas. Where WebGL is unavailable, the device is
 * low-powered, or frames are not being delivered, a single CSS candle takes
 * its place. Either way the control is a real `<button>` with a generous
 * target; the microphone "blow" detector stays strictly optional and is only
 * offered on precise-pointer devices.
 *
 * Every phase change is a plain `setTimeout` writing a `data-phase`
 * attribute. The story's text never waits on requestAnimationFrame and is
 * never hidden by an inline style. prefers-reduced-motion skips the whole
 * sequence and shows the wish at once.
 */
export default function CandleInteraction() {
  const root = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>("lit");
  const [micState, setMicState] = useState<
    "idle" | "listening" | "denied" | "unsupported"
  >("idle");
  const reduced = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const compact = useNarrowViewport();
  const motionAlive = useMotionEngineAlive();
  const lowPower = useLowPowerDevice();
  const stageRef = useRef<HTMLDivElement>(null);
  const cakeButtonRef = useRef<HTMLButtonElement>(null);
  const { near, visible } = useStageProximity(stageRef);
  const [cakeLost, setCakeLost] = useState(false);
  const handleCakeLost = useCallback(() => setCakeLost(true), []);
  // The 3D cake needs WebGL and a frame loop that actually delivers frames;
  // without either, the CSS candle stands in so the wish still works.
  const cake = motionAlive && !lowPower && !cakeLost;
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
      // The wish card only enters the DOM on this transition; every chapter
      // boundary after it (finale included) needs to be measured against
      // the taller document that results, not the one from mount.
      requestAnimationFrame(requestSceneRemeasure);
      return;
    }

    const html = document.documentElement;
    html.setAttribute("data-aurora-hush", "");
    setPhase("out");

    const at = (ms: number, fn: () => void) =>
      timersRef.current.push(window.setTimeout(fn, ms));

    // The cake's flames flare and die on their own curve; the darkness
    // follows the moment they are out.
    const flameOut = cake ? FLAME_OUT_SECONDS * 1000 : CSS_FLAME_OUT_MS;
    at(flameOut, () => setPhase("dark"));
    at(flameOut + DARK_HOLD_MS, () => setPhase("stars"));
    at(flameOut + DARK_HOLD_MS + STARS_MS, () => setPhase("universe"));
    at(flameOut + DARK_HOLD_MS + STARS_MS + UNIVERSE_MS, () => {
      setPhase("revealed");
      html.removeAttribute("data-aurora-hush");
      // Same reasoning as the reduced-motion branch above: the wish card's
      // text just mounted, so every chapter boundary after this point needs
      // a fresh measurement.
      requestAnimationFrame(requestSceneRemeasure);
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

      <div ref={stageRef} className="candle-stage">
        {cake ? (
          <div className="candle-cake">
            <span aria-hidden="true" className="candle__light" />
            {near && (
              <div aria-hidden="true" className="candle-cake__canvas">
                <CakeCanvas
                  phase={phase}
                  visible={visible}
                  reduced={reduced}
                  compact={compact}
                  name={birthdayCard.name}
                  eventSource={cakeButtonRef}
                  onContextLost={handleCakeLost}
                />
              </div>
            )}
            <button
              ref={cakeButtonRef}
              type="button"
              className="candle-cake__button"
              onClick={extinguish}
              aria-disabled={!lit}
              aria-label={lit ? birthdayCard.wishAction : "The candles have been blown out"}
            />
          </div>
        ) : (
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
        )}

        <div className="candle-caption" aria-live="polite">
          {lit ? (
            <>
              <p className="type-emotion candle-prompt">{birthdayCard.wishPrompt}</p>
              <p className="type-meta candle-instruction">
                {coarsePointer ? "Tap" : "Click"} to blow out{" "}
                {cake ? "the candles" : "the candle"}
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
                {birthdayCard.lines.map((line, index) => (
                  <p
                    key={line}
                    className={
                      index === 0
                        ? "type-meta"
                        : index === 1
                          ? "type-chapter"
                          : "type-emotion"
                    }
                  >
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
