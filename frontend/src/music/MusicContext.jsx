import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const MusicContext = createContext(null);

// Helper for formatting time (e.g., 01:28 / 03:45)
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export function MusicProvider({ children, defaultSrc = "" }) {
  const audioRef = useRef(null);

  // Playback States
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(defaultSrc);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the audio element once on mount
  useEffect(() => {
    const audio = new Audio(currentSrc);
    audio.volume = volume;
    audio.loop = true;          // Enabled looping for continuous background music
    audio.preload = "auto";     // Enabled preload to reduce playback delay
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setPlaying(true);
    };
    const handleEnded = () => setPlaying(false);
    const handleError = (e) => {
      setError(e);
      setIsLoading(false);
      setPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  // Handle source changes dynamically
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSrc) return;

    const wasPlaying = playing;
    audio.src = currentSrc;
    setCurrentTime(0);
    setError(null);

    if (wasPlaying) {
      audio.play().catch((err) => {
        setError(err);
        setPlaying(false);
      });
    }
  }, [currentSrc]);

  // Premium Control Methods (prepared for smooth fade-in integration later)
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setIsLoading(true);
      await audio.play();
      setPlaying(true);
    } catch (err) {
      setError(err);
      setPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, play, pause]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((newVolume) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clamped;
    }
    setVolumeState(clamped);
    if (clamped > 0 && muted) setMuted(false);
  }, [muted]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      audio.volume = volume;
      setMuted(false);
    } else {
      audio.volume = 0;
      setMuted(true);
    }
  }, [muted, volume]);

  const loadTrack = useCallback((src) => {
    setCurrentSrc(src);
  }, []);

  const value = {
    audioRef,
    playing,
    volume,
    muted,
    currentTime,
    duration,
    currentSrc,
    isLoading,
    error,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    toggleMute,
    loadTrack,
    formatTime, // Exported helper for formatting time UI strings
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
