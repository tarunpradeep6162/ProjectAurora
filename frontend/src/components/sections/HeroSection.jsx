import Hero from "../home/Hero";
import { motion } from "framer-motion";

function HeroSection() {
  return (
    <section id="hero" className="relative w-full overflow-hidden bg-slate-950">
      
      {/* Cinematic Ambient Romantic Aura Backlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.15)_0%,rgba(168,85,247,0.05)_50%,transparent_80%)] pointer-events-none z-1" />

      {/* Main Hero Component Container */}
      <div className="relative z-10">
        <Hero />
      </div>

      {/* Romantic Cinematic Bottom Gradient Fade for Seamless Section Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-2" />

    </section>
  );
}

export default HeroSection;
