import { useFrame } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

const EnvironmentContext =
  createContext(null);

function clamp01(value) {
  return THREE.MathUtils.clamp(
    value,
    0,
    1
  );
}

function smoothstep(
  minimum,
  maximum,
  value
) {
  const normalized = clamp01(
    (value - minimum) /
      Math.max(
        maximum - minimum,
        0.000001
      )
  );

  return (
    normalized *
    normalized *
    (3 - 2 * normalized)
  );
}

function calculateStoryPhase(progress) {
  if (progress < 0.12) {
    return "hero";
  }

  if (progress < 0.3) {
    return "story";
  }

  if (progress < 0.48) {
    return "memory";
  }

  if (progress < 0.63) {
    return "love-letter";
  }

  if (progress < 0.78) {
    return "journey";
  }

  if (progress < 0.9) {
    return "treasure";
  }

  return "universe-ending";
}

function EnvironmentController({
  children,
  motionEnabled = true,
}) {
  const stateRef = useRef({
    rawProgress: 0,
    progress: 0,
    targetProgress: 0,

    rawVelocity: 0,
    velocity: 0,
    targetVelocity: 0,

    direction: 0,
    cinematicIntensity: 0,
    warmth: 0,
    depth: 0,
    calmness: 1,

    phase: "hero",
  });

  const previousScrollY =
    useRef(0);

  const previousTimestamp =
    useRef(
      typeof performance !== "undefined"
        ? performance.now()
        : 0
    );

  const documentHeight =
    useRef(1);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const updateDocumentHeight = () => {
      documentHeight.current = Math.max(
        document.documentElement.scrollHeight -
          window.innerHeight,
        1
      );
    };

    const updateScrollState = () => {
      const currentTimestamp =
        performance.now();

      const elapsedMilliseconds =
        Math.max(
          currentTimestamp -
            previousTimestamp.current,
          8
        );

      const currentScrollY =
        window.scrollY ||
        window.pageYOffset ||
        0;

      const progress =
        currentScrollY /
        documentHeight.current;

      const scrollDelta =
        currentScrollY -
        previousScrollY.current;

      const velocity =
        scrollDelta /
        elapsedMilliseconds;

      stateRef.current.rawProgress =
        clamp01(progress);

      stateRef.current.targetProgress =
        clamp01(progress);

      stateRef.current.rawVelocity =
        THREE.MathUtils.clamp(
          velocity,
          -3,
          3
        );

      stateRef.current.targetVelocity =
        THREE.MathUtils.clamp(
          velocity,
          -3,
          3
        );

      stateRef.current.direction =
        scrollDelta === 0
          ? stateRef.current.direction
          : scrollDelta > 0
            ? 1
            : -1;

      previousScrollY.current =
        currentScrollY;

      previousTimestamp.current =
        currentTimestamp;
    };

    updateDocumentHeight();

    previousScrollY.current =
      window.scrollY ||
      window.pageYOffset ||
      0;

    updateScrollState();

    window.addEventListener(
      "scroll",
      updateScrollState,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      updateDocumentHeight,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateScrollState
      );

      window.removeEventListener(
        "resize",
        updateDocumentHeight
      );
    };
  }, []);

  useFrame((_, delta) => {
    const safeDelta = Math.min(
      delta,
      0.05
    );

    const state =
      stateRef.current;

    const progressDamping =
      1 -
      Math.exp(
        -safeDelta *
          (
            motionEnabled
              ? 5.5
              : 12
          )
      );

    const velocityDamping =
      1 -
      Math.exp(
        -safeDelta * 7.5
      );

    state.progress =
      THREE.MathUtils.lerp(
        state.progress,
        state.targetProgress,
        progressDamping
      );

    state.velocity =
      THREE.MathUtils.lerp(
        state.velocity,
        state.targetVelocity,
        velocityDamping
      );

    state.targetVelocity =
      THREE.MathUtils.lerp(
        state.targetVelocity,
        0,
        1 -
          Math.exp(
            -safeDelta * 4.8
          )
      );

    const progress =
      state.progress;

    const heroLift =
      smoothstep(
        0,
        0.14,
        progress
      );

    const loveLetterGlow =
      smoothstep(
        0.4,
        0.59,
        progress
      ) *
      (
        1 -
        smoothstep(
          0.62,
          0.75,
          progress
        )
      );

    const treasureGlow =
      smoothstep(
        0.72,
        0.84,
        progress
      ) *
      (
        1 -
        smoothstep(
          0.88,
          0.96,
          progress
        )
      );

    const endingFade =
      smoothstep(
        0.88,
        1,
        progress
      );

    const velocityEnergy =
      Math.min(
        Math.abs(state.velocity) *
          0.32,
        0.22
      );

    state.cinematicIntensity =
      THREE.MathUtils.clamp(
        0.72 +
          heroLift * 0.08 +
          loveLetterGlow * 0.2 +
          treasureGlow * 0.26 -
          endingFade * 0.13 +
          velocityEnergy,
        0.58,
        1.22
      );

    state.warmth =
      THREE.MathUtils.clamp(
        loveLetterGlow * 0.78 +
          treasureGlow * 0.54 -
          endingFade * 0.16,
        0,
        1
      );

    state.depth =
      THREE.MathUtils.clamp(
        0.18 +
          smoothstep(
            0.1,
            0.75,
            progress
          ) *
            0.68 -
          endingFade * 0.24,
        0,
        1
      );

    state.calmness =
      THREE.MathUtils.clamp(
        1 -
          Math.abs(
            state.velocity
          ) *
            0.18 +
          endingFade * 0.12,
        0.55,
        1
      );

    state.phase =
      calculateStoryPhase(
        progress
      );
  });

  const contextValue =
    useMemo(
      () => ({
        stateRef,
      }),
      []
    );

  return (
    <EnvironmentContext.Provider
      value={contextValue}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

function useEnvironmentController() {
  const context =
    useContext(
      EnvironmentContext
    );

  if (!context) {
    throw new Error(
      "useEnvironmentController must be used inside EnvironmentController."
    );
  }

  return context;
}

export {
  EnvironmentController,
  useEnvironmentController,
};

export default EnvironmentController;
