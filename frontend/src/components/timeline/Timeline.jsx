import { motion } from "framer-motion";

const events = [
  {
    icon: "💬",
    title: "First Conversation",
    date: "The day everything started",
  },
  {
    icon: "☕",
    title: "First Meeting",
    date: "A memory I'll never forget",
  },
  {
    icon: "💖",
    title: "Fell in Love",
    date: "The happiest chapter of my life",
  },
  {
    icon: "🎂",
    title: "Your Birthday",
    date: "The reason for this surprise",
  },
  {
    icon: "♾️",
    title: "Forever Together",
    date: "Many more memories to come",
  },
];

function Timeline() {
  return (
    <div className="mx-auto max-w-4xl">

      <h2 className="mb-20 text-center text-6xl font-bold text-white">
        ❤️ Our Story
      </h2>

      <div className="relative">

        {/* Vertical Line */}
        <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-white/20"></div>

        {events.map((event, index) => (

          <motion.div
            key={index}
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className="relative mb-24 flex items-center justify-center"
          >

            {/* Timeline Dot */}
            <div className="absolute left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-pink-500 text-3xl shadow-xl">
              {event.icon}
            </div>

            {/* Card */}
            <div className="w-96 rounded-2xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl">

              <h3 className="text-2xl font-bold text-white">
                {event.title}
              </h3>

              <p className="mt-3 text-gray-300">
                {event.date}
              </p>

            </div>

          </motion.div>

        ))}

      </div>

    </div>
  );
}

export default Timeline;
