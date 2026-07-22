import Timeline from "../timeline/Timeline";
import { motion } from "framer-motion";

function StorySection() {
  return (
    <section
      id="story"
      className="relative min-h-screen w-full bg-slate-950 px-6 py-24 overflow-hidden flex flex-col items-center justify-center"
    >
      {/* Cinematic Deep Vignette & Radial Background Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.12)_0%,rgba(168,85,247,0.05)_45%,transparent_80%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(2,6,23,0.85)_90%,rgba(2,6,23,1)_100%)] pointer-events-none z-0" />

      {/* Romantic Floating Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-pink-600/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Section Header */}
      <div className="relative z-10 text-center mb-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-5 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.2)] mb-4"
        >
          <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
          <span className="text-xs uppercase tracking-[6px] text-pink-200 font-medium">
            Our Journey Together
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-500 tracking-tight"
        >
          Moments Etched in Stars ✨
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-pink-100/70 font-light italic"
        >
          Every chapter of our story is a constellation in our universe.
        </motion.p>
      </div>

      {/* Main Timeline Component Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <Timeline />
      </div>

      {/* Seamless Bottom Cinematic Transition Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-2" />
    </section>
  );
}

export default StorySection;
