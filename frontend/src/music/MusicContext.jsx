import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MusicContext = createContext(null);

export function formatTime(seconds = 0) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export function MusicProvider({
  children,
  defaultSrc = "",
}) {
  const audioRef = useRef(null);

  const [currentSrc, setCurrentSrc] =
    useState(defaultSrc);
  const [playing, setPlaying] =
    useState(false);
  const [volume, setVolumeState] =
    useState(0.65);
  const [muted, setMuted] =
    useState(false);
  const [currentTime, setCurrentTime] =
    useState(0);
  const [duration, setDuration] =
    useState(0);
  const [isLoading, setIsLoading] =
    useState(false);
  const [error, setError] =
    useState(null);

  useEffect(() => {
    const audio = new Audio();

    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = volume;
    audio.muted = muted;

    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(
        Number.isFinite(audio.duration)
          ? audio.duration
          : 0
      );
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlaying = () => {
      setPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      const mediaError = audio.error;

      setError(
        mediaError
          ? `Audio error code: ${mediaError.code}`
          : "The song could not be loaded."
      );

      setPlaying(false);
      setIsLoading(false);
    };

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );
    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );
    audio.addEventListener(
      "playing",
      handlePlaying
    );
    audio.addEventListener(
      "pause",
      handlePause
    );
    audio.addEventListener(
      "waiting",
      handleWaiting
    );
    audio.addEventListener(
      "canplay",
      handleCanPlay
    );
    audio.addEventListener(
      "ended",
      handleEnded
    );
    audio.addEventListener(
      "error",
      handleError
    );

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );
      audio.removeEventListener(
        "playing",
        handlePlaying
      );
      audio.removeEventListener(
        "pause",
        handlePause
      );
      audio.removeEventListener(
        "waiting",
        handleWaiting
      );
      audio.removeEventListener(
        "canplay",
        handleCanPlay
      );
      audio.removeEventListener(
        "ended",
        handleEnded
      );
      audio.removeEventListener(
        "error",
        handleError
      );

      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentSrc) {
      return;
    }

    audio.pause();
    audio.src = currentSrc;
    audio.load();

    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setError(null);
    setIsLoading(false);
  }, [currentSrc]);

  const play = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !currentSrc) {
      setError("No music file has been selected.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await audio.play();
    } catch (playbackError) {
      console.error(
        "Music playback failed:",
        playbackError
      );

      setError(
        playbackError?.name === "NotAllowedError"
          ? "Tap play once to allow music in your browser."
          : "The song could not be played."
      );

      setPlaying(false);
      setIsLoading(false);
    }
  }, [currentSrc]);

  const pause = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, pause, play]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(time)) {
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(
        time,
        Number.isFinite(audio.duration)
          ? audio.duration
          : time
      )
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const setVolume = useCallback(
    (newVolume) => {
      const nextVolume = Math.max(
        0,
        Math.min(1, Number(newVolume))
      );

      const audio = audioRef.current;

      if (audio) {
        audio.volume = nextVolume;

        if (nextVolume > 0) {
          audio.muted = false;
        }
      }

      setVolumeState(nextVolume);

      if (nextVolume > 0) {
        setMuted(false);
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextMuted = !muted;

    audio.muted = nextMuted;
    setMuted(nextMuted);
  }, [muted]);

  const loadTrack = useCallback((src) => {
    setCurrentSrc(src);
  }, []);

  return (
    <MusicContext.Provider
      value={{
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
        formatTime,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error(
      "useMusic must be used within a MusicProvider"
    );
  }

  return context;
}
