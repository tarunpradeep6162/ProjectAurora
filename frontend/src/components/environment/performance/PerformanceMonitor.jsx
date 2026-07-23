import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useFrame,
  useThree,
} from "@react-three/fiber";

/*
 * Sampling configuration
 *
 * WARMUP_DURATION:
 * Ignores startup compilation, texture loading and initial mounting.
 *
 * SAMPLE_DURATION:
 * FPS is calculated over this period instead of using one frame.
 *
 * REQUIRED_SLOW_SAMPLES:
 * Number of consecutive slow samples required before recommending
 * a lower quality level.
 *
 * REQUIRED_FAST_SAMPLES:
 * A larger number is required before recommending an upgrade.
 * This prevents constant high/medium switching.
 */
const WARMUP_DURATION = 3;
const SAMPLE_DURATION = 1.25;

const REQUIRED_SLOW_SAMPLES = 3;
const REQUIRED_CRITICAL_SAMPLES = 2;
const REQUIRED_FAST_SAMPLES = 7;

const MINIMUM_VALID_DELTA = 1 / 240;
const MAXIMUM_VALID_DELTA = 0.25;

const PerformanceContext =
  createContext(null);

function clamp(
  value,
  minimum,
  maximum
) {
  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );
}

function getNavigatorNumber(
  propertyName,
  fallback
) {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return fallback;
  }

  const value =
    navigator[propertyName];

  return Number.isFinite(value)
    ? value
    : fallback;
}

function getDeviceMemory() {
  /*
   * navigator.deviceMemory is supported by some Chromium browsers.
   * It is treated as an optional signal, never as a hard requirement.
   */
  return getNavigatorNumber(
    "deviceMemory",
    4
  );
}

function getCpuThreads() {
  return getNavigatorNumber(
    "hardwareConcurrency",
    4
  );
}

function detectMobileDevice() {
  if (
    typeof window ===
      "undefined" ||
    typeof navigator ===
      "undefined"
  ) {
    return false;
  }

  const coarsePointer =
    window.matchMedia?.(
      "(pointer: coarse)"
    ).matches ?? false;

  const smallViewport =
    window.innerWidth <= 900;

  const userAgent =
    navigator.userAgent ??
    "";

  const mobileUserAgent =
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      userAgent
    );

  return (
    mobileUserAgent ||
    (
      coarsePointer &&
      smallViewport
    )
  );
}

function calculateDeviceScore(
  gl,
  isMobile
) {
  const cpuThreads =
    getCpuThreads();

  const deviceMemory =
    getDeviceMemory();

  const maximumTextureSize =
    gl.capabilities
      ?.maxTextureSize ?? 2048;

  let score = 0;

  if (cpuThreads >= 12) {
    score += 3;
  } else if (cpuThreads >= 8) {
    score += 2;
  } else if (cpuThreads >= 4) {
    score += 1;
  } else {
    score -= 1;
  }

  if (deviceMemory >= 8) {
    score += 3;
  } else if (deviceMemory >= 6) {
    score += 2;
  } else if (deviceMemory >= 4) {
    score += 1;
  } else {
    score -= 1;
  }

  if (
    maximumTextureSize >= 16384
  ) {
    score += 2;
  } else if (
    maximumTextureSize >= 8192
  ) {
    score += 1;
  } else if (
    maximumTextureSize <= 4096
  ) {
    score -= 1;
  }

  if (isMobile) {
    score -= 2;
  }

  return {
    score,

    cpuThreads,

    deviceMemory,

    maximumTextureSize,
  };
}

function classifyDevice(
  deviceScore
) {
  if (deviceScore >= 6) {
    return "high";
  }

  if (deviceScore >= 3) {
    return "medium";
  }

  if (deviceScore >= 0) {
    return "low";
  }

  return "reduced";
}

function getInitialQuality(
  deviceTier,
  prefersReducedMotion
) {
  if (prefersReducedMotion) {
    return "reduced";
  }

  return deviceTier;
}

function getLowerQuality(
  currentQuality
) {
  switch (currentQuality) {
    case "high":
      return "medium";

    case "medium":
      return "low";

    case "low":
      return "reduced";

    default:
      return "reduced";
  }
}

function getHigherQuality(
  currentQuality,
  maximumQuality
) {
  const qualityOrder = [
    "reduced",
    "low",
    "medium",
    "high",
  ];

  const currentIndex =
    qualityOrder.indexOf(
      currentQuality
    );

  const maximumIndex =
    qualityOrder.indexOf(
      maximumQuality
    );

  const nextIndex =
    Math.min(
      currentIndex + 1,
      maximumIndex
    );

  return (
    qualityOrder[nextIndex] ??
    currentQuality
  );
}

function classifyPerformance(
  fps
) {
  if (fps < 24) {
    return "critical";
  }

  if (fps < 38) {
    return "slow";
  }

  if (fps < 50) {
    return "moderate";
  }

  return "smooth";
}

