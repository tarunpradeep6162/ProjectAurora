import { motion } from "framer-motion";

function ShootingStar({ top, left, delay }) {
  return (
    <motion.div
      initial={{
        x: -120,
        y: -80,
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        x: 700,
        y: 400,
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.4],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 6,
        ease: "easeInOut",
      }}
      className="absolute pointer-events-none z-[1]"
      style={{
        top,
        left,
      }}
    >

      <div className="relative flex items-center">

        {/* Bright Star Head */}
        <div
          className="
          absolute
          right-0
          h-1.5
          w-1.5
          rounded-full
          bg-white
          shadow-[0_0_20px_#ffffff,0_0_35px_#ff69b4,0_0_50px_#ff1493]
          "
        />


        {/* Light Trail */}
        <div
          className="
          h-[2px]
          w-36
          rotate-[30deg]
          rounded-full
          bg-gradient-to-r
          from-transparent
          via-pink-300
          to-white
          shadow-[0_0_18px_rgba(255,105,180,0.8)]
          blur-[0.4px]
          "
        />


        {/* Heart Spark */}
        <motion.span
          animate={{
            scale:[0.8,1.3,0.8],
            opacity:[0.4,0.9,0.4],
          }}
          transition={{
            duration:0.8,
            repeat:Infinity,
            ease:"easeInOut",
          }}
          className="
          absolute
          -left-4
          -top-3
          text-[10px]
          text-pink-400
          drop-shadow-[0_0_10px_rgba(244,63,94,0.9)]
          "
        >
          ❤️
        </motion.span>

      </div>

    </motion.div>
  );
}

export default ShootingStar;
