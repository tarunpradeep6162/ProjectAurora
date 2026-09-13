"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useMediaQuery";
import Starfield from "@/components/Starfield";

// Gold / champagne / ivory only — deliberately not the rainbow/pink confetti
// used in the Aurora-Premium-3D sibling project, to stay inside this
// project's established candlelight palette (see globals.css --aurora-*).
const CONFETTI_COLORS = ["#d7b97a", "#c8a86a", "#f1ece3", "#ddd3c5", "#8d7147"];

/**
 * A brief, restrained gold/champagne burst timed to the wish reveal —
 * mechanism ported from the Aurora-Premium-3D sibling's
 * `app/aurora-experience.tsx` (`canvas-confetti`, fired from its own
 * "blow candle" handler), but tuned down from that project's 150-particle
 * spread into a smaller, shorter moment, and recolored into this project's
 * palette. Skipped entirely under prefers-reduced-motion.
 */
function fireWishConfetti() {
  const duration = 1400;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 3,
      startVelocity: 28,
      spread: 60,
      ticks: 90,
      gravity: 0.9,
      scalar: 0.8,
      origin: { x: 0.5, y: 0.62 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) window.requestAnimationFrame(frame);
  };
  frame();
}

const CANDLE_COUNT = 5;
const DARK_HOLD_MS = 950; // within the brief's 800-1200ms window
const STAR_RETURN_MS = 1100;

type WishPhase = "lit" | "dark" | "starlight" | "revealed";

/**
 * Chapter 7's signature micro-interaction. Primary path is a real
 * microphone "blow" detector (Web Audio API amplitude threshold); if the
 * user declines the mic permission, or the browser/environment doesn't
 * support it, the explicit "Blow Out the Candles" button is always present
 * as a first-class fallback — never a degraded afterthought.
 *
 * "The Wish" beat (brief signature moment 5): flame extinguishes, the
 * chapter holds near-total darkness for ~950ms, then a starfield gradually
 * returns before the wish text appears — a quiet breath before the
 * celebration continues into the finale. On prefers-reduced-motion the
 * dark hold and star return are skipped (a11y: no auto-playing multi-second
 * sequence forced on someone who asked for reduced motion) and the wish
 * text appears immediately.
 */
