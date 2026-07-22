import { motion } from "framer-motion";
import { useMemo } from "react";

function Fireworks() {
  // Pre-generate romantic color palettes and coordinates for a cinematic celestial display
  const bursts = useMemo(() => {
    return [...Array(5)].map(() => ({
      x: 20 + Math.random() * 60,
      y: 15 + Math.random() * 50,
      delay: Math.random() * 2,
    }));
  }, []);

  const sparkColors = [
    "bg-pink-400 shadow-[0_0_12px_rgba(244,63,94,0.9)]",
    "bg-rose-300 shadow-[0_0_12px_rgba(253,164,175,0.9)]",
    "bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)]",
    "bg-pink-200 shadow-[0_0_12px_rgba(251,207,232,0.9)]",
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-2">
      {bursts.map((burst, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`,
          }}
        >
          {/* Central Heart/Spark Flash */}
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2 text-pink-400 text-sm opacity-0 filter blur-[0.5px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0.5, 1.8, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.2,
              delay: burst.delay,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeOut",
            }}
          >
            ❤️
          </motion.div>

          {/* Radial Romantic Burst Particles */}
          {[...Array(18)].map((_, j) => {
            const angle = (j * 360) / 18;
            const distance = 90 + (j % 3) * 25;
            const rad = (angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * distance;
            const targetY = Math.sin(rad) * distance;
            const colorClass = sparkColors[j % sparkColors.length];

            return (
              <motion.div
                key={j}
                className={`absolute h-1.5 w-1.5 rounded-full ${colorClass}`}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: [0, targetX * 0.7, targetX],
                  y: [0, targetY * 0.7, targetY],
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.2, 1.4, 0.6, 0],
                }}
                transition={{
                  duration: 2.2,
                  delay: burst.delay,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default Fireworks;
