import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const randomPosition = () =>
  Math.floor(Math.random() * 82) + 5;

export default function GamesPage() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] =
    useState(20);
  const [playing, setPlaying] =
    useState(false);
  const [heartPosition, setHeartPosition] =
    useState({
      left: 45,
      top: 40,
    });

  useEffect(() => {
    if (!playing || timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setPlaying(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setPlaying(true);
    setHeartPosition({
      left: randomPosition(),
      top: randomPosition(),
    });
  };

  const catchHeart = () => {
    if (!playing) return;

    setScore((current) => current + 1);

    setHeartPosition({
      left: randomPosition(),
      top: randomPosition(),
    });
  };

  return (
    <section className="experience-page">
      <motion.div
        className="experience-card games-card"
        initial={{
          opacity: 0,
          y: 35,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
        }}
      >
        <p className="experience-page__eyebrow">
          A Playful Chapter
        </p>

        <h1 className="experience-page__title">
          Catch My Heart
        </h1>

        <p className="experience-page__description">
          Catch as many hearts as possible before
          the timer reaches zero.
        </p>

        <div className="game-status">
          <div>
            <span>Hearts</span>
            <strong>{score}</strong>
          </div>

          <div>
            <span>Time</span>
            <strong>{timeLeft}s</strong>
          </div>
        </div>

        <div className="heart-game-area">
          {playing && (
            <motion.button
              key={`${heartPosition.left}-${heartPosition.top}`}
              type="button"
              className="heart-game-button"
              style={{
                left: `${heartPosition.left}%`,
                top: `${heartPosition.top}%`,
              }}
              initial={{
                opacity: 0,
                scale: 0.3,
              }}
              animate={{
                opacity: 1,
                scale: [1, 1.18, 1],
              }}
              transition={{
                duration: 0.4,
              }}
              onClick={catchHeart}
              aria-label="Catch the heart"
            >
              ♥
            </motion.button>
          )}

          {!playing && (
            <div className="heart-game-message">
              <span aria-hidden="true">♥</span>

              <h2>
                {timeLeft === 0
                  ? `You caught ${score} hearts!`
                  : "Ready to catch my heart?"}
              </h2>

              <button
                type="button"
                className="experience-button"
                onClick={startGame}
              >
                {timeLeft === 0
                  ? "Play Again"
                  : "Start Game"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
