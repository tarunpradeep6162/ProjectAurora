import { motion } from "framer-motion";

function LoadingBar({ progress }) {
  return (
    <div className="relative w-full h-3 bg-slate-900/80 rounded-full overflow-hidden p-[2px] border border-pink-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.15)]">
      
      {/* Inner Track Glow Track */}
      <div className="absolute inset-0 bg-pink-950/20" />

      {/* Cinematic Glowing Progress Fill with Gradient & Shimmer */}
      <motion.div
        className="relative h-full rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.8)]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.3 }}
      >
        {/* Shimmer Light Streak on the Leading Edge */}
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse" />
      </motion.div>

    </div>
  );
}

export default LoadingBar;
