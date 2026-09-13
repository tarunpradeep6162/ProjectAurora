"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function ChapterMiracle() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) {
        gsap.set("[data-miracle-mask] span", { yPercent: 0 });
        return;
      }

      // The line reveal is the whole of this chapter's motion now. The
      // photograph behind it used to be parallaxed 12% as well; at 14%
      // opacity that drift was barely perceptible as movement and only
      // succeeded in smearing the one real photograph on the page. This
      // chapter is stronger held completely still — a quiet photograph and
      // a single line of type.
      gsap.to("[data-miracle-mask] span", {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: root.current,
          start: "top 65%",
        },
      });
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <section
      ref={root}
      id="miracle"
      aria-label="Chapter 2: You are my favourite miracle"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-transparent py-32"
    >
      {/* Raised from 0.14 now that it is no longer moving and the grain
          over it has been reduced: still far from competing with the
          heading, but enough that it reads as a photograph rather than as
          an indistinct texture. */}
      <div
        data-miracle-bg
        className="absolute inset-0 opacity-[0.2]"
        aria-hidden="true"
      >
        <Image
          src="/images/album.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        {/* Was a fully opaque bg-background gradient — softened to /60 so
            the persistent cosmic backdrop still reads through this chapter
            instead of being fully hidden behind it (brief Part 1). */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/35 to-background/60" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <span className="mb-6 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
          Chapter 02
        </span>
        <h2
          data-miracle-mask
          className="mask-line font-display text-[clamp(1.9rem,5.5vw,3.6rem)] leading-tight text-foreground"
        >
          <span className="inline-block translate-y-full">
            You are my favourite miracle
          </span>
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-balance font-body text-base leading-relaxed text-foreground-muted sm:text-lg">
          A cinematic beginning for the person who made ordinary days feel
          extraordinary.
        </p>
      </div>
    </section>
  );
}
