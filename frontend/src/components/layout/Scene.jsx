import { motion } from "framer-motion";

const revealVariants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function Scene({
  id,
  chapter,
  eyebrow,
  title,
  accent,
  intro,
  children,
}) {
  return (
    <section
      id={id}
      className="scene"
      aria-labelledby={`${id}-title`}
    >
      <div className="scene__rule" aria-hidden="true" />

      <div className="scene__inner">
        <motion.header
          className="scene__header"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.35,
          }}
          variants={revealVariants}
          transition={{
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="scene__index" aria-hidden="true">
            {chapter}
          </div>

          <div className="scene__heading">
            <p className="eyebrow">{eyebrow}</p>

            <h2
              id={`${id}-title`}
              className="display-title"
            >
              {title}

              {accent && <em>{accent}</em>}
            </h2>

            {intro && (
              <p className="scene__intro">
                {intro}
              </p>
            )}
          </div>
        </motion.header>

        {children}
      </div>
    </section>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.18,
      }}
      variants={revealVariants}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
