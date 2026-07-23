import { motion, useReducedMotion } from "framer-motion";
import MemoryGallery from "../memory/MemoryGallery";

const cinematicEase = [0.16, 1, 0.3, 1];

function MemorySection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="memories"
      className="memory-scene"
      aria-labelledby="memory-title"
    >
      <div className="memory-scene__atmosphere" aria-hidden="true">
        <motion.div
          className="memory-scene__glow memory-scene__glow--one"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 35, 0],
                  y: [0, -25, 0],
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="memory-scene__glow memory-scene__glow--two"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -30, 0],
                  y: [0, 35, 0],
                  scale: [1, 1.08, 1],
                }
          }
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="memory-scene__inner">
        <motion.header
          className="memory-scene__header"
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
          <span className="memory-scene__index">03</span>

          <div>
            <p className="eyebrow">Act III · Treasured moments</p>

            <h2
              id="memory-title"
              className="memory-scene__title"
            >
              Beautiful moments,
              <em> frozen in time.</em>
            </h2>

            <p className="memory-scene__intro">
              Every photograph holds a small universe:
              a smile, a journey, a quiet moment, and a
              memory I never want to forget.
            </p>
          </div>
        </motion.header>

        <MemoryGallery />
      </div>
    </section>
  );
}

export default MemorySection;
