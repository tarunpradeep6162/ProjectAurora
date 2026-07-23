import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useMemo, useRef } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

const constellationStars = [
  { id: 1, x: 8, y: 43, size: 4 },
  { id: 2, x: 17, y: 27, size: 6 },
  { id: 3, x: 29, y: 38, size: 4 },
  { id: 4, x: 40, y: 20, size: 7 },
  { id: 5, x: 51, y: 36, size: 4 },
  { id: 6, x: 63, y: 19, size: 6 },
  { id: 7, x: 74, y: 34, size: 4 },
  { id: 8, x: 86, y: 24, size: 7 },
  { id: 9, x: 93, y: 43, size: 4 },
  { id: 10, x: 79, y: 55, size: 5 },
  { id: 11, x: 64, y: 48, size: 4 },
  { id: 12, x: 50, y: 58, size: 6 },
  { id: 13, x: 36, y: 50, size: 4 },
  { id: 14, x: 22, y: 57, size: 5 },
];

const constellationLines = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 13],
  [13, 14],
  [14, 1],
  [3, 13],
  [5, 12],
  [7, 11],
];

const ambientStars = Array.from(
  { length: 54 },
  (_, index) => ({
    id: index,
    left: `${3 + ((index * 37) % 94)}%`,
    top: `${4 + ((index * 53) % 90)}%`,
    size: 1 + (index % 4),
    delay: (index % 11) * 0.32,
    duration: 2.8 + (index % 6) * 0.7,
  }),
);

const fireflies = Array.from(
  { length: 18 },
  (_, index) => ({
    id: index,
    left: `${5 + ((index * 41) % 88)}%`,
    top: `${20 + ((index * 29) % 66)}%`,
    x: index % 2 === 0 ? 34 : -34,
    y: index % 3 === 0 ? -42 : -24,
    delay: (index % 8) * 0.5,
    duration: 5 + (index % 6) * 0.8,
    size: 3 + (index % 4),
  }),
);

const shootingStars = [
  {
    id: 1,
    top: "18%",
    left: "12%",
    delay: 0.8,
    duration: 1.4,
  },
  {
    id: 2,
    top: "33%",
    left: "52%",
    delay: 4.6,
    duration: 1.65,
  },
  {
    id: 3,
    top: "12%",
    left: "69%",
    delay: 8.4,
    duration: 1.45,
  },
];

