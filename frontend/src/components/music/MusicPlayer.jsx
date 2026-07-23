import {
  useEffect,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  FaHeart,
  FaPause,
  FaPlay,
  FaVolumeMute,
  FaVolumeUp,
} from "react-icons/fa";

import { useMusic } from "../../music/MusicContext";
import albumCover from "../../assets/images/album.jpg";
import Equalizer from "./Equalizer";

function MusicPlayer() {
  const {
    playing,
    toggle,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    muted,
    toggleMute,
    isLoading,
    error,
    formatTime,
  } = useMusic();

  const [expanded, setExpanded] =
    useState(true);

  const progress =
    duration > 0
      ? Math.min(
          100,
          (currentTime / duration) * 100
        )
      : 0;

  useEffect(() => {
    if (!playing || !expanded) {
      return undefined;
    }

    const minimizeTimer = window.setTimeout(
      () => {
        setExpanded(false);
      },
      5000
    );

    return () => {
      window.clearTimeout(minimizeTimer);
    };
  }, [playing, expanded]);

  return (
    <div className="romantic-player">
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.button
            key="mini-player"
            type="button"
            className={`romantic-player__mini ${
              playing ? "is-playing" : ""
            }`}
            initial={{
              opacity: 0,
              scale: 0.6,
              rotate: -15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.75,
            }}
            whileHover={{
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.92,
            }}
            onClick={() =>
              setExpanded(true)
            }
            aria-label="Open music player"
          >
            <span
              className="romantic-player__mini-glow"
              aria-hidden="true"
            />

            <FaHeart aria-hidden="true" />

            {playing && (
              <span
                className="romantic-player__mini-note"
                aria-hidden="true"
              >
                ♪
              </span>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="expanded-player"
            className="romantic-player__card"
            initial={{
              opacity: 0,
              y: 35,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.94,
            }}
            transition={{
              duration: 0.35,
              ease: "easeOut",
            }}
          >
            <div
              className="romantic-player__ambient"
              aria-hidden="true"
            />

            <button
              type="button"
              className="romantic-player__minimize"
              onClick={() =>
                setExpanded(false)
              }
              aria-label="Minimize music player"
            >
              —
            </button>

            <div className="romantic-player__main">
              <div className="romantic-player__art-wrapper">
                <motion.div
                  className="romantic-player__art"
                  animate={{
                    rotate: playing ? 360 : 0,
                  }}
                  transition={{
                    duration: 8,
                    repeat: playing
                      ? Infinity
                      : 0,
                    ease: "linear",
                  }}
                >
                  <img
                    src={albumCover}
                    alt="Our song album cover"
                  />

                  <span
                    className="romantic-player__vinyl-center"
                    aria-hidden="true"
                  />
                </motion.div>

                {playing && (
                  <span
                    className="romantic-player__art-ring"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="romantic-player__details">
                <p className="romantic-player__eyebrow">
                  Playing our song
                </p>

                <h3>Happy Birthday</h3>

                <p className="romantic-player__subtitle">
                  For every memory we share ❤️
                </p>

                <div className="romantic-player__equalizer">
                  <Equalizer
                    playing={playing}
                  />

                  <span>
                    {playing
                      ? "Our forever song"
                      : "Tap play to begin"}
                  </span>
                </div>
              </div>

              <motion.button
                type="button"
                className="romantic-player__play"
                onClick={toggle}
                disabled={isLoading}
                whileHover={{
                  scale: 1.07,
                }}
                whileTap={{
                  scale: 0.9,
                }}
                aria-label={
                  playing
                    ? "Pause music"
                    : "Play music"
                }
              >
                {isLoading ? (
                  <span className="romantic-player__spinner" />
                ) : playing ? (
                  <FaPause aria-hidden="true" />
                ) : (
                  <FaPlay aria-hidden="true" />
                )}
              </motion.button>
            </div>

            <div className="romantic-player__progress-row">
              <span>
                {formatTime(currentTime)}
              </span>

              <div className="romantic-player__progress">
                <div
                  className="romantic-player__progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />

                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={(event) =>
                    seek(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  aria-label="Song progress"
                />
              </div>

              <span>
                {formatTime(duration)}
              </span>
            </div>

            <div className="romantic-player__footer">
              <button
                type="button"
                className="romantic-player__volume-button"
                onClick={toggleMute}
                aria-label={
                  muted
                    ? "Unmute music"
                    : "Mute music"
                }
              >
                {muted || volume === 0 ? (
                  <FaVolumeMute />
                ) : (
                  <FaVolumeUp />
                )}
              </button>

              <input
                className="romantic-player__volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={
                  muted ? 0 : volume
                }
                onChange={(event) =>
                  setVolume(
                    Number(
                      event.target.value
                    )
                  )
                }
                aria-label="Music volume"
              />

              <span className="romantic-player__dedication">
                With all my love
                <FaHeart aria-hidden="true" />
              </span>
            </div>

            {error && (
              <p
                className="romantic-player__error"
                role="alert"
              >
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MusicPlayer;
