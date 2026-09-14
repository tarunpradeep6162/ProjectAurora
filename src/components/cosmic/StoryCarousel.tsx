"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { isChapterActive, type SceneProgressRef } from "./sceneProgress";
import { setActiveCardIndex } from "./storyCarouselState";
import { timeline, journey, memories } from "@/lib/content";
import { useCoarsePointer, useNarrowViewport } from "@/hooks/useMediaQuery";

/**
 * The merged chapter's centrepiece: a real 3D rolling/cylindrical carousel
 * — chapters 03 (story), 04 (journey) and 05 (memories) combined into one
 * chapter (content.ts) whose eleven real moments (five timeline beats, the
 * journey, five real photographs) sit as cards around a cylinder and roll
 * past as the visitor scrolls, built from the brief given for this pass:
 * polar/cylindrical positioning, lerped momentum instead of a direct scroll
 * mapping, real textures (a canvas-drawn card for text moments, a genuine
 * `THREE.TextureLoader` photograph for each memory), and depth-based
 * scale/opacity so the front card reads large and clear while the rest
 * recede.
 *
 * Two adaptations from that brief, both because this scene already has an
 * established, working system the brief's own scaffold assumed didn't
 * exist yet:
 *
 * - No dedicated `wheel` listener + hand-rolled lerp loop: this site's
 *   whole scroll experience already runs through one shared, canonical
 *   scroll signal (`sceneProgress.ts`, `chapterProgress`), which every other
 *   scroll-driven WebGL object in this scene reads — a second, independent
 *   listener here would be a second source of truth for "how far has the
 *   visitor scrolled" fighting the first. `chapterProgress` supplies the
 *   *target* angle; the actual lerp toward it (the brief's Step 2) still
 *   happens every frame below, using this project's own frame-rate-
 *   independent exponential-damping convention in place of a fixed
 *   per-frame factor, for the same buttery, momentum-like glide.
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
const RADIUS = 2.0;
const DISTANCE_AHEAD = 3.4;

export type CardKind = "timeline" | "journey" | "photo";
export type CardDatum = {
  kind: CardKind;
  width: number;
  height: number;
  meta: string;
  line: string;
  src?: string;
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

  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const keyRef = useRef<THREE.PointLight>(null);

  const presenceRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const lastFrontRef = useRef(-1);

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

  const forward = useMemo(() => new THREE.Vector3(), []);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
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
    if (!shown) return;

    // Target angle: by chapterProgress 0 the first card (a timeline beat)
    // is at the front; by chapterProgress 1 the last card (the final
    // photograph) has rolled all the way to the front — one continuous
    // turn across the whole merged chapter's scroll, not per-sub-chapter.
    const targetOffset = -progress.chapterProgress * ANGLE_STEP * (CARD_COUNT - 1);
    // Frame-rate-independent exponential damping — this project's own
    // convention in place of the brief's fixed per-frame lerp factor, for
    // the same "glides to a stop rather than jumps" momentum feel
    // regardless of frame rate.
    scrollOffsetRef.current +=
      (targetOffset - scrollOffsetRef.current) * (1 - Math.exp(-dt / 0.45));
    const scrollOffset = scrollOffsetRef.current;

    camera.getWorldDirection(forward);
    anchor.copy(camera.position).addScaledVector(forward, DISTANCE_AHEAD);
    group.position.copy(anchor);
    lookTarget.copy(camera.position);
    group.lookAt(lookTarget);

    let frontIndex = 0;
    let frontDepth = -Infinity;

    for (let i = 0; i < cards.length; i++) {
      const mesh = cardRefs.current[i];
      if (!mesh) continue;
      const angle = i * ANGLE_STEP + scrollOffset;
      const x = Math.sin(angle) * radius;
      // Adapted sign from the brief's plain cos(angle)*R - R: this carousel
      // is a child of a group that re-orients toward the camera every
      // frame (`group.lookAt` above), so "toward camera" is the group's
      // local -Z, not world -Z as the brief's scaffold assumed. Flipping
      // the sign here keeps angle 0 — not radius*2 away — the position
      // nearest the camera, which is what actually makes the front card
      // read as the large, prominent one.
      const z = radius * (1 - Math.cos(angle));
      cardPos.set(x, 0, z);
      mesh.position.copy(cardPos);
      // Tangent-facing — each card also turns with its position on the
      // ring, the same way a real cylinder's surface would, rather than
      // always billboarding flat at the camera. This is what actually
      // reads as "rolling" instead of "a flat carousel of cards".
      mesh.rotation.set(0, angle, 0);

      // Depth falloff: 1 at the front (angle 0 mod 2π), 0 at the back —
      // large and fully opaque up front, smaller and faint receding
      // around the ring, the brief's Step 4.
      const depthT = (Math.cos(angle) + 1) / 2;
      const scale = THREE.MathUtils.lerp(0.55, 1.15, depthT) * presence;
      mesh.scale.setScalar(scale);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(0.22, 1, depthT) * presence;

      if (depthT > frontDepth) {
        frontDepth = depthT;
        frontIndex = i;
      }
    }

    if (frontIndex !== lastFrontRef.current) {
      lastFrontRef.current = frontIndex;
      setActiveCardIndex(frontIndex);
    }

    if (keyRef.current) {
      keyRef.current.position.copy(camera.position).addScaledVector(forward, DISTANCE_AHEAD * 0.5);
      keyRef.current.position.y += 0.6;
      keyRef.current.intensity = 2.2 * presence;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <pointLight ref={keyRef} color="#e9dcc4" intensity={0} distance={7} decay={2} />
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
