import { motion } from "framer-motion";
import { useMemo } from "react";

function Sparkles() {
  // Use useMemo for SSR compatibility & stable particle generation
  const particles = useMemo(() => {
    return [...Array(35)].map(() => ({
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
      drift: (Math.random() - 0.5) * 80,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-1">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-pink-300 via-rose-200 to-white shadow-[0_0_12px_rgba(244,63,94,0.9)]"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          initial={{
            opacity: 0,
            scale: 0,
            y: 0,
            x: 0,
          }}
          animate={{
            opacity: [0, 0.9, 1, 0.4, 0],
            scale: [0.2, 1.4, 1.8, 0.8, 0],
            y: [-20, -120],
            x: [0, p.drift],
            filter: ["blur(0px)", "blur(1px)", "blur(0px)"],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default Sparkles;
