import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let currentProgress = 0;

    const interval = window.setInterval(() => {
      const increment = Math.floor(Math.random() * 8) + 3;

      currentProgress = Math.min(currentProgress + increment, 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        window.clearInterval(interval);

        window.setTimeout(() => {
          setVisible(false);

          if (typeof onComplete === "function") {
            onComplete();
          }
        }, 700);
      }
    }, 120);

    // Emergency fallback so the website can never remain stuck.
    const fallbackTimeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setProgress(100);

      window.setTimeout(() => {
        setVisible(false);

        if (typeof onComplete === "function") {
          onComplete();
        }
      }, 400);
    }, 8000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fallbackTimeout);
    };
  }, [onComplete]);

  const safeProgress = Number.isFinite(progress)
    ? Math.min(Math.max(Math.round(progress), 0), 100)
    : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070506]"
        >
          <div className="w-full max-w-xl px-6 text-center">
            <p className="mb-8 text-xs uppercase tracking-[0.5em] text-white/50">
              A universe created for you
            </p>

            <h1 className="text-5xl font-semibold text-white sm:text-7xl">
              Dheepika
            </h1>

            <h2 className="mt-2 text-4xl font-semibold text-white sm:text-6xl">
              Chlmm 🤍 🩷
            </h2>

            <p className="mt-8 text-lg italic text-white/45">
              Preparing something magical...
            </p>

            <div className="mt-12 h-px overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-white/70"
                animate={{ width: `${safeProgress}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>

            <p className="mt-7 text-lg text-white/70">
              {safeProgress}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingScreen;
