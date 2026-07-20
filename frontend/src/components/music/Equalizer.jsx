import { motion } from "framer-motion";

function Equalizer({ playing }) {
  return (
    <div className="flex items-end gap-1 h-6">
      {[12, 20, 15, 24, 18].map((height, index) => (
        <motion.div
          key={index}
          animate={{
            height: playing
              ? [6, height, 8, height - 4, 6]
              : 6,
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: index * 0.1,
          }}
          className="w-1 rounded-full bg-pink-400"
        />
      ))}
    </div>
  );
}

export default Equalizer;
