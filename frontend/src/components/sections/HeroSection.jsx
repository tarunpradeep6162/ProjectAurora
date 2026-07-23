import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

function HeroSection() {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, reduceMotion ? 0 : 130],
  );

  const contentScale = useTransform(
    scrollYProgress,
    [0, 0.8],
    [1, reduceMotion ? 1 : 0.96],
  );

  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.68],
    [1, 0],
  );

  const backdropOpacity = useTransform(
    scrollYProgress,
    [0, 0.9],
    [1, 0.25],
  );

  const enterStory = () => {
    document.querySelector("#story")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section
      ref={sectionRef}
      className="hero"
      aria-labelledby="hero-title"
    >
      <motion.div
        className="hero__backdrop"
        aria-hidden="true"
        style={{ opacity: backdropOpacity }}
      >
        <motion.div
          className="hero__light"
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.55, 0.95, 0.55],
                  scale: [0.96, 1.04, 0.96],
                }
          }
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="hero__curtain hero__curtain--left"
          initial={reduceMotion ? false : { x: 0 }}
          animate={reduceMotion ? undefined : { x: "-8%" }}
          transition={{
            duration: 1.6,
            delay: 0.15,
            ease: cinematicEase,
          }}
        />

        <motion.div
          className="hero__curtain hero__curtain--right"
          initial={reduceMotion ? false : { x: 0 }}
          animate={reduceMotion ? undefined : { x: "8%" }}
          transition={{
            duration: 1.6,
            delay: 0.15,
            ease: cinematicEase,
          }}
        />
      </motion.div>

      <motion.div
        className="hero__meta"
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.25,
          ease: cinematicEase,
        }}
      >
        <span>A private premiere</span>
        <span>For one extraordinary person</span>
      </motion.div>

      <motion.div
        className="hero__copy"
        style={{
          y: contentY,
          opacity: contentOpacity,
          scale: contentScale,
        }}
      >
        <motion.p
          className="eyebrow"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.7,
            ease: cinematicEase,
          }}
        >
          Act I · The celebration
        </motion.p>

        <h1 id="hero-title" className="hero__title">
          <span className="hero__line">
            <motion.span
              initial={reduceMotion ? false : { y: "110%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.1,
                delay: 0.08,
                ease: cinematicEase,
              }}
            >
              Happy
            </motion.span>
          </span>

          <span className="hero__line hero__line--accent">
            <motion.span
              initial={reduceMotion ? false : { y: "110%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 1.15,
                delay: 0.2,
                ease: cinematicEase,
              }}
            >
              Birthday
            </motion.span>
          </span>
        </h1>

        <motion.div
          className="hero__divider"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            delay: 0.7,
            duration: 0.9,
            ease: cinematicEase,
          }}
          aria-hidden="true"
        />

        <motion.p
          className="hero__lede"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.82,
            duration: 0.85,
            ease: cinematicEase,
          }}
        >
          Not every love story needs a grand beginning.
          Ours became extraordinary one beautiful moment
          at a time.
        </motion.p>

        <motion.button
          type="button"
          className="text-link hero__cta"
          onClick={enterStory}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1.08,
            duration: 0.7,
            ease: cinematicEase,
          }}
          whileHover={
            reduceMotion
              ? undefined
              : {
                  x: 5,
                }
          }
          whileTap={{
            scale: 0.98,
          }}
        >
          <span>Enter our story</span>
          <i aria-hidden="true" />
        </motion.button>
      </motion.div>

      <motion.div
        className="hero__chapter"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          delay: 1.15,
          duration: 0.75,
          ease: cinematicEase,
        }}
      >
        <strong>01</strong>
        <span>The opening scene</span>
      </motion.div>

      <motion.div
        className="hero__scroll-indicator"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: 1.35,
          duration: 0.8,
        }}
      >
        <span />
      </motion.div>
    </section>
  );
}

export default HeroSection;
