import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

function LoveLetterSection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [isOpened, setIsOpened] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const glowY = useTransform(
    scrollYProgress,
    [0, 1],
    [reduceMotion ? 0 : 90, reduceMotion ? 0 : -90],
  );

  const cardRotate = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [-1.5, 0, 1.5],
  );

  const openLetter = () => {
    setIsOpened(true);
  };

  return (
    <section
      ref={sectionRef}
      id="letter"
      className="letter-scene"
      aria-labelledby="letter-title"
    >
      <motion.div
        className="letter-scene__glow"
        aria-hidden="true"
        style={{ y: glowY }}
      />

      <div className="letter-scene__inner">
        <motion.header
          className="letter-scene__header"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 35,
                  filter: "blur(10px)",
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
            duration: 1,
            ease: cinematicEase,
          }}
        >
          <span className="letter-scene__index">04</span>

          <div>
            <p className="eyebrow">Act IV · Words from my heart</p>

            <h2
              id="letter-title"
              className="letter-scene__title"
            >
              Some feelings deserve
              <em> more than silence.</em>
            </h2>

            <p className="letter-scene__intro">
              There are things I may not always say perfectly,
              but today I want every word to reach your heart.
            </p>
          </div>
        </motion.header>

        <motion.div
          className={`love-letter ${
            isOpened ? "love-letter--opened" : ""
          }`}
          style={{
            rotateZ: cardRotate,
          }}
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 70,
                  scale: 0.94,
                  filter: "blur(12px)",
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
            duration: 1.1,
            ease: cinematicEase,
          }}
        >
          <div
            className="love-letter__ornament love-letter__ornament--top"
            aria-hidden="true"
          />

          <div
            className="love-letter__ornament love-letter__ornament--bottom"
            aria-hidden="true"
          />

          <motion.div
            className="love-letter__paper"
            animate={
              isOpened
                ? {
                    y: 0,
                    opacity: 1,
                  }
                : {
                    y: 22,
                    opacity: 0.22,
                  }
            }
            transition={{
              duration: 0.9,
              ease: cinematicEase,
            }}
          >
            <div className="love-letter__heading">
              <span>To the most beautiful soul,</span>

              <span className="love-letter__date">
                A letter written with love
              </span>
            </div>

            <motion.div
              className="love-letter__content"
              animate={
                isOpened
                  ? {
                      opacity: 1,
                      y: 0,
                    }
                  : {
                      opacity: 0,
                      y: 18,
                    }
              }
              transition={{
                duration: 0.85,
                delay: isOpened ? 0.35 : 0,
                ease: cinematicEase,
              }}
            >
              <p>
                You entered my life quietly, but somehow you
                became one of the most important parts of it.
                Every conversation, every smile, and every small
                moment with you has become a memory I treasure.
              </p>

              <p>
                You make ordinary days feel meaningful. You make
                difficult moments feel lighter. And without even
                trying, you remind me that love can feel calm,
                safe, beautiful, and real.
              </p>

              <p>
                On your birthday, I do not only wish you
                happiness for today. I wish you a life filled
                with peace, success, laughter, adventure, and
                every dream your heart has quietly carried.
              </p>

              <p>
                No matter how many chapters life gives us, I hope
                I will always have the privilege of standing
                beside you, celebrating you, supporting you, and
                creating beautiful memories with you.
              </p>

              <div className="love-letter__closing">
                <span>Always yours,</span>
                <strong>Tarun</strong>
              </div>
            </motion.div>
          </motion.div>

          <AnimateSeal
            isOpened={isOpened}
            reduceMotion={reduceMotion}
            openLetter={openLetter}
          />
        </motion.div>
      </div>
    </section>
  );
}

function AnimateSeal({
  isOpened,
  reduceMotion,
  openLetter,
}) {
  return (
    <motion.button
      type="button"
      className="love-letter__seal"
      onClick={openLetter}
      disabled={isOpened}
      aria-label={
        isOpened
          ? "Love letter opened"
          : "Open the love letter"
      }
      animate={
        isOpened
          ? {
              opacity: 0,
              scale: 1.5,
              rotate: 18,
              pointerEvents: "none",
            }
          : reduceMotion
            ? undefined
            : {
                scale: [1, 1.06, 1],
              }
      }
      transition={
        isOpened
          ? {
              duration: 0.55,
              ease: cinematicEase,
            }
          : {
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      whileHover={
        reduceMotion || isOpened
          ? undefined
          : {
              scale: 1.1,
              rotate: -4,
            }
      }
      whileTap={
        isOpened
          ? undefined
          : {
              scale: 0.94,
            }
      }
    >
      <span className="love-letter__seal-ring">
        <span>Love</span>
      </span>

      <span className="love-letter__seal-label">
        Open letter
      </span>
    </motion.button>
  );
}

export default LoveLetterSection;
