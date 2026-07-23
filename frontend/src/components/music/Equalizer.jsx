import { motion } from "framer-motion";

const bars = [8, 15, 11, 18, 13];

export default function Equalizer({
  playing,
}) {
  return (
    <div
      className="romantic-equalizer"
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <motion.span
          key={height}
          animate={{
            height: playing
              ? [
                  4,
                  height,
                  7,
                  Math.max(6, height - 3),
                  4,
                ]
              : 4,
          }}
          transition={{
            duration: 0.75,
            repeat: playing
              ? Infinity
              : 0,
            delay: index * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
