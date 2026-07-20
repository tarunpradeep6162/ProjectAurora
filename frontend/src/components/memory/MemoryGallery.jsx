import { useState } from "react";
import MemoryCard from "./MemoryCard";
import Lightbox from "../gallery/Lightbox";

const memories = [
  {
    image: "https://picsum.photos/600/400?random=1",
    title: "Our First Smile ❤️",
    description: "Every beautiful journey starts with one unforgettable moment.",
  },
  {
    image: "https://picsum.photos/600/400?random=2",
    title: "Together Forever 💕",
    description: "Every picture tells a story that words never can.",
  },
  {
    image: "https://picsum.photos/600/400?random=3",
    title: "Beautiful Memories 📸",
    description: "The best moments become our favorite memories.",
  },
];
function MemoryGallery() {
const [selectedImage, setSelectedImage] = useState(null);
  return (
    <div className="mx-auto max-w-7xl px-6">

      <h2 className="mb-16 text-center text-6xl font-bold text-white">
        Beautiful Memories 📸
      </h2>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">

        {memories.map((memory, index) => (
         <div
  key={index}
  onClick={() => setSelectedImage(memory.image)}
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
  image={selectedImage}
  onClose={() => setSelectedImage(null)}
/>
    </div>
  );
}

export default MemoryGallery;
