"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { memories } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useInViewReveal } from "@/components/chapters/useInViewReveal";
import { usePointerParallax } from "@/hooks/usePointerParallax";
import { focusFor } from "@/components/chapters/photoFraming";
import { useWebGLActive } from "@/hooks/useWebGLActive";
import CosmicPath from "@/components/cosmic/CosmicPath";

/**
 * Three of the real photographs, appearing as faint ghosts along the road —
 * the same restrained device the finale later reprises for its own ghosts
 * (memory-1 and memory-5 appear in both, an intentional, subtle echo: the
 * same light that passed by here is what she gets back at the end).
 * Decorative duplicates of images shown properly, with their captions, in
 * chapter 05 — carry empty alt text for that reason. memory-2 is skipped
 * here on purpose: its frame has baked-in text ("Travel With Your Soul")
 * that reads as noise at low opacity.
 */
const GHOST_IDS = ["memory-4", "memory-1", "memory-5"];
const ghosts = GHOST_IDS.map((id) => memories.find((m) => m.id === id)).filter(
  (m): m is (typeof memories)[number] => Boolean(m)
);
// The last ghost (memory-5 — "the one I would keep") is this chapter's
// signature shot: it dissolves instead of just fading, scattering into the
// small ember points below. Index into `ghosts`, not `GHOST_IDS`, in case a
// future edit ever changes which id is last.
const SIGNATURE_INDEX = ghosts.length - 1;

// Fixed, hand-placed scatter offsets (px) rather than randomized at
// render/mount — this is a small, one-time decorative burst, not a system
// that needs runtime variety, and a literal array keeps it reproducible
// (the same pattern CONSTELLATION_POINTS/CONSTELLATION_CONTROLS already use
// elsewhere in this project for exactly this reason).
const EMBER_OFFSETS: readonly [number, number][] = [
  [22, -38],
  [-30, -20],
  [34, 14],
  [-16, 34],
  [10, -52],
  [-36, 24],
];

/**
 * Chapter 4. The path draws itself as the visitor scrolls through, over the
 * cosmic dust (CosmicPath) that already traces the same curve behind it, and
 * a handful of real photographs pass by as ghosts, staggered across the same
 * scroll range — the road visibly carrying memories rather than an empty
 * line, without turning into a second photo gallery (that stays chapter 05's
 * job). They fade out before the path finishes drawing, so what's left by
 * the end is only points of light — the same points the constellation picks
 * up next.
 *
 * Restraint pass: the drawn stroke is a fine line now rather than a 2.5px
 * gold road — the dust layer carries the "glowing path", and two bright
 * paths on top of each other read as a diagram.
 */
