import { motion } from "framer-motion";

const events = [
  {
    icon: "💬",
    title: "First Conversation",
    date: "The day everything started",
    subtitle: "A simple hello that changed entire galaxies.",
  },
  {
    icon: "☕",
    title: "First Meeting",
    date: "A memory I'll never forget",
    subtitle: "Time stood still the moment our eyes met.",
  },
  {
    icon: "💖",
    title: "Fell in Love",
    date: "The happiest chapter of my life",
    subtitle: "Every heartbeat since then whispers your name.",
  },
  {
    icon: "🎂",
    title: "Your Birthday",
    date: "The reason for this surprise",
    subtitle: "Celebrating the day an absolute masterpiece was born.",
  },
  {
    icon: "♾️",
    title: "Forever Together",
    date: "Many more memories to come",
    subtitle: "Hand in hand through every universe yet to be written.",
  },
];

function Timeline() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-12">
      
      {/* Central Glowing Energy Beam (Vertical Line) */}
      <div className="absolute left-1/2 top-12 bottom-12 w-[2px] -translate-x-1/2 bg-gradient-to-b from-pink-500/0 via-pink-500/80 to-purple-600/0 shadow-[0_0_15px_rgba(244,63,94,0.8)]" />

      <div className="relative space-y-24">
        {events.map((event, index) => {
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.15 * index, ease: "easeOut" }}
              className={`relative flex items-center justify-between ${
                isEven ? "flex-row-reverse" : "flex-row"
              }`}
            >
              
              {/* Spacer for alternating layout on desktop */}
              <div className="hidden md:block w-[42%]" />

              {/* Glowing Center Core / Icon Node */}
              <div className="absolute left-1/2 z-20 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border border-pink-500/50 bg-gradient-to-br from-slate-900 via-slate-950 to-pink-950 text-2xl shadow-[0_0_30px_rgba(244,63,94,0.6)] backdrop-blur-xl">
                <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                  {event.icon}
                </span>
                
                {/* Pulsing ring aura */}
                <div className="absolute inset-0 rounded-full border border-pink-400/40 animate-ping opacity-30 pointer-events-none" />
              </div>

              {/* Cinematic Glassmorphism Card */}
              <div className="w-full md:w-[42%]">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="group relative rounded-3xl border border-pink-500/25 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 p-8 backdrop-blur-2xl shadow-[0_0_40px_rgba(244,63,94,0.15)] overflow-hidden text-left"
                >
                  {/* Hover ambient highlight */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,105,180,0.12)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Date Pill Tag */}
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1 text-xs uppercase tracking-[3px] text-pink-200 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                    {event.date}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-400 tracking-tight">
                    {event.title}
                  </h3>

                  {/* Subtitle / Description */}
                  <p className="mt-3 text-sm sm:text-base text-pink-100/70 font-light italic leading-relaxed">
                    "{event.subtitle}"
                  </p>

                  {/* Bottom decorative glowing accent line */}
                  <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-pink-500/40 via-purple-500/20 to-transparent" />
                </motion.div>
              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}

export default Timeline;
