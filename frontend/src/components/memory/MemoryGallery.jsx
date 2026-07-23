import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Lightbox from "../gallery/Lightbox";
import albumImage from "../../assets/images/album.jpg";

const cinematicEase = [0.16, 1, 0.3, 1];

const memories = [
  {
    image: albumImage,
    tag: "Chapter I",
    title: "The First Beautiful Moment",
    description:
      "The kind of memory that quietly becomes the beginning of everything.",
    position: "memory-gallery__item--large",
  },
  {
    image: albumImage,
    tag: "Chapter II",
    title: "A Smile Worth Remembering",
    description:
      "Some smiles stay in the heart long after the moment has passed.",
    position: "memory-gallery__item--tall",
  },
  {
    image: albumImage,
    tag: "Chapter III",
    title: "Our Little Universe",
    description:
      "A small moment, but one that made the whole world feel brighter.",
    position: "memory-gallery__item--standard",
  },
  {
    image: albumImage,
    tag: "Chapter IV",
    title: "The Journey Together",
    description:
      "Every road became special because I was travelling through it with you.",
    position: "memory-gallery__item--wide",
  },
  {
    image: albumImage,
    tag: "Chapter V",
    title: "The Memory I Keep",
    description:
      "A photograph captures the moment, but my heart remembers everything.",
    position: "memory-gallery__item--standard",
  },
];

function MemoryGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <div className="memory-gallery">
        {memories.map((memory, index) => (
          <motion.button
            key={`${memory.tag}-${index}`}
            type="button"
            className={`memory-gallery__item ${memory.position}`}
            onClick={() => setSelectedIndex(index)}
            aria-label={`Open ${memory.title}`}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 55,
                    scale: 0.96,
                    filter: "blur(10px)",
                  }
            }
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.9,
              delay: index * 0.08,
              ease: cinematicEase,
            }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -8,
                  }
            }
          >
            <div className="memory-gallery__image-wrap">
              <motion.img
                src={memory.image}
                alt={memory.title}
                loading="lazy"
                className="memory-gallery__image"
                whileHover={
                  reduceMotion
                    ? undefined
                    : {
                        scale: 1.07,
                      }
                }
                transition={{
                  duration: 0.8,
                  ease: cinematicEase,
                }}
              />

              <div
                className="memory-gallery__shade"
                aria-hidden="true"
              />

              <span className="memory-gallery__tag">
                {memory.tag}
              </span>

              <span
                className="memory-gallery__view"
                aria-hidden="true"
              >
                View memory
              </span>
            </div>

            <div className="memory-gallery__copy">
              <span className="memory-gallery__number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div>
                <h3>{memory.title}</h3>
                <p>{memory.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <Lightbox
        memories={memories}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </>
  );
}

export default MemoryGallery;
