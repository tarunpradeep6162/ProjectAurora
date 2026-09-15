"use client";

import { useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction, type ChromaticAberrationEffect } from "postprocessing";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { carouselVelocity } from "./carouselVelocity";

/**
 * A five-effect post-processing stack — "Bioluminescent Ethereal Cyber" —
 * scoped to the merged story chapter (chapters 03-05, StoryCarousel.tsx /
 * StoryPlantWall.tsx) rather than the whole site.
 *
 * That scoping is the real engineering decision here, not asked for
 * explicitly but required by how this scene is built: the persistent
 * `<Canvas>` in CosmicScene.tsx renders every chapter through one shared
 * render loop — there's no separate scene per chapter to wrap in its own
 * `<EffectComposer>`. Mounting a composer permanently would tax every
 * other chapter's frame budget (portal, miracle, letter, birthday,
 * finale) for a look meant for one of six. `enabled` (a real prop
 * `@react-three/postprocessing`'s `EffectComposer` supports, confirmed in
 * the installed version's own types) is toggled by this chapter's own
 * presence — the same isChapterActive + chapterProgress envelope every
 * other object in this chapter already uses — so the whole pass is
 * skipped outright everywhere else, not merely invisible.
 *
 * 1. DepthOfField: `target={[0, 0, 0]}` autofocuses on StoryPlantWall.tsx's
 *    fixed world-origin position every frame regardless of camera
 *    movement — cleaner than computing a normalized focusDistance by
 *    hand, and exactly matches "the plant" as the thing that must always
 *    be sharp. `focalLength`/`bokehScale` are tuned so the ring's cards,
 *    ~3 units out (StoryCarousel.tsx's RADIUS), read as a soft macro-lens
 *    blur without turning the whole scene to mush.
 * 2. Bloom: `mipmapBlur` for a genuinely soft, wide glow (the newer,
 *    cheaper `postprocessing` technique) rather than the old hard-edged
 *    kernel blur that reads as neon. `luminanceThreshold={0.5}` per the
 *    brief — only real highlights (the plant's own light, a card's own
 *    bright pixels) bloom, not the whole dim scene.
 * 3. ChromaticAberration: the one effect that's genuinely animated, not
 *    just configured — see the useFrame below. Tied to
 *    `carouselVelocity.value` (StoryCarousel.tsx writes it every frame,
 *    a plain shared module value, not React state — see
 *    carouselVelocity.ts), not a raw wheel-event delta: this project's
 *    scroll is already one canonical signal (chapterProgress) that every
 *    object reads, so "how fast is the carousel turning" has to be
 *    derived from the same lerped rotation the carousel itself renders,
 *    or this effect could react to a scroll flick the ring's own inertia
 *    hasn't caught up to yet — visibly wrong, motion that disagrees with
 *    what's on screen.
 * 4. Vignette: soft, not the near-black brief examples often reach for —
 *    darkens the frame's edges toward wherever the ring's front card and
 *    the plant sit, without crushing the cards still receding around it.
 * 5. Noise: `opacity={0.03}`, `BlendFunction.OVERLAY` — per the brief,
 *    barely perceptible as its own thing, there to bind the WebGL layer
 *    and the DOM captions sitting on top of it into one image rather than
 *    two visibly different render technologies stacked on each other.
 */
export default function StoryPostFX({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const aberrationRef = useRef<ChromaticAberrationEffect>(null);

  useFrame((_state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, "story");
    // Same envelope StoryCarousel.tsx/StoryPlantWall.tsx already use for
    // their own presence — this stack fades in/out with the same content
    // it's meant to accompany, never a hard cut mid-scroll.
    const presence = active
      ? THREE.MathUtils.smoothstep(progress.chapterProgress, 0, 0.05) *
        (1 - THREE.MathUtils.smoothstep(progress.chapterProgress, 0.96, 1))
      : 0;

    // `enabled` is a React prop, not a per-frame-mutable field — flip the
    // underlying state only when crossing the threshold (rare), not every
    // frame, so this doesn't re-render on every scroll tick.
    const shouldEnable = presence > 0.02;
    if (shouldEnable !== enabledRef.current) {
      enabledRef.current = shouldEnable;
      setEnabled(shouldEnable);
    }

    const effect = aberrationRef.current;
    if (!effect) return;

    // Map the carousel's angular velocity (rad/s) to an RGB-split amount.
    // ~4 rad/s (a hard, fast fling through several cards in under a
    // second) reaches the maximum split; a gentle scroll barely
    // registers. Scaled by presence too, so a lingering non-zero velocity
    // can never bleed aberration into the chapters on either side during
    // the fade.
    const targetOffset =
      THREE.MathUtils.lerp(0, 0.025, THREE.MathUtils.clamp(carouselVelocity.value / 4, 0, 1)) *
      presence;
    // Frame-rate-independent easing, this project's standing convention,
    // in place of the brief's fixed 0.1 factor — same "smoothly eases
    // back to [0,0] when the carousel stops" behaviour, robust to frame
    // rate.
    const k = 1 - Math.exp(-dt / 0.18);
    effect.offset.x = THREE.MathUtils.lerp(effect.offset.x, targetOffset, k);
    effect.offset.y = effect.offset.x;
  });

  return (
    <EffectComposer enabled={enabled} multisampling={0}>
      <DepthOfField target={[0, 0, 0]} focalLength={0.045} bokehScale={4} height={480} />
      <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.3} intensity={0.7} />
      <ChromaticAberration ref={aberrationRef} offset={[0, 0]} radialModulation={false} modulationOffset={0} />
      <Vignette eskil={false} offset={0.3} darkness={0.55} />
      <Noise opacity={0.03} blendFunction={BlendFunction.OVERLAY} premultiply />
    </EffectComposer>
  );
}
