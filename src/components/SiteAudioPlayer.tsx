"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_PREF_KEY = "aurora-audio-on";
const BASE_VOLUME = 0.35;
const LETTER_VOLUME = 0.12; // quieter during the letter, per the brief
const VOLUME_RAMP_MS = 900;

/**
 * Lightweight custom audio player for the site's background track.
 * Browsers block unmuted autoplay, so playback always starts from an
 * explicit user gesture on this control — never forced. The on/off choice
 * is remembered in localStorage: on return visits we attempt to resume
 * playback from the same effective "user already opted in" gesture-chain,
 * but browsers may still block it (private windows, a stricter autoplay
 * policy, etc.) — that failure is caught silently and simply leaves the
 * control in its paused state, exactly like a first visit.
 *
 * While the Letter chapter is on screen the volume ramps down (the brief
 * asks for the whole site to go quieter there); it ramps back up once the
 * Birthday/candle chapter is reached. A simple `audio.volume` tween is used
 * rather than the Web Audio API — the API is reserved for the candle's mic
 * "blow" detector, which is the one place this project actually needs it.
 */
export default function SiteAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const rampRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = BASE_VOLUME;
    const onEnd = () => setPlaying(false);
    audio.addEventListener("ended", onEnd);

    let storedPref: string | null = null;
    try {
      storedPref = window.localStorage.getItem(AUDIO_PREF_KEY);
    } catch {
      // ignore
    }
    if (storedPref === "1") {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setReady(true);
        })
        .catch(() => {
          // Autoplay blocked — stay paused, exactly like a fresh visit.
        });
    }

    return () => audio.removeEventListener("ended", onEnd);
  }, []);

  // Ramp volume down while the Letter is in view, back up for Birthday.
  useEffect(() => {
    const audio = audioRef.current;
    const letterEl = document.getElementById("letter");
    const birthdayEl = document.getElementById("birthday");
    if (!audio || (!letterEl && !birthdayEl)) return;

    function rampTo(target: number) {
      if (rampRef.current) cancelAnimationFrame(rampRef.current);
      const el = audioRef.current;
      if (!el) return;
      const start = el.volume;
      const startTime = performance.now();
      const step = (now: number) => {
        const el2 = audioRef.current;
        if (!el2) return;
        const t = Math.min(1, (now - startTime) / VOLUME_RAMP_MS);
        el2.volume = start + (target - start) * t;
        if (t < 1) {
          rampRef.current = requestAnimationFrame(step);
        }
      };
      rampRef.current = requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === letterEl) {
            rampTo(entry.isIntersecting ? LETTER_VOLUME : BASE_VOLUME);
          } else if (entry.target === birthdayEl) {
            if (entry.isIntersecting) rampTo(BASE_VOLUME);
          }
        });
      },
      { threshold: 0.4 }
    );

    if (letterEl) observer.observe(letterEl);
    if (birthdayEl) observer.observe(birthdayEl);

    return () => {
      observer.disconnect();
      if (rampRef.current) cancelAnimationFrame(rampRef.current);
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
        try {
          window.localStorage.setItem(AUDIO_PREF_KEY, "0");
        } catch {
          // ignore
        }
      } else {
        await audio.play();
        setPlaying(true);
        setReady(true);
        try {
          window.localStorage.setItem(AUDIO_PREF_KEY, "1");
        } catch {
          // ignore
        }
      }
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50">
      <audio ref={audioRef} src="/audio/birthday.mp3" loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mute our song" : "Play our song"}
        className="group flex items-center gap-2 rounded-full border border-line bg-background-deep/70 px-3 py-2 sm:px-4 text-[11px] tracking-[0.18em] uppercase text-foreground-muted backdrop-blur-sm hover:text-accent-soft hover:border-accent transition-colors"
      >
        <span
          aria-hidden="true"
          className={`inline-flex items-end gap-[2px] h-3 w-3 ${playing ? "" : "opacity-50"}`}
        >
          <span
            className={`w-[2px] bg-accent-soft rounded-full ${
              playing ? "animate-[eq_0.9s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "70%" : "40%" }}
          />
          <span
            className={`w-[2px] bg-accent-soft rounded-full ${
              playing ? "animate-[eq_1.2s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "100%" : "60%" }}
          />
          <span
            className={`w-[2px] bg-accent-soft rounded-full ${
              playing ? "animate-[eq_0.7s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "55%" : "30%" }}
          />
        </span>
        {/* Text label: desktop-only, revealed on hover/focus so the resting
            control stays a small unobtrusive icon (icon-only on mobile,
            where hover doesn't exist anyway). */}
        <span
          className="hidden sm:inline-block max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100"
        >
          {playing ? "Our Song" : ready ? "Play" : "Our Song"}
        </span>
      </button>
    </div>
  );
}
