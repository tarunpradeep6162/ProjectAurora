import { motion } from "framer-motion";

function LoadingBar({ progress }) {
  return (
    <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden mt-8">
      <motion.div
        className="h-full bg-white"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut" }}
      />
    </div>
  );
}

export default LoadingBar;
