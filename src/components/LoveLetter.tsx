"use client";

import { useRef } from "react";
import { loveLetter } from "@/lib/content";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";

/**
 * Chapter 6 — the letter, in its own quiet reading mode.
 *
 * Everything that came before it is spectacle; this is the one place on the
 * site that asks for none. No card, no glass, no border, no glow — Tarun's
 * words set in the serif at reading size (18-20px on a phone, up to 24px on
 * a desktop), a 42rem measure, long line-height and real space between
 * paragraphs. The words are his and are rendered exactly as they are in
 * content.ts.
 *
 * Reveal is per paragraph, as each one arrives near the bottom of the
 * screen — never word by word — and anything the visitor has already
 * scrolled past (fast scrolling, a chapter jump) appears immediately. See
 * useInViewReveal: no text here depends on requestAnimationFrame,
 * IntersectionObserver or scroll events to become visible.
 */
export default function LoveLetter() {
  const root = useRef<HTMLElement>(null);
  useInViewReveal(root, { enter: 0.9, instant: 0.4, stagger: 180 });

  return (
    <section
      ref={root}
      id="letter"
      aria-labelledby="letter-title"
      className="relative w-full overflow-hidden"
    >
      {/* The site goes quiet here: a near-black wash that fades in from the
          photographs above and back out towards the candle, so the chapter
          has no hard edge, and the cosmic sky is reduced to a whisper
          behind the words. */}
      <div aria-hidden="true" className="letter-hush" />

      <div className="relative z-10 mx-auto w-full max-w-[48rem] px-[max(1.5rem,env(safe-area-inset-left))] pt-[clamp(9rem,26svh,15rem)] pb-[clamp(7rem,20svh,12rem)] sm:px-10">
        <header className="text-center">
          <p className="type-meta" data-reveal="fade">
            Chapter 06
          </p>
          <h2 id="letter-title" className="type-chapter mt-5" data-reveal="mask">
            <span className="reveal-line">A letter from my heart</span>
          </h2>
          <p
            className="type-emotion mx-auto mt-6 max-w-[30rem]"
            data-reveal="fade"
          >
            Some feelings deserve more than a message. They deserve a universe
            of their own.
          </p>
        </header>

        <div
          aria-hidden="true"
          className="mx-auto mt-[clamp(4.5rem,13svh,7.5rem)] h-px w-10 bg-[rgba(215,185,122,0.32)]"
        />

        <article
          aria-label="The letter"
          className="letter-body mx-auto mt-[clamp(4.5rem,13svh,7.5rem)] max-w-[42rem]"
        >
          <p className="type-letter letter-salutation" data-reveal="fade">
            {loveLetter.salutation}
          </p>

          {loveLetter.paragraphs.map((paragraph, i) => (
            <p key={i} className="type-letter letter-paragraph" data-reveal="fade">
              {paragraph}
            </p>
          ))}

          {/* Space before the signature, then one small warm point of light
              beside his name — no flourish. It hands over to the single
              remaining light of the letter -> candle transition
              (`--seam-lastlight`) as the visitor moves on. */}
          <div className="letter-signoff" data-reveal="fade">
            <p className="type-letter">{loveLetter.signOff}</p>
            <p className="letter-signature">
              {loveLetter.signature}
              <span aria-hidden="true" className="letter-light" />
            </p>
          </div>
        </article>

        <p
          className="type-emotion mx-auto mt-[clamp(7rem,26svh,15rem)] max-w-[24rem] text-center text-[1.15rem] text-[rgba(221,211,197,0.6)]"
          data-reveal="fade"
        >
          {loveLetter.closingDetail}
        </p>
      </div>
    </section>
  );
}
