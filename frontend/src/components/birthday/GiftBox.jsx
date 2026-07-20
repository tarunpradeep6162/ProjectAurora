import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

function GiftBox() {
const [opened, setOpened] = useState(false);

const width = window.innerWidth;
const height = window.innerHeight;

  return (
    <div className="flex flex-col items-center justify-center">
      {opened && (
  <Confetti
    width={width}
    height={height}
    numberOfPieces={350}
    recycle={false}
    gravity={0.18}
  />
)}

      {/* Gift Box */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => setOpened(true)}
        className="relative cursor-pointer"
      >
        {/* Glow */}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
          className="absolute inset-0 rounded-xl bg-pink-500/30 blur-2xl"
        />

        {/* Lid */}
        <motion.div
          animate={
            opened
              ? {
                  rotate: -35,
                  y: -40,
                  x: -15,
                }
              : {}
          }
          transition={{ duration: 0.8 }}
          className="relative z-10 h-10 w-48 rounded-t-lg bg-red-500"
        >
          <div className="absolute left-1/2 h-full w-4 -translate-x-1/2 bg-yellow-300"></div>
        </motion.div>

        {/* Box */}
        <div className="relative h-36 w-48 rounded-b-lg bg-red-600">
          <div className="absolute left-1/2 h-full w-4 -translate-x-1/2 bg-yellow-300"></div>

          <div className="absolute top-1/2 h-4 w-full -translate-y-1/2 bg-yellow-300"></div>
        </div>
      </motion.div>

      <p className="mt-8 text-gray-300">
        {opened ? "🎉 Surprise!" : "Click the gift to open"}
      </p>

      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="mt-10 max-w-2xl text-center"
          >
            <h2 className="text-6xl font-bold text-pink-300">
              Happy Birthday ❤️
            </h2>

            <p className="mt-6 text-xl text-gray-300">
              May your smile always shine brighter than the stars.
              Thank you for filling my life with happiness,
              laughter, and endless love.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default GiftBox;
