import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

function HeroSection() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 120],
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.72],
    [1, 0],
  );

  const enterStory = () => {
    document.querySelector("#story")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      ref={sectionRef}
      className="hero"
      aria-labelledby="hero-title"
    >
      <div
        className="hero__backdrop"
        aria-hidden="true"
      >
        <div className="hero__light" />
        <div className="hero__curtain hero__curtain--left" />
        <div className="hero__curtain hero__curtain--right" />
      </div>

      <div className="hero__meta">
        <span>A private premiere</span>
        <span>For one extraordinary person</span>
      </div>

      <motion.div
        className="hero__copy"
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
      >
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          Act I · The celebration
        </motion.p>

        <h1 id="hero-title" className="hero__title">
          <span className="hero__line">
            <motion.span
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Happy
            </motion.span>
          </span>

          <span className="hero__line hero__line--accent">
            <motion.span
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.05,
                delay: 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Birthday
            </motion.span>
          </span>
        </h1>

        <motion.p
          className="hero__lede"
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.75,
            duration: 0.8,
          }}
        >
          Not every love story needs a grand beginning.
          Ours became extraordinary one beautiful moment
          at a time.
        </motion.p>

        <motion.button
          type="button"
          className="text-link"
          onClick={enterStory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span>Enter our story</span>
          <i aria-hidden="true" />
        </motion.button>
      </motion.div>

      <div
        className="hero__chapter"
        aria-hidden="true"
      >
        <strong>01</strong>
        <span>The opening scene</span>
      </div>
    </section>
  );
}

export default HeroSection;
