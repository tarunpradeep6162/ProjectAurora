import { PerformanceMonitor } from "@react-three/drei";
import {
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import * as THREE from "three";

function AdaptiveQuality({
  maximumDpr = 2,
  minimumDpr = 1,
  initialDpr = 1.5,
  isMobile = false,
}) {
  const gl = useThree(
    (state) => state.gl
  );

  const setDpr = useThree(
    (state) => state.setDpr
  );

  const currentDpr = useRef(
    THREE.MathUtils.clamp(
      initialDpr,
      minimumDpr,
      maximumDpr
    )
  );

  const targetDpr = useRef(
    currentDpr.current
  );

  const declineCount = useRef(0);
  const inclineCount = useRef(0);

  useEffect(() => {
    const startingDpr =
      THREE.MathUtils.clamp(
        initialDpr,
        minimumDpr,
        maximumDpr
      );

    currentDpr.current =
      startingDpr;

    targetDpr.current =
      startingDpr;

    setDpr(startingDpr);
  }, [
    initialDpr,
    maximumDpr,
    minimumDpr,
    setDpr,
  ]);

  const handleIncline = useCallback(
    () => {
      inclineCount.current += 1;
      declineCount.current = 0;

      const step =
        isMobile ? 0.08 : 0.12;

      targetDpr.current =
        Math.min(
          maximumDpr,
          targetDpr.current + step
        );
    },
    [isMobile, maximumDpr]
  );

  const handleDecline = useCallback(
    () => {
      declineCount.current += 1;
      inclineCount.current = 0;

      const step =
        isMobile ? 0.12 : 0.16;

      targetDpr.current =
        Math.max(
          minimumDpr,
          targetDpr.current - step
        );
    },
    [isMobile, minimumDpr]
  );

  const handleFallback = useCallback(
    () => {
      targetDpr.current =
        minimumDpr;
    },
    [minimumDpr]
  );

  useFrame((_, delta) => {
    const difference =
      Math.abs(
        currentDpr.current -
        targetDpr.current
      );

    if (difference < 0.01) {
      return;
    }

    const safeDelta =
      Math.min(delta, 0.05);

    const interpolation =
      1 -
      Math.exp(
        -safeDelta * 2.4
      );

    currentDpr.current =
      THREE.MathUtils.lerp(
        currentDpr.current,
        targetDpr.current,
        interpolation
      );

    const roundedDpr =
      Math.round(
        currentDpr.current * 100
      ) / 100;

    if (
      Math.abs(
        gl.getPixelRatio() -
        roundedDpr
      ) >= 0.02
    ) {
      setDpr(roundedDpr);
    }
  });

  return (
    <PerformanceMonitor
      bounds={
        isMobile
          ? [42, 58]
          : [50, 60]
      }
      flipflops={4}
      factor={0.5}
      onIncline={handleIncline}
      onDecline={handleDecline}
      onFallback={handleFallback}
    />
  );
}

export default AdaptiveQuality;
