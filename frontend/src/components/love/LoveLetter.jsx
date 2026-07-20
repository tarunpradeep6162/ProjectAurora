import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";

function LoveLetter() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/10 p-10 backdrop-blur-xl shadow-2xl"
    >
      <h2 className="mb-8 text-center text-5xl font-bold">
        💌 A Letter For You
      </h2>

      <div className="text-left text-xl leading-10 text-gray-200">
        <Typewriter
          words={[
            `Dear Love,

Every day with you feels like a beautiful dream.

You make ordinary moments extraordinary.

Your smile lights up my darkest days,
your laughter is my favorite melody,
and your happiness means everything to me.

Thank you for being my best friend,
my biggest support,
and the love of my life.

Happy Birthday ❤️

Forever Yours,
Tarun`
          ]}
          loop={1}
          cursor
          cursorStyle="|"
          typeSpeed={45}
          deleteSpeed={0}
          delaySpeed={999999}
        />
      </div>
    </motion.div>
  );
}

export default LoveLetter;
