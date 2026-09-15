"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { setActiveCardIndex } from "./storyCarouselState";
import { carouselVelocity } from "./carouselVelocity";
import { storyMood } from "./storyMood";
import { timeline, journey, memories } from "@/lib/content";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * The merged chapter's centrepiece: a real 3D rolling/cylindrical carousel
 * — chapters 03 (story), 04 (journey) and 05 (memories) combined into one
 * chapter (content.ts) whose eleven real moments (five timeline beats, the
 * journey, five real photographs) orbit StoryPlantWall.tsx, fixed at world
 * origin, and roll past as the visitor scrolls.
 *
 * Repositioned from an earlier, camera-relative version (the ring anchored
 * to `camera.position + forward*distance` every frame) to a genuinely
 * fixed one per a later spec: the plant stays at world origin `(0,0,0)`
 * "at all times", and this ring orbits it at a fixed radius rather than
 * chasing the camera. That also means the ring's *rotation* is now real —
 * `group.rotation.y` is set directly to the lerped scroll offset (the
 * spec's own "update a rotation offset applied to a parent group"), with
 * each card's own position/facing computed once from its fixed slot angle
 * (`useMemo`, not per frame) rather than re-deriving a scroll-shifted angle
 * every frame the way the camera-relative version had to.
 *
 * `RADIUS` is 3.0, not the spec's example 6: simulated the actual camera
 * arc for this chapter (CAMERA_KEYS in CosmicScene.tsx) and found its z
 * never drops below ~4.4 across the chapter's whole scroll — a radius of 6
 * would put half the ring behind the camera at the chapter's own end. 3.0
 * keeps the entire ring (every angle, not just the front) safely in front
 * of the camera throughout, with room to spare.
 *
 * Depth falloff (front card large/opaque, back small/faint) still uses
 * `cos(angle)` as a stand-in for "distance from camera" rather than an
 * actual per-frame camera-relative measurement: valid here because the
 * camera's arc stays forward-looking and inside the ring's radius the
 * whole chapter (confirmed by the same simulation), so "highest world z"
 * and "nearest the camera" never disagree.
 *
 * Two further adaptations from the original build brief, unchanged from
 * before:
 *
 * - No dedicated `wheel` listener + hand-rolled lerp loop: this site's
 *   whole scroll experience already runs through one shared, canonical
 *   scroll signal (`sceneProgress.ts`, `chapterProgress`), which every other
 *   scroll-driven WebGL object in this scene reads — a second, independent
 *   listener here would be a second source of truth for "how far has the
 *   visitor scrolled" fighting the first. `chapterProgress` supplies the
 *   *target* rotation; the lerp toward it still happens every frame below,
 *   using this project's own frame-rate-independent exponential-damping
 *   convention in place of a fixed per-frame factor, for the same buttery,
 *   momentum-like glide the spec asks for.
 *
 * - No `THREE.Raycaster` click-to-open: the persistent canvas is mounted
 *   `pointer-events: none` site-wide (CosmicBackdrop.tsx) so the WebGL
 *   layer never intercepts a click meant for the real DOM controls sitting
 *   on top of it everywhere else on the page — changing that would be a
 *   site-wide interaction change, not a carousel one. The active card's own
 *   caption is still genuinely reactive to where scroll currently has the
 *   ring turned (`storyCarouselState.ts`, read by ChapterStory.tsx),
 *   through this site's existing scroll-to-select interaction model rather
 *   than a pointer-driven one.
 */
const TOTAL_CHAPTER_ID = "story";
/** 5 timeline beats + the journey + 5 photographs — exported so
 * ChapterStory.tsx's pin length and accessible content stay in lockstep
 * with the carousel's own card count, one source of truth. */
export const CARD_COUNT = timeline.length + 1 + memories.length;
const ANGLE_STEP = (Math.PI * 2) / CARD_COUNT;
const RADIUS = 3.0;

/**
 * The signature occlusion cut: one card (memory-4, "Somewhere We Got Lost" —
 * the second-to-last card, right before Ordinary Days) performs a single
 * motivated edit as it hands the front off to the final photograph. Not a
 * new transition system — the card that's already there, already at the
 * front, briefly pushed toward the camera along the same radius it already
 * travels on. Real camera-arc z at this handoff (story chapterProgress
 * ~0.9) is ~4.57 (simulated against CAMERA_KEYS); the ring sits at radius
 * 3.0 (2.4 on mobile), so a 1.1-unit push leaves a comfortable margin
 * before the card would ever reach the camera's own position — chosen
 * deliberately conservative after that check, not tuned by eye.
 */
const OCCLUSION_CARD_INDEX = CARD_COUNT - 2;
const OCCLUSION_PUSH = 1.1;

export type CardKind = "timeline" | "journey" | "photo";
export type CardDatum = {
  kind: CardKind;
  width: number;
  height: number;
  meta: string;
  line: string;
  src?: string;
  /** A photo's own small personal note (content.ts's `Memory.note`) — real,
   * genuine, previously sr-only only. ChapterStory.tsx surfaces the last
   * card's note as the chapter's own quiet closing line ("Ordinary Days")
   * rather than inventing new copy for that beat. */
  note?: string;
};

/** The same 11-card sequence the carousel renders, for ChapterStory.tsx's
 * synced caption and accessible content — single source of truth for
 * what's in the ring and in what order. */
export function buildCards(): CardDatum[] {
  const cards: CardDatum[] = timeline.map((entry) => ({
    kind: "timeline",
    width: 1.6,
    height: 1.05,
    meta: `${entry.number} — ${entry.title}`,
    line: entry.line,
  }));
  cards.push({
    kind: "journey",
    width: 1.6,
    height: 1.05,
    meta: "The journey",
    line: journey.subtitle,
  });
  for (const memory of memories) {
    const aspect = THREE.MathUtils.clamp(memory.width / memory.height, 0.62, 1.8);
    const height = 1.3;
    cards.push({
      kind: "photo",
      width: height * aspect,
      height,
      meta: memory.place,
      line: memory.caption,
      src: memory.src,
      note: memory.note,
    });
  }
  return cards;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * A title card for a non-photo moment (a timeline beat or the journey),
 * drawn once onto an offscreen canvas — decorative, not the accessible
 * copy (that lives in ChapterStory.tsx's real DOM), so a generic system
 * font stack is fine here.
 */
function buildTextCardTexture(meta: string, line: string): THREE.CanvasTexture {
  const w = 640;
  const h = 420;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#0c0a14");
  grad.addColorStop(1, "#1a1420");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(215,185,122,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = "rgba(215,185,122,0.92)";
  ctx.font = "600 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText(meta.toUpperCase(), w / 2, 96);

  ctx.fillStyle = "rgba(240,232,225,0.96)";
  ctx.font = "italic 400 34px Georgia, serif";
  ctx.letterSpacing = "0px";
  const lines = wrapLines(ctx, line, w - 120);
  const lineHeight = 44;
  const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2 + 10;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, startY + i * lineHeight));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

type CardTextureState =
  | { status: "pending" }
  | { status: "loaded"; texture: THREE.Texture }
  | { status: "error" };

function usePhotoTextures(cards: CardDatum[]): Record<number, CardTextureState> {
  const [state, setState] = useState<Record<number, CardTextureState>>({});
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let cancelled = false;
    cards.forEach((card, i) => {
      if (card.kind !== "photo" || !card.src) return;
      loader.load(
        card.src,
        (texture) => {
          if (cancelled) return;
          texture.colorSpace = THREE.SRGBColorSpace;
          setState((prev) => ({ ...prev, [i]: { status: "loaded", texture } }));
        },
        undefined,
        () => {
          if (!cancelled) setState((prev) => ({ ...prev, [i]: { status: "error" } }));
        }
      );
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export default function StoryCarousel({
  progressRef,
}: {
  progressRef: RefObject<SceneProgressRef>;
}) {
  const coarsePointer = useCoarsePointer();
  const narrow = useNarrowViewport();
  const mobileTier = coarsePointer || narrow;
  // A tighter ring on phones — the same lesson TulipGarden/MemoryBlocks
  // already learned: a desktop-tuned radius sits partly outside a portrait
  // phone's much narrower effective field of view.
  const radius = mobileTier ? RADIUS * 0.8 : RADIUS;

  const cards = useMemo(() => buildCards(), []);
  const photoTextures = usePhotoTextures(cards);

  const groupRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const keyRef = useRef<THREE.PointLight>(null);

  const presenceRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const prevScrollOffsetRef = useRef(0);
  const lastFrontRef = useRef(-1);
  // Decaying 0-1 envelope: reset to 1 the instant a new card reaches the
  // front, then eases back down — the "locks into focus" beat's own timer.
  const focusPulseRef = useRef(0);
  // The occlusion cut's own envelope — reset to 1 the instant the front
  // hands off across the OCCLUSION_CARD_INDEX <-> +1 boundary (either
  // scroll direction, so the cut is coherent in reverse too), then decays
  // over ~300ms real time regardless of scroll speed, the same "elapsed
  // time, not scroll distance" timing focusPulseRef already established.
  const occlusionRef = useRef(0);

  // Each card's own fixed slot on the ring — computed once, not re-derived
  // every frame, now that scrolling turns the *group* rather than shifting
  // each card's own angle individually.
  const slotAngles = useMemo(() => cards.map((_, i) => i * ANGLE_STEP), [cards]);

  // Only 6 of these (5 timeline + journey), so building all of them once —
  // cheap, a handful of offscreen canvas draws — is simpler and compiler-
  // safe than a lazily-populated ref read during render.
  const textCardTextures = useMemo(() => {
    const map = new Map<number, THREE.CanvasTexture>();
    cards.forEach((card, i) => {
      if (card.kind !== "photo") map.set(i, buildTextCardTexture(card.meta, card.line));
    });
    return map;
  }, [cards]);

  useEffect(() => {
    return () => {
      textCardTextures.forEach((t) => t.dispose());
    };
  }, [textCardTextures]);

  const cardPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const group = groupRef.current;
    if (!group) return;
    const dt = Math.min(delta, 0.1);

    const progress = progressRef.current;
    const active = isChapterActive(progress, TOTAL_CHAPTER_ID);
    const targetPresence = active
      ? THREE.MathUtils.smoothstep(progress.chapterProgress, 0, 0.05) *
        (1 - THREE.MathUtils.smoothstep(progress.chapterProgress, 0.96, 1))
      : 0;
    presenceRef.current += (targetPresence - presenceRef.current) * Math.min(1, dt * 2.2);
    const presence = presenceRef.current;

    const shown = presence > 0.01;
    group.visible = shown;
    if (!shown) {
      carouselVelocity.value = 0;
      return;
    }

    // Target angle: by chapterProgress 0 the first card (a timeline beat)
    // is at the front; by chapterProgress 1 the last card (the final
    // photograph) has rolled all the way to the front — one continuous
    // turn across the whole merged chapter's scroll, not per-sub-chapter.
    const targetOffset = -progress.chapterProgress * ANGLE_STEP * (CARD_COUNT - 1);
    // The "gravity moment": in the chapter's last stretch (0.82-0.96,
    // ending right where the presence fade toward the Letter begins),
    // everything visibly gathers rather than just stopping — the ring's
    // own damping heavies up (time itself feels slower to settle) and,
    // below, its radius pulls inward toward the plant. Not fully to zero:
    // a genuine convergence, not a collapse.
    const closing = active
      ? THREE.MathUtils.smoothstep(progress.chapterProgress, 0.82, 0.96)
      : 0;
    // Shared with StoryPostFX.tsx (bloom/DoF ease back for the same window)
    // — see storyMood.ts for why this one value also stands in for a
    // separate "Ordinary Days" mood that turned out to land in the same
    // few seconds rather than needing its own.
    storyMood.closing = closing;
    // A touch more damping while the Hard Days memory holds the front —
    // the ring's own turning visibly slows for that beat specifically, on
    // top of (not instead of) the gravity window's own heavier damping.
    const damping =
      THREE.MathUtils.lerp(0.45, 1.15, closing) + 0.35 * storyMood.hardDays;
    // Frame-rate-independent exponential damping — this project's own
    // convention in place of the brief's fixed per-frame lerp factor, for
    // the same "glides to a stop rather than jumps" momentum feel
    // regardless of frame rate.
    scrollOffsetRef.current +=
      (targetOffset - scrollOffsetRef.current) * (1 - Math.exp(-dt / damping));
    const scrollOffset = scrollOffsetRef.current;
    const ringRadius = radius * (1 - 0.62 * closing);

    // Angular velocity (rad/s) of the *lerped* rotation, not the raw
    // scroll — StoryPostFX.tsx's chromatic aberration reads this to know
    // how hard to split the RGB channels, so it should track how fast the
    // ring is actually visibly turning, not how fast the mouse wheel spun.
    carouselVelocity.value = Math.abs(scrollOffset - prevScrollOffsetRef.current) / dt;
    prevScrollOffsetRef.current = scrollOffset;

    // Fixed at world origin — the plant (StoryPlantWall.tsx) sits here too,
    // so the ring orbits it directly rather than each tracking the camera
    // independently. Scrolling turns the whole group by one rotation
    // offset (the spec's own Step 3), not each card's own angle.
    group.position.set(0, 0, 0);
    group.rotation.set(0, scrollOffset, 0);

    // Found first, in its own quick pass (just angle math, no mesh writes)
    // — the main pass below needs to already know which card is the front
    // one so it can give that specific card its "locks into focus" pulse,
    // rather than reading a frame-stale value.
    let frontIndex = 0;
    let frontDepth = -Infinity;
    for (let i = 0; i < cards.length; i++) {
      const worldAngle = slotAngles[i] + scrollOffset;
      const depthT = (Math.cos(worldAngle) + 1) / 2;
      if (depthT > frontDepth) {
        frontDepth = depthT;
        frontIndex = i;
      }
    }

    const frontChanged = frontIndex !== lastFrontRef.current;
    if (frontChanged) {
      const prevFront = lastFrontRef.current;
      lastFrontRef.current = frontIndex;
      setActiveCardIndex(frontIndex);
      focusPulseRef.current = 1;
      // The signature occlusion cut fires exactly at this one handoff,
      // either scroll direction — see OCCLUSION_CARD_INDEX's own comment.
      const crossesOcclusionSeam =
        (prevFront === OCCLUSION_CARD_INDEX && frontIndex === OCCLUSION_CARD_INDEX + 1) ||
        (prevFront === OCCLUSION_CARD_INDEX + 1 && frontIndex === OCCLUSION_CARD_INDEX);
      if (crossesOcclusionSeam) occlusionRef.current = 1;
    }
    // Decays over ~300ms real time (independent of scroll speed) — the
    // photograph performs one full approach-and-clear regardless of how
    // fast the visitor scrolled past the seam.
    occlusionRef.current *= Math.exp(-dt / 0.09);
    const occlusion = occlusionRef.current;
    storyMood.occlusion = occlusion;
    // Decays over ~0.3s — a quick, deliberate "found it" beat each time a
    // new card reaches the front, not a lingering glow.
    focusPulseRef.current *= Math.exp(-dt / 0.3);
    const pulse = focusPulseRef.current;
    // Shared with StoryPostFX.tsx — the same pulse read as a brief
    // background-blur reduction, so the rack-focus reads as one authored
    // beat (background softens ~ focus lands ~ card pops) rather than the
    // scale/colour pop being the only cue.
    storyMood.cardFocus = pulse;

    for (let i = 0; i < cards.length; i++) {
      const mesh = cardRefs.current[i];
      if (!mesh) continue;
      const slot = slotAngles[i];
      // The occlusion card pushes outward along its own radius (toward the
      // camera, since this handoff happens right as it passes through the
      // front) — everything else stays on the shared ring radius.
      const cardRadius =
        i === OCCLUSION_CARD_INDEX ? ringRadius + occlusion * OCCLUSION_PUSH : ringRadius;
      // Local to the group, which already carries the scroll rotation —
      // no need to add scrollOffset again here.
      const x = Math.sin(slot) * cardRadius;
      const z = Math.cos(slot) * cardRadius;
      cardPos.set(x, 0, z);
      mesh.position.copy(cardPos);
      // Tangent-facing — each card also turns with its position on the
      // ring, the same way a real cylinder's surface would, rather than
      // always billboarding flat at the camera. This is what actually
      // reads as "rolling" instead of "a flat carousel of cards".
      mesh.rotation.set(0, slot, 0);

      // Depth falloff: 1 at the front (world angle 0 mod 2π — the highest-z
      // point on the ring, which the camera-simulation in this file's own
      // doc comment confirms is always the side nearest the camera for
      // this chapter's actual arc), 0 at the back — large and fully opaque
      // up front, smaller and faint receding around the ring.
      const worldAngle = slot + scrollOffset;
      const depthT = (Math.cos(worldAngle) + 1) / 2;
      // The front card gets a brief extra scale and brightness pop on top
      // of its usual depth-based prominence, right when it becomes the
      // front card — "locks into focus" as a real, felt moment rather
      // than something only the depth-of-field blur communicates.
      const isFront = i === frontIndex;
      const focusBoost = isFront ? pulse : 0;
      // The occlusion card's own scale swell, layered on top of its usual
      // depth-based size rather than replacing it — perspective from the
      // radius push above already does most of the "fills the viewport"
      // work, so this only needs to add a moderate amount on top.
      const occlusionBoost = i === OCCLUSION_CARD_INDEX ? occlusion : 0;
      const scale =
        THREE.MathUtils.lerp(0.55, 1.15, depthT) *
        (1 + 0.08 * focusBoost) *
        (1 + 1.4 * occlusionBoost) *
        presence;
      mesh.scale.setScalar(scale);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(
        THREE.MathUtils.lerp(0.22, 1, depthT),
        occlusionBoost
      ) * presence;
      // A card's material is its own (not instanced), so this can brighten
      // just the one card — pushed past 1.0 on purpose: this material is
      // untoneMapped, so an overbright colour here is exactly what
      // StoryPostFX.tsx's Bloom effect picks up as a genuine highlight,
      // the same "found it" beat as the scale pop, felt as light this time.
      material.color.setScalar(1 + 0.4 * focusBoost);
    }

    if (keyRef.current) {
      keyRef.current.intensity = 2.2 * presence * (1 + 0.5 * pulse);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Fixed near the side the camera always approaches from during this
          chapter (confirmed by the same camera-arc simulation this file's
          doc comment describes) rather than tracking it — genuinely
          world-fixed, matching the ring and the plant it lights. */}
      <pointLight ref={keyRef} position={[1.4, 1.1, 3.6]} color="#e9dcc4" intensity={0} distance={7} decay={2} />
      {cards.map((card, i) => {
        const isPhoto = card.kind === "photo";
        const photoState = isPhoto ? photoTextures[i] : undefined;
        const texture =
          isPhoto && photoState?.status === "loaded"
            ? photoState.texture
            : !isPhoto
              ? (textCardTextures.get(i) ?? null)
              : null;
        return (
          <mesh
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            frustumCulled={false}
          >
            <planeGeometry args={[card.width, card.height]} />
            <meshBasicMaterial
              map={texture ?? undefined}
              color={texture ? "#ffffff" : "#241d28"}
              side={THREE.DoubleSide}
              transparent
              opacity={0}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
