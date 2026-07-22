import { useState } from "react";
import MemoryCard from "./MemoryCard";
import Lightbox from "../gallery/Lightbox";

const memories = [
  {
    image: "https://picsum.photos/800/600?random=1",
    title: "Our First Smile ❤️",
    description: "Every beautiful journey starts with one unforgettable moment.",
  },
  {
    image: "https://picsum.photos/800/600?random=2",
    title: "Together Forever 💕",
    description: "Every picture tells a story that words never can.",
  },
  {
    image: "https://picsum.photos/800/600?random=3",
    title: "Beautiful Memories 📸",
    description: "The best moments become our favorite memories.",
  },
];
function MemoryGallery() {
const [selectedIndex, setSelectedIndex] = useState(null);
  return (
    <div className="mx-auto max-w-7xl px-6">

      <h2 className="mb-16 text-center text-6xl font-bold text-white">
        Beautiful Memories 📸
      </h2>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">

        {memories.map((memory, index) => (
         <div
  key={index}
onClick={() => setSelectedIndex(index)}
  className="cursor-pointer"
>
  <MemoryCard
    image={memory.image}
    title={memory.title}
    description={memory.description}
  />
</div>        
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
