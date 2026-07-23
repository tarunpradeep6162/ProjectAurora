import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useRef } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

const journeyMoments = [
  {
    number: "01",
    year: "The beginning",
    title: "When We First Met",
    location: "Where our story quietly started",
    description:
      "A simple moment became the beginning of something beautiful. I did not know then how important you would become to me.",
    quote: "Some beginnings arrive softly.",
  },
  {
    number: "02",
    year: "The connection",
    title: "Endless Conversations",
    location: "Between messages, laughter, and late nights",
    description:
      "Every conversation brought us closer. Hours felt like minutes, and somehow talking to you became the best part of my day.",
    quote: "You became my favourite notification.",
  },
  {
    number: "03",
    year: "The memories",
    title: "Our Little Adventures",
    location: "Every road felt special with you",
    description:
      "The destination never mattered as much as the person beside me. Even ordinary places became unforgettable memories.",
    quote: "With you, every road feels like home.",
  },
  {
    number: "04",
    year: "The promise",
    title: "Standing Together",
    location: "Through calm days and difficult ones",
    description:
      "Love is not only found in perfect moments. It is also found in patience, support, understanding, and choosing each other.",
    quote: "Not only in happiness, but through everything.",
  },
  {
    number: "05",
    year: "The future",
    title: "Everything Still Ahead",
    location: "A story we are still writing",
    description:
      "There are still so many places to visit, dreams to achieve, celebrations to share, and memories waiting for us.",
    quote: "The best chapters are still unwritten.",
  },
];

function JourneySection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 65%"],
  });

  const routeProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    mass: 0.45,
  });

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="journey-scene"
      aria-labelledby="journey-title"
    >
      <div
        className="journey-scene__atmosphere"
        aria-hidden="true"
      >
        <motion.span
          className="journey-scene__orb journey-scene__orb--one"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 45, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.span
          className="journey-scene__orb journey-scene__orb--two"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -35, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{
            duration: 17,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="journey-scene__inner">
        <motion.header
          className="journey-scene__header"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 40,
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
            amount: 0.4,
          }}
          transition={{
            duration: 1,
            ease: cinematicEase,
          }}
        >
          <span className="journey-scene__index">
            05
          </span>

          <div>
            <p className="eyebrow">
              Act V · The journey
            </p>

            <h2
              id="journey-title"
              className="journey-scene__title"
            >
              Every step brought me
              <em> closer to you.</em>
            </h2>

            <p className="journey-scene__intro">
              Our story is not only made of grand moments.
              It lives inside conversations, journeys,
              laughter, difficult days, and every time we
              chose to keep moving forward together.
            </p>
          </div>
        </motion.header>

        <div className="journey-route">
          <div
            className="journey-route__track"
            aria-hidden="true"
          >
            <motion.span
              className="journey-route__progress"
              style={{
                scaleX: reduceMotion ? 1 : routeProgress,
              }}
            />
          </div>

          <div className="journey-route__cards">
            {journeyMoments.map((moment, index) => (
              <motion.article
                key={moment.number}
                className="journey-card"
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: index % 2 === 0 ? 55 : -35,
                        scale: 0.95,
                        filter: "blur(9px)",
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
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.9,
                  delay: index * 0.08,
                  ease: cinematicEase,
                }}
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -10,
                      }
                }
              >
                <div
                  className="journey-card__node"
                  aria-hidden="true"
                >
                  <motion.span
                    animate={
                      reduceMotion
                        ? undefined
                        : {
                            scale: [1, 1.2, 1],
                            opacity: [0.55, 1, 0.55],
                          }
                    }
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.4,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="journey-card__top">
                  <span className="journey-card__number">
                    {moment.number}
                  </span>

                  <span className="journey-card__year">
                    {moment.year}
                  </span>
                </div>

                <div className="journey-card__visual">
                  <span
                    className="journey-card__ring"
                    aria-hidden="true"
                  />

                  <span
                    className="journey-card__compass"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </div>

                <div className="journey-card__content">
                  <p className="journey-card__location">
                    {moment.location}
                  </p>

                  <h3>{moment.title}</h3>

                  <p className="journey-card__description">
                    {moment.description}
                  </p>

                  <blockquote>
                    “{moment.quote}”
                  </blockquote>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="journey-scene__closing"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 30,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.6,
          }}
          transition={{
            duration: 0.9,
            ease: cinematicEase,
          }}
        >
          <span />
          <p>
            Wherever life takes us, I hope we always
            find our way back to each other.
          </p>
          <span />
        </motion.div>
      </div>
    </section>
  );
}

export default JourneySection;
