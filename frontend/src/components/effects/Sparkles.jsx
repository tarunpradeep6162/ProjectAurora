import { motion } from "framer-motion";

const sparkles = [...Array(25)];

function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">

      {sparkles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-yellow-300"

          initial={{
            opacity: 0,
            scale: 0,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}

          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}

          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
        />
      ))}

    </div>
  );
}

export default Sparkles;
