"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { site } from "@/lib/content";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const VISITED_KEY = "aurora-visited";

/** Entry transition (Begin the Journey), in ms. Mirrors `.entry-warp` in globals.css. */
const ENTRY_SWAP_MS = 900;
const ENTRY_TOTAL_MS = 1700;

/**
 * Chapter 1 — the opening.
 *
 * Near-darkness, a beat of nothing, one distant point, another, a faint
 * haze, aurora light forming — and only then FOR DHEEPIKA, then PROJECT
 * AURORA arriving out of depth (masked rise, tracking settling, blur
 * resolving). The title itself never glows; the one warm light pass across
 * AURORA plays on a first reveal only and never loops.
 *
 * First-visit vs. return-visit (brief section 81) is unchanged in spirit:
 * a returning visitor gets the same beats at about a third of the duration
 * and a REPLAY INTRO control. This only ever affects timing, never what
 * renders — localStorage is read after hydration.
 *
 * Robustness: every animated value here is a CSS custom property
 * (`--a` opacity, `--ty` rise, `--blur`, `--ls` tracking), whose *default*
 * is the finished, fully visible state. So:
 *  - no JavaScript at all: everything is visible (a CSS-only failsafe also
 *    un-hides the pre-hydration state after a few seconds);
 *  - GSAP writes `--a: 0`, never inline `opacity: 0`, so MotionSafetyNet's
 *    3.5s sweep cannot cut into the middle of this longer sequence;
 *  - a stalled frame loop can't strand the title: a plain timeout jumps the
 *    timeline to its end and offers REPLAY INTRO.
 */
