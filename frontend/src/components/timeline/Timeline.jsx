import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useRef } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

const events = [
  {
    number: "01",
    date: "The day everything started",
    title: "First Conversation",
    description:
      "A simple hello became the beginning of something neither of us could have predicted.",
  },
  {
    number: "02",
    date: "A memory I will never forget",
    title: "First Meeting",
    description:
      "For a moment, everything around us disappeared and the world felt beautifully quiet.",
  },
  {
    number: "03",
    date: "The happiest chapter of my life",
    title: "Falling in Love",
    description:
      "Somewhere between our conversations and shared smiles, you quietly became my favourite person.",
  },
  {
    number: "04",
    date: "The reason for this surprise",
    title: "Your Birthday",
    description:
      "A celebration of the day this world received someone truly rare, beautiful, and unforgettable.",
  },
  {
    number: "05",
    date: "The story still being written",
    title: "Everything Ahead",
    description:
      "More journeys, more laughter, and countless memories are waiting for us in the chapters ahead.",
  },
];

function Timeline() {
  const timelineRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 75%", "end 60%"],
  });

  const progressScale = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    mass: 0.4,
  });

  return (
    <div ref={timelineRef} className="timeline">
      <div className="timeline__track" aria-hidden="true">
        <motion.span
          className="timeline__progress"
          style={{
            scaleY: reduceMotion ? 1 : progressScale,
          }}
        />
      </div>

      <ol className="timeline__list">
        {events.map((event, index) => {
          const isRight = index % 2 !== 0;

          return (
            <motion.li
              key={event.number}
              className={`timeline__event ${
                isRight ? "timeline__event--right" : ""
              }`}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 45,
                      x: isRight ? 35 : -35,
                      filter: "blur(8px)",
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
                x: 0,
                filter: "blur(0px)",
              }}
              viewport={{
                once: true,
                amount: 0.3,
              }}
              transition={{
                duration: 0.9,
                delay: index * 0.06,
                ease: cinematicEase,
              }}
            >
              <div className="timeline__node" aria-hidden="true">
                <motion.span
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          scale: [1, 1.16, 1],
                          opacity: [0.65, 1, 0.65],
                        }
                  }
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: index * 0.35,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <motion.article
                className="timeline__card"
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        y: -7,
                      }
                }
                transition={{
                  duration: 0.35,
                  ease: cinematicEase,
                }}
              >
                <div className="timeline__card-top">
                  <span className="timeline__number">
                    {event.number}
                  </span>

                  <span className="timeline__date">
                    {event.date}
                  </span>
                </div>

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <div
                  className="timeline__card-line"
                  aria-hidden="true"
                />
              </motion.article>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default Timeline;
