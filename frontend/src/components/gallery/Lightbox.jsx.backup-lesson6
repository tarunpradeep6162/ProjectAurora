import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

function Lightbox({
  memories,
  selectedIndex,
  setSelectedIndex,
}) {
  const onClose = () => setSelectedIndex(null);

  const nextImage = () => {
    setSelectedIndex((selectedIndex + 1) % memories.length);
  };

  const prevImage = () => {
    setSelectedIndex(
      (selectedIndex - 1 + memories.length) % memories.length
    );
  };

  useEffect(() => {
    function handleKey(event) {
      if (selectedIndex === null) return;

      if (event.key === "Escape") onClose();

      if (event.key === "ArrowRight") nextImage();

      if (event.key === "ArrowLeft") prevImage();
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  });

  if (selectedIndex === null) return null;

  const memory = memories[selectedIndex];

  return (
    <AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >

        <motion.img
          src={memory.image}
          alt={memory.title}
          className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        />

        <h2 className="mt-8 text-3xl font-bold text-white">
          {memory.title}
        </h2>

        <p className="mt-2 text-gray-300">
          {memory.description}
        </p>

        <p className="mt-6 text-white">
          {selectedIndex + 1} / {memories.length}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage();
          }}
          className="absolute left-10 top-1/2 rounded-full bg-white/10 p-4 text-3xl text-white backdrop-blur-md"
        >
          ←
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage();
          }}
          className="absolute right-10 top-1/2 rounded-full bg-white/10 p-4 text-3xl text-white backdrop-blur-md"
        >
          →
        </button>

      </motion.div>

    </AnimatePresence>
  );
}

export default Lightbox;
