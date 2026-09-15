"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeSceneFrame, readSceneProgress } from "@/components/cosmic/sceneProgress";
import { setSiteAudioOn } from "@/lib/audioPreference";

const AUDIO_PREF_KEY = "aurora-audio-on";
const BASE_VOLUME = 0.35;
const LETTER_VOLUME = 0.12; // quieter during the letter, per the brief

// Sound bridge: the hush leads the visual "Gravity Moment" rather than
// snapping only once the Letter chapter's own boundary is crossed — the
// same chapterProgress window StoryCarousel.tsx's own convergence uses
// (its ring pulls inward starting at 0.82), so the score is already most
// of the way to the Letter's quiet by the time the scene actually cuts.
const BRIDGE_START = 0.82;
const BRIDGE_END = 0.98;

/**
 * Lightweight custom audio player for the site's background track.
 * Browsers block unmuted autoplay, so playback always starts from an
 * explicit user gesture on this control — never forced. The on/off choice
 * is remembered in localStorage: on return visits we attempt to resume
 * playback, but browsers may still block it; that failure is caught
 * silently and simply leaves the control paused, exactly like a first visit.
 *
 * Volume is driven continuously off the shared scroll signal
 * (`subscribeSceneFrame`, the same convention CosmicAtmosphere.tsx already
 * uses for its own CSS custom properties) rather than a discrete "chapter
 * index changed" effect with its own separate tween — one continuous
 * system, and it's what makes the sound bridge above possible at all: a
 * step function has no in-between value to lead the visual with.
 * Exponential smoothing toward the target each scroll tick gives the same
 * "glides, never snaps" feel every other scrubbed value on this site
 * already has, without a second requestAnimationFrame/setInterval loop.
 */
export default function SiteAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

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

  // Continuous volume: quiet for the Letter, base everywhere else, with a
  // smoothstepped bridge leading into the Letter from Story's own closing
  // stretch rather than a hard cut at the chapter boundary.
  useEffect(() => {
    return subscribeSceneFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      const progress = readSceneProgress();
      let target = BASE_VOLUME;
      if (progress.chapterId === "letter") {
        target = LETTER_VOLUME;
      } else if (progress.chapterId === "story") {
        const t = Math.min(
          1,
          Math.max(0, (progress.chapterProgress - BRIDGE_START) / (BRIDGE_END - BRIDGE_START))
        );
        const eased = t * t * (3 - 2 * t);
        target = BASE_VOLUME + (LETTER_VOLUME - BASE_VOLUME) * eased;
      }
      el.volume += (target - el.volume) * 0.08;
    });
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
