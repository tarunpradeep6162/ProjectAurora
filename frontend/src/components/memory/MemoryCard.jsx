import { motion } from "framer-motion";

function MemoryCard({ image, title, description }) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.03,
      }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl"
    >
      <div className="overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-72 w-full object-cover transition duration-500 hover:scale-110"
        />
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-white">
          {title}
        </h3>

        <p className="mt-3 text-gray-300">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default MemoryCard;
