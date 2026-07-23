import ScrollReveal from "../animations/ScrollReveal";
import { motion } from "framer-motion";

function FooterSection() {
  return (
    <footer 
      id="footer"
      className="relative min-h-screen w-full bg-transparent px-6 py-28 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Cinematic Deep Radial Vignette & Romantic Glow Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.22)_0%,rgba(168,85,247,0.1)_50%,transparent_80%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(2,6,23,0.95)_90%,rgba(2,6,23,1)_100%)] pointer-events-none z-0" />

      {/* Floating Romantic Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-pink-600/15 via-rose-500/10 to-purple-600/15 rounded-full blur-[180px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Main Content Container with ScrollReveal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
        <ScrollReveal>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
            className="w-full p-10 sm:p-16 rounded-3xl border border-pink-500/25 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950/95 backdrop-blur-2xl shadow-[0_0_70px_rgba(244,63,94,0.25)] flex flex-col items-center relative overflow-hidden group"
          >
            {/* Subtle Inner Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,105,180,0.12)_0%,transparent_70%)] pointer-events-none" />

            {/* Glowing Romantic Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-5 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
              <span className="text-xs uppercase tracking-[6px] text-pink-200 font-medium">
                Eternity Awaits
              </span>
            </div>

            {/* Cinematic Header Title */}
            <h2 className="text-4xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-500 tracking-tight leading-tight">
              Forever Starts Here ❤️
            </h2>

            {/* Romantic Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-pink-100/70 font-light italic max-w-xl leading-relaxed">
              Two souls, one infinite universe written in the stars.
            </p>

            {/* Divider Line */}
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent my-8" />

            {/* Creator Tag */}
            <div className="flex items-center gap-2 text-pink-200/80 text-sm tracking-wider font-light">
              <span>Crafted with infinite love and cinema by</span>
              <span className="font-semibold text-pink-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                Tarun
              </span>
              <span className="animate-pulse">✨</span>
            </div>

          </motion.div>
        </ScrollReveal>
      </div>

    </footer>
  );
}

export default FooterSection;