export default function ChapterPortal() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [isReturning, setIsReturning] = useState(false);
  const [replayToken, setReplayToken] = useState(0);
  const [introSkipped, setIntroSkipped] = useState(false);
  const [entering, setEntering] = useState(false);
  const entryTimers = useRef<number[]>([]);
  const visitChecked = useRef(false);

  useEffect(() => {
    // Read once per mount. Without this guard React's development
    // double-invoke of effects saw its own "visited" write and treated
    // every first visit as a return visit.
    if (visitChecked.current) return;
    visitChecked.current = true;
    try {
      const seen = window.localStorage.getItem(VISITED_KEY) === "1";
      // Intentional one-time client-only read: whether this is a returning
      // visitor can only be known after mount, and it only ever adjusts
      // animation timing (never what renders), so this is exempt from the
      // usual lint guidance against setState-in-effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReturning(seen);
      window.localStorage.setItem(VISITED_KEY, "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — default to full intro.
    }
  }, []);

  useEffect(() => {
    const timers = entryTimers.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      document.documentElement.removeAttribute("data-aurora-hush");
    };
  }, []);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      if (reduced) {
        section.setAttribute("data-opening", "still");
        return;
      }

      const q = (name: string) => section.querySelector<HTMLElement>(`[data-o="${name}"]`);
      const els = {
        veil: q("veil"),
        star1: q("star1"),
        star2: q("star2"),
        haze: q("haze"),
        aurora: q("aurora"),
        for: q("for"),
        title: q("title"),
        line1: q("line1"),
        line2: q("line2"),
        sub: q("sub"),
        msg: q("msg"),
        cta: q("cta"),
        slate: q("slate"),
      };

      // Returning visitors: the same beats at about a third of the length,
      // and no light pass (that belongs to a first reveal only).
      const s = isReturning ? 0.35 : 1;
      const firstReveal = !isReturning;

      // From-states, all through custom properties, applied immediately
      // (a timeline's own `.set()` would wait for the first ticker frame).
      gsap.set(els.veil, { "--a": 1 });
      gsap.set([els.star1, els.star2], { "--a": 0, "--s": 0.3 });
      gsap.set(els.haze, { "--a": 0 });
      gsap.set(els.aurora, { "--a": 0, "--s": 0.78 });
      gsap.set(els.for, { "--a": 0, "--blur": 7, "--ls": 0.5 });
      gsap.set(els.title, { "--ls": 0.14 });
      gsap.set([els.line1, els.line2], { "--a": 0, "--ty": 110, "--blur": 10 });
      gsap.set(els.line2, { "--pass": 88, "--pass-a": 0 });
      gsap.set([els.sub, els.msg, els.cta, els.slate], { "--a": 0, "--ty": 18 });

      // Armed only now that the from-states are in place, in the same
      // layout pass, so there is no flash of the finished title first.
      section.setAttribute("data-opening", "playing");

      const tl = gsap.timeline({ defaults: { ease: "sine.inOut" } });

      // A beat of nothing, then one distant point… then another.
      tl.to(els.star1, { "--a": 1, "--s": 1, duration: 1.1 * s }, 0.9 * s)
        .to(els.star2, { "--a": 0.75, "--s": 1, duration: 1.1 * s }, 1.55 * s)
        // A faint haze; aurora light forming out of it.
        .to(els.haze, { "--a": 1, duration: 2.4 * s }, 2.0 * s)
        .to(els.aurora, { "--a": 1, "--s": 1, duration: 2.8 * s, ease: "power1.out" }, 2.5 * s)
        .to(els.veil, { "--a": 0, duration: 2.4 * s }, 2.3 * s)
        // Only then: FOR DHEEPIKA, tracking settling as it resolves.
        .to(
          els.for,
          { "--a": 1, "--blur": 0, "--ls": 0, duration: 1.6 * s, ease: "expo.out" },
          3.35 * s
        )
        // PROJECT AURORA, rising out of depth.
        .to(els.title, { "--ls": 0, duration: 2.6 * s, ease: "expo.out" }, 3.9 * s)
        .to(
          els.line1,
          { "--ty": 0, "--blur": 0, duration: 1.7 * s, ease: "expo.out" },
          3.9 * s
        )
        .to(els.line1, { "--a": 1, duration: 1.1 * s, ease: "power1.out" }, 3.9 * s)
        .to(
          els.line2,
          { "--ty": 0, "--blur": 0, duration: 1.7 * s, ease: "expo.out" },
          4.12 * s
        )
        .to(els.line2, { "--a": 1, duration: 1.1 * s, ease: "power1.out" }, 4.12 * s)
        .to(els.sub, { "--a": 1, "--ty": 0, duration: 1.3 * s, ease: "power2.out" }, 5.0 * s)
        .to(els.msg, { "--a": 1, "--ty": 0, duration: 1.4 * s, ease: "power2.out" }, 5.3 * s)
        .to(els.cta, { "--a": 1, "--ty": 0, duration: 1.2 * s, ease: "power2.out" }, 5.85 * s)
        .to(els.slate, { "--a": 1, "--ty": 0, duration: 1.2 * s }, 6.0 * s);

      if (firstReveal) {
        // One soft warm pass across AURORA. Once.
        tl.to(els.line2, { "--pass-a": 1, duration: 0.35, ease: "power1.out" }, 5.2)
          .to(els.line2, { "--pass": 12, duration: 1.7, ease: "sine.inOut" }, 5.2)
          .to(els.line2, { "--pass-a": 0, duration: 0.45, ease: "power1.in" }, 6.45);
      }

      // Stalled-frame-loop safety: jump to the finished frame and let the
      // visitor replay it whenever they like.
      const failsafe = window.setTimeout(() => {
        if (tl.progress() < 1) {
          tl.progress(1);
          setIntroSkipped(true);
        }
      }, tl.duration() * 1000 + 1500);

      return () => window.clearTimeout(failsafe);
    },
    // `revertOnUpdate`: without it useGSAP keeps the previous timeline (and
    // its failsafe) alive when a dependency changes — so the returning-
    // visitor flip or a replay would run two openings on top of each other.
    {
      scope: root,
      dependencies: [reduced, isReturning, replayToken],
      revertOnUpdate: true,
    }
  );

  function focusMiracle() {
    const heading = document.getElementById("miracle-title");
    heading?.focus({ preventScroll: true });
  }

  function beginJourney() {
    const miracle = document.getElementById("miracle");
    if (!miracle || entering) return;

    if (reduced) {
      miracle.scrollIntoView({ behavior: "instant" });
      focusMiracle();
      return;
    }

    // Stars pull outward, the portal opens, the foreground darkens into a
    // warm bloom — and the first photograph emerges out of that light.
    // Timers + CSS only: nothing here waits on requestAnimationFrame.
    const html = document.documentElement;
    html.setAttribute("data-aurora-hush", "");
    setEntering(true);

    const swap = window.setTimeout(() => {
      miracle.setAttribute("data-emerge", "light");
      window.scrollTo({
        top: miracle.getBoundingClientRect().top + window.scrollY,
        behavior: "instant",
      });
    }, ENTRY_SWAP_MS);
    const release = window.setTimeout(() => {
      // Removing the attribute lets the photograph's CSS transition carry it
      // from overexposed light back to its resting grade.
      miracle.removeAttribute("data-emerge");
    }, ENTRY_SWAP_MS + 80);
    const done = window.setTimeout(() => {
      setEntering(false);
      html.removeAttribute("data-aurora-hush");
      focusMiracle();
    }, ENTRY_TOTAL_MS);
    entryTimers.current.push(swap, release, done);
  }

  function replayIntro() {
    try {
      window.localStorage.removeItem(VISITED_KEY);
    } catch {
      // ignore
    }
    setIntroSkipped(false);
    setIsReturning(false);
    setReplayToken((t) => t + 1);
  }

  return (
    <section
      ref={root}
      id="portal"
      aria-labelledby="portal-title"
      className="opening"
      data-entering={entering ? "" : undefined}
    >
      {/* Bottom to top: the darkness, then what forms inside it. */}
      <div className="opening-sky" aria-hidden="true">
        <span data-o="veil" className="opening-veil" />
        <span data-o="haze" className="opening-haze" />
        <span data-o="aurora" className="opening-aurora" />
        <span data-o="star1" className="opening-star opening-star--one" />
        <span data-o="star2" className="opening-star opening-star--two" />
      </div>

      <div className="opening-frame">
        <p data-o="for" className="type-meta opening-for">
          For {site.recipient}
        </p>

        <h1 id="portal-title" data-o="title" className="type-film opening-title">
          <span className="opening-mask">
            <span data-o="line1" className="opening-line">
              Project
            </span>
          </span>{" "}
          <span className="opening-mask">
            <span
              data-o="line2"
              data-text="Aurora"
              className="opening-line opening-line--aurora"
            >
              Aurora
            </span>
          </span>
        </h1>

        <p data-o="sub" className="type-meta opening-sub">
          {site.subtitle}
        </p>
        <p data-o="msg" className="type-emotion opening-msg">
          A portal opens into a world made from love, light and memory.
        </p>

        <div data-o="cta" className="opening-cta">
          <button
            type="button"
            onClick={beginJourney}
            className="btn-cinema"
            data-cursor="enter"
          >
            Begin the Journey
          </button>
          <span className="type-meta opening-hint" aria-hidden="true">
            or scroll
          </span>
          {(isReturning || introSkipped) && (
            <button type="button" onClick={replayIntro} className="btn-quiet">
              Replay Intro
            </button>
          )}
        </div>
      </div>

      <p data-o="slate" className="type-meta opening-slate">
        Chapter 01 <span aria-hidden="true">·</span> Enter the universe
      </p>

      {entering && (
        <div className="entry-warp" aria-hidden="true" data-motion-exempt>
          <span className="entry-warp__dark" />
          <span className="entry-warp__stars" />
          <span className="entry-warp__stars entry-warp__stars--near" />
          <span className="entry-warp__ring" />
          <span className="entry-warp__bloom" />
        </div>
      )}
    </section>
  );
}
