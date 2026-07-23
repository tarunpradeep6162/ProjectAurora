import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import Lenis from "lenis";

import LoadingScreen from "./components/common/LoadingScreen";
import Home from "./pages/Home";

function App() {
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });

    let animationFrame;

    const animate = (time) => {
      lenis.raf(time);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return (
    <div className="experience">
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingScreen
            key="loading"
            onComplete={() => setLoading(false)}
          />
        ) : (
          <motion.div
            key="story"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 1.1,
            }}
          >
            <Home />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
