import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const cinematicEase = [0.16, 1, 0.3, 1];

function Lightbox({
  memories,
  selectedIndex,
  setSelectedIndex,
}) {
  const isOpen = selectedIndex !== null;

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const showNext = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === null
        ? 0
        : (currentIndex + 1) % memories.length,
    );
  };

  const showPrevious = () => {
    setSelectedIndex((currentIndex) =>
      currentIndex === null
        ? 0
        : (currentIndex - 1 + memories.length) %
          memories.length,
    );
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const memory =
    selectedIndex === null
      ? null
      : memories[selectedIndex];

  return (
    <AnimatePresence>
      {isOpen && memory && (
        <motion.div
          className="memory-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={memory.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLightbox}
        >
          <motion.div
            className="memory-lightbox__frame"
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}
            transition={{
              duration: 0.55,
              ease: cinematicEase,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="memory-lightbox__close"
              onClick={closeLightbox}
              aria-label="Close memory"
            >
              <span />
              <span />
            </button>

            <div className="memory-lightbox__image-wrap">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedIndex}
                  src={memory.image}
                  alt={memory.title}
                  className="memory-lightbox__image"
                  initial={{
                    opacity: 0,
                    scale: 1.04,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: cinematicEase,
                  }}
                />
              </AnimatePresence>
            </div>

            <div className="memory-lightbox__details">
              <div>
                <span className="memory-lightbox__tag">
                  {memory.tag}
                </span>

                <h2>{memory.title}</h2>

                <p>{memory.description}</p>
              </div>

              <span className="memory-lightbox__count">
                {String(selectedIndex + 1).padStart(2, "0")}
                <i />
                {String(memories.length).padStart(2, "0")}
              </span>
            </div>

            <button
              type="button"
              className="
                memory-lightbox__navigation
                memory-lightbox__navigation--previous
              "
              onClick={showPrevious}
              aria-label="Previous memory"
            >
              ←
            </button>

            <button
              type="button"
              className="
                memory-lightbox__navigation
                memory-lightbox__navigation--next
              "
              onClick={showNext}
              aria-label="Next memory"
            >
              →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Lightbox;
