import { motion } from "framer-motion";

function ShootingStar({
  top = "20%",
  left = "10%",
  delay = 0,
  duration = 1.8,
  repeatDelay = 8,
  distanceX = 760,
  distanceY = 380,
  trailLength = 150,
  rotation = 28,
  scale = 1,
  showHeart = true,
}) {
  return (
    <motion.div
      initial={{
        x: -140,
        y: -90,
        opacity: 0,
        scale: 0.45 * scale,
      }}
      animate={{
        x: distanceX,
        y: distanceY,
        opacity: [0, 0.95, 1, 0],
        scale: [
          0.45 * scale,
          1.08 * scale,
          0.92 * scale,
          0.38 * scale,
        ],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay,
        ease: [0.22, 0.72, 0.3, 1],
      }}
      className="absolute pointer-events-none will-change-transform"
      style={{
        top,
        left,
      }}
    >
      <div
        className="relative flex items-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "right center",
        }}
      >
        <div
          className="
            absolute
            right-[-2px]
            top-1/2
            h-2
            w-2
            -translate-y-1/2
            rounded-full
            bg-white
            shadow-[
              0_0_8px_rgba(255,255,255,1),
              0_0_20px_rgba(255,182,223,0.95),
              0_0_38px_rgba(255,54,148,0.78)
            ]
          "
        />

        <div
          className="
            absolute
            right-0
            top-1/2
            h-[1px]
            -translate-y-1/2
            rounded-full
            bg-gradient-to-r
            from-transparent
            via-pink-300/70
            to-white
            blur-[0.2px]
            shadow-[0_0_12px_rgba(255,105,180,0.65)]
          "
          style={{
            width: `${trailLength}px`,
          }}
        />

        <div
          className="
            absolute
            right-0
            top-1/2
            h-[3px]
            -translate-y-1/2
            rounded-full
            bg-gradient-to-r
            from-transparent
            via-fuchsia-400/15
            to-white/70
            blur-[2px]
          "
          style={{
            width: `${trailLength * 0.72}px`,
          }}
        />

        {showHeart && (
          <motion.span
            animate={{
              scale: [0.72, 1.18, 0.78],
              opacity: [0.18, 0.82, 0.18],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              absolute
              right-[55%]
              top-[-13px]
              text-[9px]
              drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]
            "
          >
            ❤️
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

export default ShootingStar;
