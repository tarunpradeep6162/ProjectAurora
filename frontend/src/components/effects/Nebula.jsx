import { motion } from "framer-motion";

function Nebula() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">

      {/* Purple Nebula */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -20, 20, 0],
          scale: [1, 1.2, 1, 1.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-10 left-10 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]"
      />

      {/* Blue Nebula */}
      <motion.div
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-20 right-20 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-[150px]"
      />

      {/* Pink Nebula */}
      <motion.div
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/15 blur-[130px]"
      />

    </div>
  );
}

export default Nebula;