function getPerformancePressure(
  fps
) {
  /*
   * 60 FPS gives approximately zero pressure.
   * 20 FPS gives approximately full pressure.
   */
  return clamp(
    (60 - fps) / 40,
    0,
    1
  );
}

function PerformanceMonitor({
  children,
  debug = false,
}) {
  const {
    gl,
  } = useThree();

  const prefersReducedMotion =
    useMemo(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return false;
      }

      return window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches ?? false;
    }, []);

  const isMobile =
    useMemo(
      () =>
        detectMobileDevice(),
      []
    );

  const deviceInformation =
    useMemo(
      () =>
        calculateDeviceScore(
          gl,
          isMobile
        ),
      [
        gl,
        isMobile,
      ]
    );

  const deviceTier =
    useMemo(
      () =>
        classifyDevice(
          deviceInformation.score
        ),
      [
        deviceInformation.score,
      ]
    );

  const maximumQuality =
    useMemo(
      () =>
        getInitialQuality(
          deviceTier,
          prefersReducedMotion
        ),
      [
        deviceTier,
        prefersReducedMotion,
      ]
    );

  /*
   * React state changes only when the recommended quality changes.
   * FPS and frame measurements remain inside mutable refs.
   */
  const [
    recommendedQuality,
    setRecommendedQuality,
  ] = useState(
    maximumQuality
  );

  const performanceStateRef =
    useRef({
      fps: 60,

      smoothedFps: 60,

      frameTimeMs: 16.67,

      performanceStatus:
        "warming-up",

      performancePressure: 0,

      recommendedQuality:
        maximumQuality,

      maximumQuality,

      deviceTier,

      deviceScore:
        deviceInformation.score,

      cpuThreads:
        deviceInformation
          .cpuThreads,

      deviceMemory:
        deviceInformation
          .deviceMemory,

      maximumTextureSize:
        deviceInformation
          .maximumTextureSize,

      isMobile,

      prefersReducedMotion,

      isWarmingUp: true,

      sampleCount: 0,

      droppedFrameCount: 0,

      slowSampleCount: 0,

      criticalSampleCount: 0,

      fastSampleCount: 0,

      lastQualityChangeTime: 0,
    });

  const monitorRef =
    useRef({
      elapsedTime: 0,

      sampleElapsedTime: 0,

      sampleFrameCount: 0,

      slowSampleCount: 0,

      criticalSampleCount: 0,

      fastSampleCount: 0,

      droppedFrameCount: 0,

      sampleCount: 0,

      smoothedFps: 60,

      lastDebugTime: 0,
    });

  useEffect(() => {
    performanceStateRef.current.maximumQuality =
      maximumQuality;

    performanceStateRef.current.deviceTier =
      deviceTier;

    performanceStateRef.current.deviceScore =
      deviceInformation.score;

    performanceStateRef.current.cpuThreads =
      deviceInformation.cpuThreads;

    performanceStateRef.current.deviceMemory =
      deviceInformation.deviceMemory;

    performanceStateRef.current.maximumTextureSize =
      deviceInformation.maximumTextureSize;

    performanceStateRef.current.isMobile =
      isMobile;

    performanceStateRef.current.prefersReducedMotion =
      prefersReducedMotion;

    if (
      prefersReducedMotion &&
      recommendedQuality !==
        "reduced"
    ) {
      performanceStateRef.current.recommendedQuality =
        "reduced";

      setRecommendedQuality(
        "reduced"
      );
    }
  }, [
    deviceInformation,
    deviceTier,
    isMobile,
    maximumQuality,
    prefersReducedMotion,
    recommendedQuality,
  ]);

  useFrame(
    (_, rawDelta) => {
      const monitor =
        monitorRef.current;

      const state =
        performanceStateRef.current;

      const delta =
        clamp(
          Number.isFinite(rawDelta)
            ? rawDelta
            : 1 / 60,
          MINIMUM_VALID_DELTA,
          MAXIMUM_VALID_DELTA
        );

      monitor.elapsedTime +=
        delta;

      /*
       * Ignore initial shader compilation, texture upload and mounting.
       */
      if (
        monitor.elapsedTime <
        WARMUP_DURATION
      ) {
        state.isWarmingUp =
          true;

        state.performanceStatus =
          "warming-up";

        return;
      }

      state.isWarmingUp =
        false;

      monitor.sampleElapsedTime +=
        delta;

      monitor.sampleFrameCount +=
        1;

      if (delta > 1 / 30) {
        monitor.droppedFrameCount +=
          1;
      }

      if (
        monitor.sampleElapsedTime <
        SAMPLE_DURATION
      ) {
        return;
      }

      const measuredFps =
        monitor.sampleFrameCount /
        monitor.sampleElapsedTime;

      const boundedFps =
        clamp(
          measuredFps,
          1,
          240
        );

      /*
       * Exponential smoothing prevents one bad sample from immediately
       * changing the performance recommendation.
       */
      monitor.smoothedFps =
        monitor.sampleCount === 0
          ? boundedFps
          : (
              monitor.smoothedFps *
                0.72 +
              boundedFps *
                0.28
            );

      monitor.sampleCount +=
        1;

      const smoothedFps =
        monitor.smoothedFps;

      const performanceStatus =
        classifyPerformance(
          smoothedFps
        );

      const performancePressure =
        getPerformancePressure(
          smoothedFps
        );

      state.fps =
        boundedFps;

      state.smoothedFps =
        smoothedFps;

      state.frameTimeMs =
        1000 /
        Math.max(
          smoothedFps,
          1
        );

      state.performanceStatus =
        performanceStatus;

      state.performancePressure =
        performancePressure;

      state.sampleCount =
        monitor.sampleCount;

      state.droppedFrameCount =
        monitor.droppedFrameCount;

      /*
       * Hysteresis counters
       *
       * Critical performance degrades more quickly.
       * Smooth performance upgrades much more slowly.
       */
      if (
        performanceStatus ===
        "critical"
      ) {
        monitor.criticalSampleCount +=
          1;

        monitor.slowSampleCount +=
          1;

        monitor.fastSampleCount =
          0;
      } else if (
        performanceStatus ===
          "slow" ||
        performanceStatus ===
          "moderate"
      ) {
        monitor.slowSampleCount +=
          1;

        monitor.criticalSampleCount =
          0;

        monitor.fastSampleCount =
          0;
      } else {
        monitor.fastSampleCount +=
          1;

        monitor.slowSampleCount =
          0;

        monitor.criticalSampleCount =
          0;
      }

      state.slowSampleCount =
        monitor.slowSampleCount;

      state.criticalSampleCount =
        monitor.criticalSampleCount;

      state.fastSampleCount =
        monitor.fastSampleCount;

      let nextQuality =
        state.recommendedQuality;

      if (
        monitor.criticalSampleCount >=
        REQUIRED_CRITICAL_SAMPLES
      ) {
        nextQuality =
          getLowerQuality(
            getLowerQuality(
              state.recommendedQuality
            )
          );

        monitor.criticalSampleCount =
          0;

        monitor.slowSampleCount =
          0;

        monitor.fastSampleCount =
          0;
      } else if (
        monitor.slowSampleCount >=
        REQUIRED_SLOW_SAMPLES
      ) {
        nextQuality =
          getLowerQuality(
            state.recommendedQuality
          );

        monitor.slowSampleCount =
          0;

        monitor.fastSampleCount =
          0;
      } else if (
        monitor.fastSampleCount >=
        REQUIRED_FAST_SAMPLES
      ) {
        nextQuality =
          getHigherQuality(
            state.recommendedQuality,
            maximumQuality
          );

        monitor.fastSampleCount =
          0;
      }

      if (
        prefersReducedMotion
      ) {
        nextQuality =
          "reduced";
      }

      if (
        nextQuality !==
        state.recommendedQuality
      ) {
        state.recommendedQuality =
          nextQuality;

        state.lastQualityChangeTime =
          monitor.elapsedTime;

        setRecommendedQuality(
          nextQuality
        );
      }

      if (
        debug &&
        monitor.elapsedTime -
          monitor.lastDebugTime >=
          2.5
      ) {
        monitor.lastDebugTime =
          monitor.elapsedTime;

        console.table({
          fps:
            boundedFps.toFixed(
              1
            ),

          smoothedFps:
            smoothedFps.toFixed(
              1
            ),

          frameTimeMs:
            state.frameTimeMs.toFixed(
              2
            ),

          performanceStatus,

          performancePressure:
            performancePressure.toFixed(
              2
            ),

          recommendedQuality:
            state.recommendedQuality,

          maximumQuality,

          deviceTier,

          isMobile,
        });
      }

      monitor.sampleElapsedTime =
        0;

      monitor.sampleFrameCount =
        0;
    }
  );

  const contextValue =
    useMemo(
      () => ({
        performanceStateRef,

        recommendedQuality,

        maximumQuality,

        deviceTier,

        isMobile,

        prefersReducedMotion,
      }),
      [
        recommendedQuality,
        maximumQuality,
        deviceTier,
        isMobile,
        prefersReducedMotion,
      ]
    );

  return (
    <PerformanceContext.Provider
      value={contextValue}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

function usePerformanceMonitor() {
  const context =
    useContext(
      PerformanceContext
    );

  if (!context) {
    throw new Error(
      "usePerformanceMonitor must be used inside PerformanceMonitor."
    );
  }

  return context;
}

export {
  PerformanceMonitor,
  usePerformanceMonitor,
};

export default PerformanceMonitor;
