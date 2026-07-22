import { motion } from "framer-motion";
import GalaxyBackground from "../effects/GalaxyBackground";
import ShootingStars from "../effects/ShootingStars";

function Hero() {
  const subtitleText =
    "Every beautiful memory we created together has become a star in my universe.";

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white flex items-center justify-center">

      {/* Three.js Galaxy */}
      <div className="absolute inset-0 z-[0] pointer-events-none">
        <GalaxyBackground />
      </div>


      {/* Shooting Stars */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <ShootingStars />
      </div>


      {/* Cinematic Vignette */}
      <div
        className="
        absolute inset-0 
        z-[2]
        pointer-events-none
        bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]
        "
      />


      {/* Film Grain */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      />


      {/* Aurora Glow */}
      <div className="absolute inset-0 z-[4] pointer-events-none overflow-hidden">

        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
          absolute -top-40 -left-40
          h-[500px] w-[500px]
          rounded-full
          bg-pink-600/30
          blur-[150px]
          "
        />


        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
          absolute top-1/4 -right-20
          h-[500px] w-[500px]
          rounded-full
          bg-rose-600/25
          blur-[160px]
          "
        />


        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
          absolute -bottom-20 left-1/2 -translate-x-1/2
          h-[450px] w-[450px]
          rounded-full
          bg-purple-600/20
          blur-[140px]
          "
        />

      </div>


      {/* Hero Content */}
      <div
        className="
        relative z-[10]
        flex min-h-screen w-full
        flex-col items-center justify-center
        px-6 text-center
        max-w-5xl mx-auto
        "
      >

        {/* Badge */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1.2,
          }}
          className="
          mb-6 inline-flex items-center gap-2
          rounded-full
          border border-pink-500/30
          bg-pink-500/10
          px-5 py-2
          backdrop-blur-xl
          shadow-[0_0_20px_rgba(244,63,94,0.2)]
          "
        >
          <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />

          <span className="
          text-xs uppercase
          tracking-[6px]
          text-pink-200
          font-medium
          ">
            Dedicated To My Everything
          </span>

        </motion.div>



        {/* Main Title */}
        <motion.h1
          initial={{
            opacity: 0,
            scale: 0.9,
            filter: "blur(10px)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className="
          text-6xl
          sm:text-7xl
          md:text-9xl
          font-black
          tracking-tight
          text-transparent
          bg-clip-text
          bg-gradient-to-r
          from-white
          via-pink-100
          to-pink-500
          drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]
          "
        >
          Happy Birthday ❤️
        </motion.h1>



        {/* Description */}
        <motion.p
          initial={{
            opacity:0,
            y:20,
          }}
          animate={{
            opacity:1,
            y:0,
          }}
          transition={{
            delay:0.6,
            duration:1.2,
          }}
          className="
          mt-8
          max-w-2xl
          text-lg
          sm:text-xl
          text-pink-100/80
          font-light
          leading-relaxed
          tracking-wide
          italic
          "
        >
          "{subtitleText}"
        </motion.p>



        {/* Button */}
        <motion.button
          initial={{
            opacity:0,
            y:30,
          }}
          animate={{
            opacity:1,
            y:0,
          }}
          transition={{
            delay:1,
            duration:1,
          }}
          whileHover={{
            scale:1.08,
          }}
          whileTap={{
            scale:0.95,
          }}
          className="
          group
          relative
          mt-12
          overflow-hidden
          rounded-full
          border
          border-white/20
          bg-white/10
          px-10
          py-4
          backdrop-blur-2xl
          shadow-[0_0_30px_rgba(255,105,180,0.25)]
          "
        >

          <div
            className="
            absolute inset-0
            bg-gradient-to-r
            from-transparent
            via-white/20
            to-transparent
            -translate-x-full
            group-hover:translate-x-full
            transition-transform
            duration-1000
            "
          />

          <span className="
          relative z-10
          text-sm
          sm:text-base
          font-semibold
          tracking-widest
          uppercase
          flex items-center gap-3
          ">
            Begin the Journey ✨
          </span>

        </motion.button>


      </div>

    </section>
  );
}

export default Hero;
