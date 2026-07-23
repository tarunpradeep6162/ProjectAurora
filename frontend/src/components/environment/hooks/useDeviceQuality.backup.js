import { useEffect, useState } from "react";

function detectQuality() {
  if (typeof window === "undefined") {
    return {
      level: "medium",
      starCount: 900,
      maxDpr: 1.5,
      motionEnabled: true,
    };
  }

  const width = window.innerWidth;
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = width < 768;
  const isWeakDevice = memory <= 4 || cores <= 4;

  if (reducedMotion) {
    return {
      level: "reduced",
      starCount: 250,
      maxDpr: 1,
      motionEnabled: false,
    };
  }

  if (isMobile || isWeakDevice) {
    return {
      level: "low",
      starCount: 450,
      maxDpr: 1,
      motionEnabled: true,
    };
  }

  if (memory >= 8 && cores >= 8 && width >= 1280) {
    return {
      level: "high",
      starCount: 1500,
      maxDpr: 1.5,
      motionEnabled: true,
    };
  }

  return {
    level: "medium",
    starCount: 900,
    maxDpr: 1.25,
    motionEnabled: true,
  };
}

function useDeviceQuality() {
  const [quality, setQuality] = useState(detectQuality);

  useEffect(() => {
    let resizeTimer;

    const handleResize = () => {
      window.clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(() => {
        setQuality(detectQuality());
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return quality;
}

export default useDeviceQuality;