export default function CandleInteraction() {
  const [blownOut, setBlownOut] = useState(false);
  const [wishPhase, setWishPhase] = useState<WishPhase>("lit");
  const [micState, setMicState] = useState<
    "idle" | "listening" | "denied" | "unsupported"
  >("idle");
  const reduced = useReducedMotion();
  const coarsePointer = useCoarsePointer();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  async function enableMicBlow() {
    if (blownOut) return;
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

  function extinguish() {
    if (blownOut) return;
    setBlownOut(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (reduced) {
      // No forced multi-second sequence for reduced-motion users — go
      // straight to the (still real, still present) wish text.
      setWishPhase("revealed");
      return;
    }

    setWishPhase("dark");
    const t1 = window.setTimeout(() => setWishPhase("starlight"), DARK_HOLD_MS);
    const t2 = window.setTimeout(() => {
      setWishPhase("revealed");
      fireWishConfetti();
    }, DARK_HOLD_MS + STAR_RETURN_MS);
    timersRef.current.push(t1, t2);
  }

  const blowLabel = coarsePointer
    ? "Tap to Blow Out the Candles"
    : "Blow Out the Candles";

  return (
    <section
      id="birthday"
      aria-label="Chapter 7: Happy Birthday, Dheepika"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-32 text-center"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(217,167,92,0.14),transparent_65%)]"
      />

      {/* The Wish: near-total darkness, then a starfield gradually returns. */}
      <AnimatePresence>
        {(wishPhase === "dark" || wishPhase === "starlight") && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-20 bg-background-deep"
          >
            <AnimatePresence>
              {wishPhase === "starlight" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: STAR_RETURN_MS / 1000, ease: "easeIn" }}
                  className="absolute inset-0"
                >
                  <Starfield count={90} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <span className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 07
        </span>
        <h2 className="font-display text-[clamp(2rem,6vw,4rem)] leading-tight text-foreground">
          Happy Birthday, Dheepika
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-foreground-muted">
          May this new year of your life carry wonder, peace, laughter and
          all the love you deserve.
        </p>

        <div
          className="mx-auto mt-16 flex items-end justify-center gap-6"
          role="img"
          aria-label={
            blownOut
              ? "A row of birthday candles, gently extinguished"
              : "A row of five lit birthday candles"
          }
        >
          {Array.from({ length: CANDLE_COUNT }).map((_, i) => (
            <div key={i} className="relative flex flex-col items-center">
              <AnimatePresence mode="wait">
                {!blownOut ? (
                  <motion.div
                    key="flame"
                    className="mb-1 h-6 w-3 rounded-full bg-gradient-to-t from-accent via-accent-soft to-yellow-100"
                    style={{ transformOrigin: "bottom center" }}
                    animate={
                      reduced
                        ? { scaleY: 1, opacity: 1 }
                        : {
                            scaleY: [1, 1.15, 0.92, 1.08, 1],
                            scaleX: [1, 0.9, 1.05, 0.95, 1],
                            rotate: [0, -3, 2, -2, 0],
                          }
                    }
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                    }
                    exit={{
                      scale: [1, 1.4, 0],
                      opacity: [1, 1, 0],
                      transition: { duration: 0.5, ease: "easeOut" },
                    }}
                  />
                ) : (
                  <motion.div
                    key="bloom"
                    initial={{ opacity: 0.8, scale: 0.5 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="absolute bottom-8 h-6 w-6 rounded-full bg-accent-soft blur-md"
                  />
                )}
              </AnimatePresence>
              {/* A wick, then the candle. The emoji that used to sit
                  between the flame and the candle body (🕯️, swapping to 💨
                  once blown out) was the one element on the page rendered in
                  someone else's art style, and it was drawing a laugh at the
                  exact moment the chapter asks for stillness. The candles
                  are now drawn entirely from the site's own palette. */}
              <span
                aria-hidden="true"
                className="h-1.5 w-[2px] rounded-full bg-foreground-muted/50"
              />
              <div className="mt-0 h-14 w-3 rounded-sm bg-gradient-to-b from-accent-rose via-accent-rose/80 to-accent-rose/45" />
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          {!blownOut ? (
            <>
              <button
                type="button"
                onClick={extinguish}
                className="rounded-full border border-accent/60 bg-accent/10 px-8 py-3 text-xs tracking-[0.3em] uppercase text-accent-soft transition-colors hover:bg-accent/20"
              >
                {blowLabel}
              </button>
              {micState === "idle" && !coarsePointer && (
                <button
                  type="button"
                  onClick={enableMicBlow}
                  className="text-[11px] tracking-[0.2em] uppercase text-foreground-muted underline decoration-dotted underline-offset-4 hover:text-accent-soft"
                >
                  or try blowing into your microphone
                </button>
              )}
              {micState === "listening" && (
                <p className="text-[11px] tracking-[0.2em] uppercase text-accent-soft">
                  Listening for a blow&hellip;
                </p>
              )}
              {micState === "denied" && (
                <p className="text-[11px] text-foreground-muted">
                  Microphone unavailable — the button works just as well.
                </p>
              )}
              {micState === "unsupported" && (
                <p className="text-[11px] text-foreground-muted">
                  Your browser does not support microphone input here — use
                  the button above.
                </p>
              )}
            </>
          ) : (
            wishPhase === "revealed" && (
              <motion.p
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-display text-2xl italic text-accent-soft"
              >
                Make a wish. It already came true.
              </motion.p>
            )
          )}
        </div>
      </div>
    </section>
  );
}
