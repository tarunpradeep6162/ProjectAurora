import { motion } from "framer-motion";

function ShootingStar({ top, left, delay }) {
  return (
    <motion.div
      initial={{
        x: 0,
        y: 0,
        opacity: 0,
      }}
      animate={{
        x: 500,
        y: 250,
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        repeatDelay: 6,
        ease: "linear",
      }}
      className="absolute"
      style={{
        top,
        left,
      }}
    >
      <div className="h-[2px] w-24 rotate-[25deg] rounded-full bg-white shadow-[0_0_15px_white]" />
    </motion.div>
  );
}

export default ShootingStar;
