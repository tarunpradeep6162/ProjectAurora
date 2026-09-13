"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { loveLetter } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function LoveLetter() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from("[data-letter-line]", {
        opacity: 0,
        y: 18,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: root.current,
          start: "top 60%",
        },
      });
    },
    { scope: root, dependencies: [reduced] }
  );

  return (
    <section
      ref={root}
      id="letter"
      aria-label="Chapter 6: A letter from my heart"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background/70 px-6 py-32"
    >
      {/* Unlike the other chapters (transparent, letting the persistent
          cosmic backdrop read fully through), the Letter keeps a
          translucent wash here — the site's established "everything goes
          quieter" treatment for this chapter (see SiteAudioPlayer's volume
          ramp), paired with the starfield's own reduced motion/opacity at
          this chapter (StarField.tsx's `uCalm`) rather than hiding the
          backdrop outright. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,131,111,0.12),transparent_60%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="mb-12 text-center">
          <span className="mb-4 block text-[11px] tracking-[0.35em] uppercase text-accent-soft">
            Chapter 06
          </span>
          <h2 className="font-display text-[clamp(1.8rem,5vw,3.2rem)] leading-tight text-foreground">
            A letter from my heart
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-foreground-muted">
            Some feelings deserve more than a message. They deserve a
            universe of their own.
          </p>
        </div>

        <article className="rounded-2xl border border-line bg-background-deep/60 p-8 sm:p-12 shadow-2xl backdrop-blur-sm">
          <p data-letter-line className="font-display text-xl italic text-accent-soft">
            {loveLetter.salutation}
          </p>
          <div className="mt-6 space-y-5">
            {loveLetter.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                data-letter-line
                className="text-balance font-body text-[1.125rem] leading-[1.8] text-foreground sm:text-lg sm:leading-[1.75]"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <p data-letter-line className="mt-8 font-display text-lg text-foreground-muted">
            {loveLetter.signOff}
            <br />
            {/* The signature carries a faint gold glow that settles to
                nothing as the letter/candle boundary approaches — the first
                beat of that transition (see `.letter-signature` and
                `--seam-lastlight` in globals.css). */}
            <span className="letter-signature text-2xl italic text-accent-soft">
              {loveLetter.signature}
            </span>
          </p>
        </article>

        <p
          data-letter-line
          className="mt-8 text-center text-sm italic text-foreground-muted/80"
        >
          {loveLetter.closingDetail}
        </p>
      </div>
    </section>
  );
}
