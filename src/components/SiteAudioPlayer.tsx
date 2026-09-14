"use client";

import { useEffect, useRef, useState } from "react";
import { chapters } from "@/lib/content";
import { useActiveChapterIndex } from "@/components/cosmic/sceneProgress";
import { setSiteAudioOn } from "@/lib/audioPreference";

const AUDIO_PREF_KEY = "aurora-audio-on";
const BASE_VOLUME = 0.35;
const LETTER_VOLUME = 0.12; // quieter during the letter, per the brief
const VOLUME_RAMP_MS = 900;
const RAMP_STEP_MS = 40;

const LETTER_INDEX = chapters.findIndex((c) => c.id === "letter");

/**
 * Lightweight custom audio player for the site's background track.
 * Browsers block unmuted autoplay, so playback always starts from an
 * explicit user gesture on this control — never forced. The on/off choice
 * is remembered in localStorage: on return visits we attempt to resume
 * playback, but browsers may still block it; that failure is caught
 * silently and simply leaves the control paused, exactly like a first visit.
 *
 * While the Letter chapter owns the screen the volume ramps down (the brief
 * asks for the whole site to go quieter there) and back up afterwards.
 * The active chapter comes from the shared scroll store rather than an
 * IntersectionObserver, and the ramp runs on a plain interval rather than
 * requestAnimationFrame — both keep working in contexts where those
 * callback APIs never fire (a backgrounded tab, a sandboxed webview).
 */
export default function SiteAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const rampRef = useRef<number | null>(null);
  const activeIndex = useActiveChapterIndex();

  // The birthday chime (birthdayChime.ts) reads this to decide whether it
  // may make any sound at all — it should never speak up on its own if the
  // visitor chose the site quiet.
  useEffect(() => {
    setSiteAudioOn(playing);
  }, [playing]);

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
        .then(() => setPlaying(true))
        .catch(() => {
          // Autoplay blocked — stay paused, exactly like a fresh visit.
        });
    }

    return () => audio.removeEventListener("ended", onEnd);
  }, []);

  // Ramp volume down while the Letter is on screen, back up elsewhere.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = activeIndex === LETTER_INDEX ? LETTER_VOLUME : BASE_VOLUME;
    if (Math.abs(audio.volume - target) < 0.005) return;

    if (rampRef.current !== null) window.clearInterval(rampRef.current);
    const start = audio.volume;
    const startTime = performance.now();
    rampRef.current = window.setInterval(() => {
      const el = audioRef.current;
      if (!el) return;
      const t = Math.min(1, (performance.now() - startTime) / VOLUME_RAMP_MS);
      el.volume = start + (target - start) * t;
      if (t >= 1 && rampRef.current !== null) {
        window.clearInterval(rampRef.current);
        rampRef.current = null;
      }
    }, RAMP_STEP_MS);

    return () => {
      if (rampRef.current !== null) window.clearInterval(rampRef.current);
      rampRef.current = null;
    };
  }, [activeIndex]);

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
    <div className="chrome-recede fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 sm:right-6 sm:bottom-6">
      <audio ref={audioRef} src="/audio/birthday.mp3" loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mute our song" : "Play our song"}
        className="group chrome-button gap-0"
      >
        <span
          aria-hidden="true"
          className={`inline-flex h-3 w-3 items-end gap-[2px] ${playing ? "" : "opacity-50"}`}
        >
          <span
            className={`w-px bg-accent-soft ${
              playing ? "animate-[eq_0.9s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "70%" : "40%" }}
          />
          <span
            className={`w-px bg-accent-soft ${
              playing ? "animate-[eq_1.2s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "100%" : "60%" }}
          />
          <span
            className={`w-px bg-accent-soft ${
              playing ? "animate-[eq_0.7s_ease-in-out_infinite]" : ""
            }`}
            style={{ height: playing ? "55%" : "30%" }}
          />
        </span>
        {/* Text label: desktop only, revealed on hover/focus so the resting
            control stays a small, unobtrusive mark. */}
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[6rem] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[6rem] group-focus-visible:opacity-100 sm:inline-block">
          Our Song
        </span>
      </button>
    </div>
  );
}
