import { motion } from "framer-motion";

function Nebula() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">

      {/* Deep Rose Romantic Gas Cloud */}
      <motion.div
        animate={{
          x: [0, 80, -50, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.3, 0.95, 1.1],
          opacity: [0.25, 0.45, 0.3, 0.25],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        -top-20
        -left-20
        h-[600px]
        w-[600px]
        rounded-full
        bg-gradient-to-tr
        from-pink-600/30
        via-rose-500/20
        to-transparent
        blur-[160px]
        mix-blend-screen
        "
      />


      {/* Magenta Stardust Cloud */}
      <motion.div
        animate={{
          x: [0, -90, 60, 0],
          y: [0, 60, -40, 0],
          scale: [1, 1.25, 1.1, 1],
          opacity: [0.2, 0.4, 0.25, 0.2],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        -bottom-32
        -right-32
        h-[700px]
        w-[700px]
        rounded-full
        bg-gradient-to-br
        from-purple-600/25
        via-pink-500/25
        to-rose-600/10
        blur-[180px]
        mix-blend-screen
        "
      />


      {/* Central Volumetric Glow */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        top-1/2
        left-1/2
        -translate-x-1/2
        -translate-y-1/2
        h-[500px]
        w-[500px]
        rounded-full
        bg-rose-500/15
        blur-[150px]
        mix-blend-screen
        "
      />


      {/* Cosmic Dust Gradient */}
      <div
        className="
        absolute
        inset-0
        bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
        from-pink-500/10
        via-transparent
        to-transparent
        opacity-60
        "
      />

    </div>
  );
}

export default Nebula;
