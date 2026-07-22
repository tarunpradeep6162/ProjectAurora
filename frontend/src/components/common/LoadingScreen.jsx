import { motion } from "framer-motion";
import LoadingBar from "./LoadingBar";

function LoadingScreen({ progress }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Ambient Romantic Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-pink-600/20 via-rose-500/15 to-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,6,23,0.85)_90%,rgba(2,6,23,1)_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl text-center">
        
        {/* Glowing Romantic Tagline Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(244,63,94,0.2)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-ping" />
          <span className="text-[11px] uppercase tracking-[5px] text-pink-200 font-medium">
            A Universe Crafted For You
          </span>
        </motion.div>

        {/* Cinematic Glowing Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            filter: "blur(0px)",
            textShadow: [
              "0 0 20px rgba(255,255,255,0.2)",
              "0 0 45px rgba(244,63,94,0.5)",
              "0 0 20px rgba(255,255,255,0.2)"
            ]
          }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="text-5xl sm:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-500"
        >
          Dheepika Chlmm❤️  ❤️
        </motion.h1>

        {/* Romantic Pulsing Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut",
          }}
          className="mt-6 text-sm sm:text-base text-pink-200/70 font-light tracking-wide italic"
        >
          Preparing something magical...
        </motion.p>

        {/* Modernized Progress Bar Wrapper */}
        <div className="w-72 sm:w-80 mt-10">
          <LoadingBar progress={progress} />
        </div>

        {/* Percentage Counter with Cinematic Glow */}
        <motion.div 
          className="mt-4 text-pink-300 font-mono text-lg tracking-widest drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]"
        >
          {progress}%
        </motion.div>

      </div>
    </motion.div>
  );
}

export default LoadingScreen;
