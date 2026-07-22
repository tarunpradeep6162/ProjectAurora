import { motion } from "framer-motion";

const fireworks = [...Array(6)];

function Fireworks() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">

      {fireworks.map((_, i) => (
        <motion.div
          key={i}
          className="absolute"

          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 40}%`,
          }}
        >
          {[...Array(16)].map((_, j) => (
            <motion.div
              key={j}
className={`absolute h-2 w-2 rounded-full ${
  [
    "bg-yellow-300",
    "bg-pink-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-red-400",
    "bg-purple-400",
  ][j % 6]
}`}

              initial={{
                x: 0,
                y: 0,
                opacity: 1,
                scale: 0,
              }}

              animate={{
                x: Math.cos((j * 360) / 16 * Math.PI / 180) * 80,
                y: Math.sin((j * 360) / 16 * Math.PI / 180) * 80,
                opacity: [1, 1, 0],
                scale: [0, 1.5, 0],
              }}

              transition={{
                duration: 1.5,
                delay: i * 0.8,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            />
          ))}
        </motion.div>
      ))}

    </div>
  );
}

export default Fireworks;
