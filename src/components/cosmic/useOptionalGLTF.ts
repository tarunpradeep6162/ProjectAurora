"use client";

import { useEffect, useState } from "react";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Shared version of the loader/near-chapter pattern `CoupleModel.tsx`
 * pioneered for `couple.glb` — extracted here because `TarunRunner.tsx` needs
 * the identical behavior (module-level cache, "render nothing" on a missing
 * or failed file, fetch only once the chapter is actually approaching) for a
 * second optional model. `CoupleModel.tsx` itself is left untouched: it
 * already works, and there is no reproduced issue in it to justify touching
 * working code.
 */

const modelCache = new Map<string, Promise<GLTF>>();

function loadModel(url: string): Promise<GLTF> {
  const cached = modelCache.get(url);
  if (cached) return cached;
  const promise = new Promise<GLTF>((resolve, reject) => {
    new GLTFLoader().load(url, resolve, undefined, reject);
  });
  modelCache.set(url, promise);
  return promise;
}

export type OptionalGLTFState = { status: "error" } | { status: "loaded"; gltf: GLTF };

const NEAR_FALLBACK_MS = 6000;

/**
 * See `CoupleModel.tsx`'s `useNearChapter` for the full reasoning: an
 * IntersectionObserver has been measured inert in at least one embedding
 * context this project has shipped into, so a plain timer is a real fallback,
 * not padding — the asymmetry (an early fetch costs one request; a missed
 * signal costs the feature) decides it.
 */
export function useNearChapter(chapterId: string, rootMargin: string): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = document.getElementById(chapterId);
    let observer: IntersectionObserver | undefined;

    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setNear(true);
        },
        { rootMargin }
      );
      observer.observe(el);
    }

    const fallback = window.setTimeout(() => setNear(true), NEAR_FALLBACK_MS);

    return () => {
      observer?.disconnect();
      window.clearTimeout(fallback);
    };
  }, [chapterId, rootMargin]);

  return near;
}

/**
 * `null` means "nothing resolved yet" — callers render nothing while
 * pending, exactly as while missing, so there is never a loading spinner for
 * an optional enhancement asset.
 */
export function useOptionalGLTF(url: string, enabled: boolean): OptionalGLTFState | null {
  const [state, setState] = useState<OptionalGLTFState | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    loadModel(url).then(
      (gltf) => {
        if (!cancelled) setState({ status: "loaded", gltf });
      },
      () => {
        // Expected until the real/placeholder file is placed — deliberately
        // not logged: a missing optional asset is normal here, not a bug.
        if (!cancelled) setState({ status: "error" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url, enabled]);

  return state;
}
