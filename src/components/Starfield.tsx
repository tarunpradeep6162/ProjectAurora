"use client";

import { useEffect, useState } from "react";

type Star = { id: number; x: number; y: number; r: number; o: number; delay: number };

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 0.22 + 0.06,
    o: Math.random() * 0.6 + 0.25,
    delay: Math.random() * 6,
  }));
}

/**
 * Lightweight CSS/SVG starfield used behind the portal hero. Deliberately
 * not Three.js — a few hundred static dots plus one slow CSS rotation gives
 * the same atmospheric backdrop for a fraction of the JS payload.
 *
 * Stars are generated only after mount (empty on the server) so the
 * randomized positions never disagree between server and client render,
 * which would otherwise trip a hydration mismatch.
 */
export default function Starfield({ count = 140 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Intentional one-time client-only randomization: rendering an empty
    // starfield on the server and filling it in after mount is what avoids
    // a hydration mismatch here, so this justified use of setState-in-effect
    // is exempted from the usual lint guidance against it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(generateStars(count));
  }, [count]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden [animation:spin_240s_linear_infinite] motion-reduce:[animation:none]"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-[140%] w-[140%] -translate-x-[10%] -translate-y-[15%]"
      >
        {stars.map((s) => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="var(--accent-soft)"
            opacity={s.o}
            style={{
              animation: `twinkle ${4 + s.delay}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
