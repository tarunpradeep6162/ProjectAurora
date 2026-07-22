import { Typewriter } from "react-simple-typewriter";
import { motion } from "framer-motion";

function MemoryTyper() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/10 p-10 backdrop-blur-xl"
    >
      <h2 className="mb-10 text-center text-5xl font-bold text-white">
        ❤️ Our Journey
      </h2>

      <div className="text-center text-2xl leading-10 text-pink-200">

        <Typewriter
          words={[
            "I still remember the first day we met...",
            "Every smile with you became my favorite memory...",
            "You made my ordinary life extraordinary...",
            "Every heartbeat reminds me how lucky I am...",
            "Happy Birthday, My Love ❤️",
          ]}
          loop={0}
          cursor
          cursorStyle="|"
          typeSpeed={60}
          deleteSpeed={25}
          delaySpeed={2500}
        />

      </div>
    </motion.div>
  );
}

export default MemoryTyper;
