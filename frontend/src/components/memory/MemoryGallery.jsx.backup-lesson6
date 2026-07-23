import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MemoryCard from "./MemoryCard";
import Lightbox from "../gallery/Lightbox";

const memories = [
  {
    image: "https://picsum.photos/800/600?random=1",
    title: "Our First Smile ❤️",
    description: "Every beautiful journey starts with one unforgettable moment.",
    tag: "Chapter I",
  },
  {
    image: "https://picsum.photos/800/600?random=2",
    title: "Together Forever 💕",
    description: "Every picture tells a story that words never can.",
    tag: "Chapter II",
  },
  {
    image: "https://picsum.photos/800/600?random=3",
    title: "Beautiful Memories 📸",
    description: "The best moments become our favorite memories.",
    tag: "Chapter III",
  },
];

function MemoryGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-12">
      
      {/* Section Header */}
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-5 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(244,63,94,0.2)]"
        >
          <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />
          <span className="text-xs uppercase tracking-[6px] text-pink-200 font-medium">
            Immersive Gallery
          </span>
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-4xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-500 tracking-tight"
        >
          Beautiful Memories 📸
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-pink-100/70 font-light italic"
        >
          Click any frame to step inside our cinematic universe.
        </motion.p>
      </div>

      {/* Unique Cinematic Grid Layout */}
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {memories.map((memory, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
            onClick={() => setSelectedIndex(index)}
            className="group relative cursor-pointer"
          >
            {/* Outer Glowing Holographic Border Wrapper */}
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-b from-pink-500/40 via-purple-500/20 to-transparent opacity-50 blur-sm group-hover:opacity-100 transition duration-700 pointer-events-none" />

            <div className="relative rounded-3xl border border-pink-500/25 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/95 p-4 backdrop-blur-2xl shadow-[0_0_40px_rgba(244,63,94,0.15)] overflow-hidden">
              
              {/* Chapter Tag Badge */}
              <div className="absolute top-7 left-7 z-20 inline-flex items-center gap-1.5 rounded-full border border-pink-500/30 bg-slate-950/70 px-3 py-1 backdrop-blur-md text-[10px] uppercase tracking-[3px] text-pink-200">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                {memory.tag}
              </div>

              {/* Memory Card Container with Smooth Hover Scale */}
              <div className="overflow-hidden rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                <MemoryCard
                  image={memory.image}
                  title={memory.title}
                  description={memory.description}
                />
              </div>

              {/* Bottom Subtle Shimmer Accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
        ))}
      </div>

      <Lightbox
        memories={memories}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </div>
  );
}

export default MemoryGallery;
