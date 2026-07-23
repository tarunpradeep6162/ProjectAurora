import { useEffect, useState } from "react";

function getDeviceInformation() {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 720,
      devicePixelRatio: 1,
      memory: 8,
      cores: 8,
      isMobile: false,
      isTouchDevice: false,
      reducedMotion: false,
      saveData: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const isTouchDevice = window.matchMedia(
    "(pointer: coarse)"
  ).matches;

  const isMobile =
    width <= 820 ||
    isTouchDevice;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return {
    width,
    height,
    devicePixelRatio:
      window.devicePixelRatio || 1,
    memory:
      navigator.deviceMemory || 8,
    cores:
      navigator.hardwareConcurrency || 8,
    isMobile,
    isTouchDevice,
    reducedMotion,
    saveData:
      navigator.connection?.saveData === true,
  };
}

function createQualityProfile() {
  const device = getDeviceInformation();

  if (device.reducedMotion) {
    return {
      level: "reduced",
      profile: "reduced-motion",
      isMobile: device.isMobile,

      starCount: device.isMobile
        ? 1800
        : 2600,

      particleCount: device.isMobile
        ? 700
        : 1000,

      minimumDpr: 1,
      initialDpr: 1,
      maxDpr: device.isMobile
        ? 1.25
        : 1.5,

      motionEnabled: false,
      postprocessingEnabled: true,
      antialiasEnabled: false,
    };
  }

  if (device.saveData) {
    return {
      level: "medium",
      profile: "data-saver",
      isMobile: device.isMobile,

      starCount: device.isMobile
        ? 2400
        : 3500,

      particleCount: device.isMobile
        ? 1000
        : 1500,

      minimumDpr: 1,
      initialDpr: 1.1,
      maxDpr: device.isMobile
        ? 1.35
        : 1.6,

      motionEnabled: true,
      postprocessingEnabled: true,
      antialiasEnabled: false,
    };
  }

  if (device.isMobile) {
    const strongerMobile =
      device.memory >= 6 &&
      device.cores >= 6;

    return {
      level: strongerMobile
        ? "high"
        : "medium",

      profile: strongerMobile
        ? "mobile-high"
        : "mobile-balanced-high",

      isMobile: true,

      starCount: strongerMobile
        ? 3600
        : 2800,

      particleCount: strongerMobile
        ? 1600
        : 1250,

      minimumDpr: 1,
      initialDpr: strongerMobile
        ? 1.35
        : 1.2,

      maxDpr: strongerMobile
        ? 1.6
        : 1.4,

      motionEnabled: true,
      postprocessingEnabled: true,
      antialiasEnabled: false,
    };
  }

  const powerfulLaptop =
    device.memory >= 8 &&
    device.cores >= 8 &&
    device.width >= 1200;

  if (powerfulLaptop) {
    return {
      level: "high",
      profile: "laptop-ultra",
      isMobile: false,

      starCount: 6000,
      particleCount: 2500,

      minimumDpr: 1.15,
      initialDpr: Math.min(
        device.devicePixelRatio,
        1.75
      ),
      maxDpr: 2,

      motionEnabled: true,
      postprocessingEnabled: true,
      antialiasEnabled: false,
    };
  }

  return {
    level: "high",
    profile: "laptop-high",
    isMobile: false,

    starCount: 4800,
    particleCount: 2000,

    minimumDpr: 1,
    initialDpr: Math.min(
      device.devicePixelRatio,
      1.5
    ),
    maxDpr: 1.75,

    motionEnabled: true,
    postprocessingEnabled: true,
    antialiasEnabled: false,
  };
}

function useDeviceQuality() {
  const [quality, setQuality] = useState(
    createQualityProfile
  );

  useEffect(() => {
    let resizeTimer;

    const updateQuality = () => {
      window.clearTimeout(resizeTimer);

      resizeTimer = window.setTimeout(() => {
        setQuality(createQualityProfile());
      }, 300);
    };

    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    window.addEventListener(
      "resize",
      updateQuality,
      { passive: true }
    );

    window.addEventListener(
      "orientationchange",
      updateQuality,
      { passive: true }
    );

    motionQuery.addEventListener?.(
      "change",
      updateQuality
    );

    return () => {
      window.clearTimeout(resizeTimer);

      window.removeEventListener(
        "resize",
        updateQuality
      );

      window.removeEventListener(
        "orientationchange",
        updateQuality
      );

      motionQuery.removeEventListener?.(
        "change",
        updateQuality
      );
    };
  }, []);

  return quality;
}

export default useDeviceQuality;
