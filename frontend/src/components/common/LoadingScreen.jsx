import { motion } from "framer-motion";
import LoadingBar from "./LoadingBar";

function LoadingScreen({ progress }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="text-6xl font-bold tracking-widest"
      >
        Project Aurora
      </motion.h1>

      <motion.p
        className="mt-4 text-gray-400"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
      >
        Preparing something magical...
      </motion.p>

      <LoadingBar progress={progress} />

      <p className="mt-4 text-white text-lg">
        {progress}%
      </p>
    </motion.div>
  );
}

export default LoadingScreen;