export default function ChapterJourney() {
  const root = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // The real WebGL photo-dissolve (PhotoDissolve.tsx, mounted in the
  // persistent canvas) takes over the signature shot on capable devices;
  // this DOM/CSS treatment is its fallback for reduced motion, a low-power
  // device, or WebGL being unavailable — never rendered at the same time as
  // the real one.
  const webglActive = useWebGLActive();
  useInViewReveal(root);
  // The live site's own subtle mouse drift on chapter copy — recovered
  // exact strength/damping (see usePointerParallax.ts). Ghosts deliberately
  // do not get their own parallax layer — one more drifting layer here would
  // read as busier, not more cinematic.
  usePointerParallax(copyRef);

  useGSAP(
    () => {
      if (reduced) return;

      // One timeline, one ScrollTrigger, spanning the whole chapter — the
      // drawn path and the ghost photographs both live on it so they can
      // never drift out of agreement with each other, and so this stays one
      // scrubbed trigger for the section rather than several redundant ones
      // covering the identical range.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 70%",
          end: "bottom 40%",
          scrub: 1,
        },
      });

      const path = root.current?.querySelector<SVGPathElement>("[data-path]");
      if (path) {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      }

      // Each ghost gets a narrow window of its own on the same 0-1 timeline
      // — arrive, hold briefly, fade — staggered so only one is ever
      // prominent, and all three are gone well before the path finishes (the
      // "photos fade but points remain" beat, handing off to the
      // constellation next).
      const ghostEls = gsap.utils.toArray<HTMLElement>("[data-journey-ghost]");
      ghostEls.forEach((el, i) => {
        const start = 0.08 + i * 0.24;
        const isSignature = el.hasAttribute("data-signature");
        gsap.set(el, { opacity: 0, scale: 1.04 });
        if (isSignature) gsap.set(el, { "--dissolve": 1 });
        tl.to(el, { opacity: 0.16, scale: 1, ease: "sine.out", duration: 0.18 }, start)
          .to(el, { opacity: 0.16, duration: 0.1 }, start + 0.18);

        if (isSignature) {
          // The signature shot dissolves rather than simply fading — mask
          // radius collapses to the centre while the embers (below) scatter
          // outward from that same point. Same [start+0.28, start+0.44]
          // envelope every other ghost's plain fade-out uses (which, for the
          // last ghost, is exactly [0.84, 1.00] — the timeline's own end),
          // so the dissolve+scatter is guaranteed to finish exactly when the
          // chapter does, never spilling past scroll progress 1.
          tl.to(el, { "--dissolve": 0, ease: "sine.in", duration: 0.16 }, start + 0.28)
            .to(el, { opacity: 0, duration: 0.16 }, start + 0.28);
        } else {
          tl.to(el, { opacity: 0, scale: 0.98, ease: "sine.in", duration: 0.16 }, start + 0.28);
        }
      });

      const emberEls = gsap.utils.toArray<HTMLElement>("[data-journey-ember]");
      if (emberEls.length > 0) {
        const signatureStart = 0.08 + SIGNATURE_INDEX * 0.24; // matches the signature ghost's own start
        const dissolveStart = signatureStart + 0.28; // 0.84 — the same instant the mask starts collapsing
        gsap.set(emberEls, { opacity: 0, "--spread": 0 });
        // Emerge just as the dissolve begins, scattered outward by 0.08,
        // hold a beat, then fade — the whole thing landing at exactly 1.0,
        // the last instant this scrubbed timeline ever reaches.
        tl.to(
          emberEls,
          { opacity: 1, "--spread": 1, ease: "sine.out", duration: 0.08, stagger: 0.008 },
          dissolveStart
        ).to(emberEls, { opacity: 0, ease: "sine.in", duration: 0.08 }, dissolveStart + 0.08);
      }
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <section
      ref={root}
      id="journey"
      aria-labelledby="journey-title"
      // `overflow-x-clip` rather than `overflow-hidden`: the cosmic path
      // deliberately bleeds past this section's top and bottom edges so the
      // dust arrives before the chapter does, while horizontal overflow
      // stays clipped exactly as before.
      className="relative flex min-h-[90svh] w-full items-center justify-center overflow-x-clip bg-transparent px-[max(1.5rem,env(safe-area-inset-left))] py-32 sm:px-6"
    >
      <CosmicPath />

      <div aria-hidden="true" className="journey-ghosts">
        {ghosts.map((memory, i) => {
          const isSignature = i === SIGNATURE_INDEX;
          return (
            <div
              key={memory.id}
              data-journey-ghost
              data-signature={isSignature ? "" : undefined}
              data-motion-exempt
              className={`journey-ghost${isSignature ? " journey-ghost--signature" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              {/* The signature ghost's own image+embers are the DOM fallback
                  for PhotoDissolve.tsx's real particle version — suppressed
                  (not unmounted, so this element's own GSAP timing/index
                  stays stable either way) once WebGL is confirmed carrying
                  the shot instead. `position: relative` + full size: the
                  child Image's `fill` needs *this* to be its positioned
                  containing block, not just skip through to the
                  `.journey-ghost` ancestor two levels up (Next.js's own
                  dev-mode check warns on the immediate parent specifically). */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  ...(isSignature && webglActive ? { display: "none" } : null),
                }}
              >
                <Image
                  src={memory.src}
                  alt=""
                  fill
                  sizes="40vw"
                  className="journey-ghost__img"
                  style={{ objectPosition: focusFor(memory.id) }}
                />
                {isSignature && (
                  <div className="journey-embers">
                    {EMBER_OFFSETS.map(([ex, ey], j) => (
                      <span
                        key={j}
                        data-journey-ember
                        data-motion-exempt
                        className="journey-ember"
                        style={{ "--ex": `${ex}px`, "--ey": `${ey}px` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={copyRef} className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <p className="type-meta" data-reveal="fade">
          Chapter 04
        </p>
        <h2 id="journey-title" className="type-chapter mt-5" data-reveal="mask">
          <span className="reveal-line">The journey between us</span>
        </h2>
        <p className="type-emotion mx-auto mt-6 max-w-lg" data-reveal="fade">
          Not a straight line, but a glowing path of memories, growth and
          choosing each other.
        </p>

        <svg
          viewBox="0 0 600 160"
          className="mx-auto mt-14 w-full max-w-xl"
          aria-hidden="true"
        >
          <path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
          />
          <path
            data-path
            d="M10 130 C 120 20, 200 150, 300 80 S 480 10, 590 60"
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.8"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          {[
            [10, 130],
            [180, 60],
            [300, 80],
            [430, 30],
            [590, 60],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={2.2}
              fill="var(--accent-soft)"
              opacity={0.6}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