function UniverseEndingSection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const cameraScale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1.08, 1, 0.94],
  );

  const cameraOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.82, 1],
    [0.15, 1, 1, 0.55],
  );

  const starMap = useMemo(
    () =>
      Object.fromEntries(
        constellationStars.map((star) => [
          star.id,
          star,
        ]),
      ),
    [],
  );

  const replayStory = () => {
    const hero =
      document.getElementById("hero") ||
      document.querySelector("main");

    if (hero) {
      hero.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      return;
    }

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      id="universe-ending"
      className="universe-ending"
      aria-labelledby="universe-ending-title"
    >
      <motion.div
        className="universe-ending__camera"
        style={
          reduceMotion
            ? undefined
            : {
                scale: cameraScale,
                opacity: cameraOpacity,
              }
        }
      >
        <div
          className="universe-ending__background"
          aria-hidden="true"
        >
          <motion.span
            className="universe-ending__nebula universe-ending__nebula--one"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [0, 55, 0],
                    y: [0, -35, 0],
                    scale: [1, 1.13, 1],
                  }
            }
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.span
            className="universe-ending__nebula universe-ending__nebula--two"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [0, -45, 0],
                    y: [0, 42, 0],
                    scale: [1, 1.09, 1],
                  }
            }
            transition={{
              duration: 21,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <span className="universe-ending__vignette" />

          {ambientStars.map((star) => (
            <motion.span
              key={star.id}
              className="universe-ending__ambient-star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.12, 0.9, 0.12],
                      scale: [0.7, 1.6, 0.7],
                    }
              }
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {fireflies.map((firefly) => (
            <motion.span
              key={firefly.id}
              className="universe-ending__firefly"
              style={{
                left: firefly.left,
                top: firefly.top,
                width: firefly.size,
                height: firefly.size,
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      x: [
                        0,
                        firefly.x,
                        firefly.x * -0.45,
                        0,
                      ],
                      y: [
                        0,
                        firefly.y,
                        firefly.y * 0.4,
                        0,
                      ],
                      opacity: [
                        0.15,
                        0.95,
                        0.35,
                        0.15,
                      ],
                      scale: [0.8, 1.45, 1, 0.8],
                    }
              }
              transition={{
                duration: firefly.duration,
                delay: firefly.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {shootingStars.map((star) => (
            <motion.span
              key={star.id}
              className="universe-ending__shooting-star"
              style={{
                top: star.top,
                left: star.left,
              }}
              initial={{
                opacity: 0,
                x: -120,
                y: -70,
              }}
              whileInView={
                reduceMotion
                  ? {
                      opacity: 0,
                    }
                  : {
                      opacity: [0, 1, 1, 0],
                      x: [-120, 560],
                      y: [-70, 250],
                    }
              }
              viewport={{
                once: false,
                amount: 0.1,
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                repeatDelay: 10,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <div className="universe-ending__inner">
          <motion.header
            className="universe-ending__header"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 45,
                    filter: "blur(12px)",
                  }
            }
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.4,
            }}
            transition={{
              duration: 1.1,
              ease: cinematicEase,
            }}
          >
            <span className="universe-ending__index">
              07
            </span>

            <div>
              <p className="eyebrow">
                The epilogue · The sky remembers
              </p>

              <h2
                id="universe-ending-title"
                className="universe-ending__title"
              >
                Every memory became a
                <em> star in my universe.</em>
              </h2>
            </div>
          </motion.header>

          <motion.div
            className="constellation-scene"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    scale: 0.92,
                    filter: "blur(18px)",
                  }
            }
            whileInView={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.25,
            }}
            transition={{
              duration: 1.4,
              ease: cinematicEase,
            }}
          >
            <svg
              className="constellation-scene__lines"
              viewBox="0 0 100 70"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {constellationLines.map(
                ([startId, endId], index) => {
                  const start = starMap[startId];
                  const end = starMap[endId];

                  return (
                    <motion.line
                      key={`${startId}-${endId}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      initial={{
                        pathLength: 0,
                        opacity: 0,
                      }}
                      whileInView={{
                        pathLength: 1,
                        opacity: 0.62,
                      }}
                      viewport={{
                        once: true,
                        amount: 0.25,
                      }}
                      transition={{
                        duration: 1.1,
                        delay: 0.45 + index * 0.08,
                        ease: "easeInOut",
                      }}
                    />
                  );
                },
              )}
            </svg>

            {constellationStars.map(
              (star, index) => (
                <motion.span
                  key={star.id}
                  className="constellation-scene__star"
                  style={{
                    left: `${star.x}%`,
                    top: `${(star.y / 70) * 100}%`,
                    width: star.size,
                    height: star.size,
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  whileInView={{
                    opacity: 1,
                    scale: 1,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 8px rgba(244, 215, 160, 0.45)",
                            "0 0 24px rgba(244, 215, 160, 0.95)",
                            "0 0 8px rgba(244, 215, 160, 0.45)",
                          ],
                        }
                  }
                  transition={{
                    opacity: {
                      duration: 0.65,
                      delay: 0.18 + index * 0.09,
                    },
                    scale: {
                      duration: 0.65,
                      delay: 0.18 + index * 0.09,
                      ease: cinematicEase,
                    },
                    boxShadow: {
                      duration: 2.5 + (index % 4),
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                />
              ),
            )}

            <motion.div
              className="constellation-scene__message"
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 35,
                      filter: "blur(14px)",
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              viewport={{
                once: true,
                amount: 0.45,
              }}
              transition={{
                duration: 1.2,
                delay: 1.65,
                ease: cinematicEase,
              }}
            >
              <span>The stars spell one truth</span>

              <h3>
                Happy Birthday
                <em>Dheepika</em>
              </h3>

              <p>Forever &amp; Always</p>
            </motion.div>
          </motion.div>

          <motion.div
            className="universe-ending__quote"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 45,
                    filter: "blur(12px)",
                  }
            }
            whileInView={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            transition={{
              duration: 1.1,
              ease: cinematicEase,
            }}
          >
            <span className="universe-ending__quote-mark">
              “
            </span>

            <p>
              Every beautiful memory became a star,
              and together they created the universe
              where my heart will always find you.
            </p>

            <span
              className="universe-ending__quote-star"
              aria-hidden="true"
            >
              ✦
            </span>
          </motion.div>

          <motion.div
            className="universe-ending__credits"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 25,
                  }
            }
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.7,
            }}
            transition={{
              duration: 1,
              delay: 0.25,
              ease: cinematicEase,
            }}
          >
            <span className="universe-ending__last-star">
              ✦
            </span>

            <p>
              Made with
              <span aria-label="love">♥</span>
              by Tarun
            </p>

            <button
              type="button"
              className="universe-ending__replay"
              onClick={replayStory}
            >
              <span>Experience Our Story Again</span>
              <i aria-hidden="true">↑</i>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default UniverseEndingSection;
