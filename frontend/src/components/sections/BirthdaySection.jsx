import ScrollReveal from "../animations/ScrollReveal";
import GiftBox from "../birthday/GiftBox";
import { motion } from "framer-motion";

function BirthdaySection() {
  return (
    <section 
      id="birthday"
      className="relative min-h-screen w-full bg-slate-950 px-6 py-28 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Cinematic Deep Radial Vignette & Romantic Glow Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.2)_0%,rgba(168,85,247,0.08)_50%,transparent_80%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(2,6,23,0.9)_90%,rgba(2,6,23,1)_100%)] pointer-events-none z-0" />

      {/* Floating Romantic Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-pink-600/15 via-rose-500/10 to-purple-600/10 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '5s' }} />

      {/* Header Container */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12 flex flex-col items-center">
        
        {/* Romantic Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-5 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.25)]"
        >
          <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
          <span className="text-xs uppercase tracking-[6px] text-pink-200 font-medium">
            A Special Surprise
          </span>
        </motion.div>

        {/* Cinematic Header Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-4xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-500 tracking-tight"
        >
          Unwrap Your Magic 🎁
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-pink-100/70 font-light italic"
        >
          A token of infinite love, sealed with stars and cinematic wonder.
        </motion.p>
      </div>

      {/* Gift Box Container with ScrollReveal & Cinematic Glow Frame */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center">
        <ScrollReveal>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
            className="p-8 sm:p-12 rounded-3xl border border-pink-500/20 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(244,63,94,0.2)] flex items-center justify-center relative overflow-hidden"
          >
            {/* Inner Radial Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,105,180,0.1)_0%,transparent_70%)] pointer-events-none" />
            
            <GiftBox />
          </motion.div>
        </ScrollReveal>
      </div>

      {/* Seamless Transition Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-2" />
    </section>
  );
}

export default BirthdaySection;
