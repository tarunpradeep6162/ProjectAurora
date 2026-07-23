import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useMemo, useState } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

const sparkleParticles = Array.from(
  { length: 28 },
  (_, index) => ({
    id: index,
    left: `${8 + ((index * 37) % 84)}%`,
    top: `${8 + ((index * 23) % 78)}%`,
    delay: (index % 9) * 0.25,
    duration: 3.5 + (index % 5) * 0.7,
    size: 2 + (index % 4) * 1.5,
  }),
);

const celebrationParticles = Array.from(
  { length: 42 },
  (_, index) => ({
    id: index,
    angle: (360 / 42) * index,
    distance: 160 + (index % 7) * 23,
    delay: (index % 8) * 0.04,
    size: 4 + (index % 5) * 2,
    rotate: (index * 49) % 360,
  }),
);

const floatingHearts = Array.from(
  { length: 12 },
  (_, index) => ({
    id: index,
    left: `${10 + ((index * 41) % 80)}%`,
    delay: index * 0.18,
    duration: 4.5 + (index % 4),
    size: 0.7 + (index % 4) * 0.18,
  }),
);

function BirthdaySection() {
  const reduceMotion = useReducedMotion();

  const [stage, setStage] = useState("closed");

  const isUnlocking = stage === "unlocking";
  const isOpened = stage === "opened";
  const isCelebrating = isUnlocking || isOpened;

  const birthdayWishes = useMemo(
    () => [
      "May your life always shine as beautifully as your smile.",
      "May every dream in your heart become a beautiful reality.",
      "May this new chapter bring peace, happiness, success, and endless love.",
      "And may I always be lucky enough to celebrate these moments beside you.",
    ],
    [],
  );

  const openTreasure = () => {
    if (stage !== "closed") {
      return;
    }

    setStage("unlocking");

    window.setTimeout(() => {
      setStage("opened");
    }, 1650);
  };

  const replayCelebration = () => {
    setStage("closed");

    window.setTimeout(() => {
      setStage("unlocking");
    }, 500);

    window.setTimeout(() => {
      setStage("opened");
    }, 2150);
  };

  return (
    <section
      id="birthday"
      className={`treasure-finale ${
        isCelebrating ? "treasure-finale--active" : ""
      }`}
      aria-labelledby="birthday-title"
    >
      <div
        className="treasure-finale__background"
        aria-hidden="true"
      >
        <motion.span
          className="treasure-finale__aurora treasure-finale__aurora--one"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 50, 0],
                  y: [0, -35, 0],
                  scale: [1, 1.12, 1],
                }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.span
          className="treasure-finale__aurora treasure-finale__aurora--two"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -45, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {sparkleParticles.map((particle) => (
          <motion.span
            key={particle.id}
            className="treasure-finale__spark"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.12, 0.9, 0.12],
                    scale: [0.7, 1.6, 0.7],
                    y: [0, -18, 0],
                  }
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {isOpened && (
          <div
            className="treasure-celebration"
            aria-hidden="true"
          >
            {celebrationParticles.map((particle) => {
              const radians =
                (particle.angle * Math.PI) / 180;

              const x =
                Math.cos(radians) * particle.distance;

              const y =
                Math.sin(radians) * particle.distance;

              return (
                <motion.span
                  key={particle.id}
                  className={`treasure-celebration__particle treasure-celebration__particle--${
                    (particle.id % 4) + 1
                  }`}
                  style={{
                    width: particle.size,
                    height: particle.size,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0.4,
                    rotate: particle.rotate,
                  }}
                  animate={{
                    x,
                    y,
                    opacity: [1, 1, 0],
                    scale: [0.4, 1.3, 0.8],
                    rotate:
                      particle.rotate +
                      420,
                  }}
                  transition={{
                    duration: 2.4,
                    delay: particle.delay,
                    ease: "easeOut",
                  }}
                />
              );
            })}

            {floatingHearts.map((heart) => (
              <motion.span
                key={heart.id}
                className="treasure-celebration__heart"
                style={{
                  left: heart.left,
                  fontSize: `${heart.size}rem`,
                }}
                initial={{
                  bottom: "-3rem",
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  bottom: "110%",
                  opacity: [0, 0.9, 0],
                  scale: [0.5, 1.15, 0.8],
                  x: [
                    0,
                    heart.id % 2 === 0
                      ? 45
                      : -45,
                    0,
                  ],
                  rotate: [
                    0,
                    heart.id % 2 === 0
                      ? 18
                      : -18,
                    0,
                  ],
                }}
                transition={{
                  duration: heart.duration,
                  delay: heart.delay,
                  ease: "easeInOut",
                }}
              >
                ♥
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="treasure-finale__inner">
        <motion.header
          className="treasure-finale__header"
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
            amount: 0.35,
          }}
          transition={{
            duration: 1,
            ease: cinematicEase,
          }}
        >
          <span className="treasure-finale__index">
            06
          </span>

          <div>
            <p className="eyebrow">
              The final chapter · Your surprise
            </p>

            <h2
              id="birthday-title"
              className="treasure-finale__title"
            >
              One final treasure is
              <em> waiting for you.</em>
            </h2>

            <p className="treasure-finale__intro">
              Every memory, every word, and every moment
              has led to this final surprise. Open the
              treasure and unlock the celebration made
              especially for you.
            </p>
          </div>
        </motion.header>

        <div className="treasure-stage">
          <motion.div
            className="treasure-stage__spotlight"
            aria-hidden="true"
            animate={
              isCelebrating
                ? {
                    opacity: 0.85,
                    scale: 1.18,
                  }
                : {
                    opacity: 0.38,
                    scale: 1,
                  }
            }
            transition={{
              duration: 1.2,
              ease: cinematicEase,
            }}
          />

          <motion.div
            className="treasure-stage__platform"
            aria-hidden="true"
            animate={
              isCelebrating
                ? {
                    scaleX: 1.1,
                    opacity: 0.9,
                  }
                : {
                    scaleX: 1,
                    opacity: 0.55,
                  }
            }
            transition={{
              duration: 1,
              ease: cinematicEase,
            }}
          />

          <motion.div
            className={`treasure-box ${
              isUnlocking
                ? "treasure-box--unlocking"
                : ""
            } ${
              isOpened
                ? "treasure-box--opened"
                : ""
            }`}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 100,
                    scale: 0.85,
                    filter: "blur(16px)",
                  }
            }
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.25,
            }}
            transition={{
              duration: 1.25,
              ease: cinematicEase,
            }}
            animate={
              !reduceMotion && stage === "closed"
                ? {
                    y: [0, -9, 0],
                  }
                : undefined
            }
          >
            <div
              className="treasure-box__magic"
              aria-hidden="true"
            >
              <motion.span
                animate={
                  isOpened
                    ? {
                        opacity: [0, 1, 0.8],
                        scale: [0.2, 1.4, 1],
                      }
                    : {
                        opacity: 0,
                        scale: 0.2,
                      }
                }
                transition={{
                  duration: 1.25,
                  ease: cinematicEase,
                }}
              />
            </div>

            <div className="treasure-box__lid">
              <div className="treasure-box__lid-face">
                <span className="treasure-box__lid-band treasure-box__lid-band--left" />
                <span className="treasure-box__lid-band treasure-box__lid-band--right" />

                <div className="treasure-box__lid-ornament">
                  <span />
                  <strong>✦</strong>
                  <span />
                </div>
              </div>

              <div className="treasure-box__lid-top" />
            </div>

            <div className="treasure-box__base">
              <span className="treasure-box__base-band treasure-box__base-band--left" />
              <span className="treasure-box__base-band treasure-box__base-band--right" />

              <div className="treasure-box__wood-lines" />

              <div className="treasure-box__lock">
                <motion.span
                  className="treasure-box__gem"
                  animate={
                    stage === "closed"
                      ? {
                          opacity: [0.55, 1, 0.55],
                          scale: [1, 1.08, 1],
                        }
                      : isUnlocking
                        ? {
                            opacity: [1, 0.5, 1],
                            scale: [1, 1.4, 1.1],
                          }
                        : {
                            opacity: 1,
                            scale: 1.15,
                          }
                  }
                  transition={{
                    duration:
                      stage === "closed" ? 2.2 : 0.45,
                    repeat:
                      stage === "closed" ||
                      isUnlocking
                        ? Infinity
                        : 0,
                    ease: "easeInOut",
                  }}
                />

                <span className="treasure-box__keyhole" />
              </div>

              <div className="treasure-box__feet">
                <span />
                <span />
              </div>
            </div>

            <AnimatePresence>
              {isOpened && (
                <motion.div
                  className="treasure-reveal"
                  initial={{
                    opacity: 0,
                    y: 70,
                    scale: 0.75,
                    filter: "blur(18px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: -165,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: 40,
                    scale: 0.8,
                  }}
                  transition={{
                    duration: 1.35,
                    delay: 0.25,
                    ease: cinematicEase,
                  }}
                >
                  <div
                    className="treasure-reveal__crown"
                    aria-hidden="true"
                  >
                    ✦
                  </div>

                  <span className="treasure-reveal__label">
                    The greatest treasure is you
                  </span>

                  <h3>
                    Happy Birthday
                    <em>My Love</em>
                  </h3>

                  <div
                    className="treasure-reveal__divider"
                    aria-hidden="true"
                  >
                    <span />
                    <i>♥</i>
                    <span />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {stage === "closed" && (
              <motion.button
                type="button"
                className="treasure-box__button"
                onClick={openTreasure}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -7,
                        scale: 1.04,
                      }
                }
                whileTap={{
                  scale: 0.96,
                }}
              >
                <span className="treasure-box__button-glow" />

                <span>Let’s Begin</span>

                <i aria-hidden="true">✦</i>
              </motion.button>
            )}

            {isUnlocking && (
              <motion.p
                className="treasure-box__status"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                Unlocking your surprise...
              </motion.p>
            )}
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpened && (
            <motion.div
              className="treasure-message"
              initial={{
                opacity: 0,
                y: 70,
                filter: "blur(14px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 1.15,
                delay: 1.1,
                ease: cinematicEase,
              }}
            >
              <span className="treasure-message__label">
                My birthday wish for you
              </span>

              <div className="treasure-message__wishes">
                {birthdayWishes.map(
                  (wish, index) => (
                    <motion.p
                      key={wish}
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.75,
                        delay:
                          1.45 + index * 0.22,
                        ease: cinematicEase,
                      }}
                    >
                      {wish}
                    </motion.p>
                  ),
                )}
              </div>

              <motion.div
                className="treasure-message__signature"
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.85,
                  delay: 2.45,
                  ease: cinematicEase,
                }}
              >
                <span>Forever yours,</span>
                <strong>Tarun</strong>
              </motion.div>

              <motion.button
                type="button"
                className="treasure-message__replay"
                onClick={replayCelebration}
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.7,
                  delay: 2.8,
                }}
              >
                Celebrate Again
                <span aria-hidden="true">↻</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="treasure-finale__ending"
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
            duration: 0.9,
            ease: cinematicEase,
          }}
        >
          <span />
          <p>
            This chapter ends here, but our story
            continues forever.
          </p>
          <span />
        </motion.div>
      </div>
    </section>
  );
}

export default BirthdaySection;
