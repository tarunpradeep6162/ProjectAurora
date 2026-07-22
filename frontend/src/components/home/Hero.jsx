import { motion } from "framer-motion";
import GalaxyBackground from "../effects/GalaxyBackground";
import ShootingStars from "../effects/ShootingStars";

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black text-white">
      <GalaxyBackground /> 
      <ShootingStars />
      {/* Aurora Background */}
        <div className="absolute inset-0 z-[1]">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600 opacity-20 blur-3xl"></div>

        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-pink-500 opacity-20 blur-3xl"></div>

        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">

        <motion.h1
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl font-extrabold md:text-8xl"
        >
          Happy Birthday ❤️
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 max-w-2xl text-xl text-gray-300"
        >
          Every beautiful memory we created together has become
          a star in my universe.
        </motion.p>

        <motion.button
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="mt-12 rounded-full border border-white/20 bg-white/10 px-10 py-4 backdrop-blur-md transition"
        >
          Begin the Journey
        </motion.button>

      </div>

    </section>
  );
}

export default Hero;
