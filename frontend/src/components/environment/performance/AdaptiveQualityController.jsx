import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  usePerformanceMonitor,
} from "./PerformanceMonitor";

const AdaptiveQualityContext =
  createContext(null);

const QUALITY_ORDER = [
  "reduced",
  "low",
  "medium",
  "high",
];

const QUALITY_PROFILES = {
  reduced: {
    level: "reduced",

    dprMinimum: 0.7,
    dprMaximum: 0.85,

    motionEnabled: false,
    postprocessingEnabled: false,

    atmosphereEnabled: false,
    hazeEnabled: false,
    nebulaEnabled: false,

    starsEnabled: true,
    particlesEnabled: false,

    bloomEnabled: false,
    colorGradingEnabled: false,
    chromaticAberrationEnabled: false,
    noiseEnabled: false,
    vignetteEnabled: true,

    lightingEnabled: true,

    starMultiplier: 0.2,
    particleMultiplier: 0,
    nebulaMultiplier: 0,
    hazeMultiplier: 0,

    cameraMotionMultiplier: 0,
    lightingMultiplier: 0.55,
    bloomMultiplier: 0,
  },

  low: {
    level: "low",

    dprMinimum: 0.8,
    dprMaximum: 1,

    motionEnabled: true,
    postprocessingEnabled: true,

    atmosphereEnabled: true,
    hazeEnabled: false,
    nebulaEnabled: true,

    starsEnabled: true,
    particlesEnabled: true,

    bloomEnabled: true,
    colorGradingEnabled: false,
    chromaticAberrationEnabled: false,
    noiseEnabled: false,
    vignetteEnabled: true,

    lightingEnabled: true,

    starMultiplier: 0.4,
    particleMultiplier: 0.3,
    nebulaMultiplier: 0.35,
    hazeMultiplier: 0,

    cameraMotionMultiplier: 0.35,
    lightingMultiplier: 0.7,
    bloomMultiplier: 0.5,
  },

  medium: {
    level: "medium",

    dprMinimum: 0.9,
    dprMaximum: 1.25,

    motionEnabled: true,
    postprocessingEnabled: true,

    atmosphereEnabled: true,
    hazeEnabled: true,
    nebulaEnabled: true,

    starsEnabled: true,
    particlesEnabled: true,

    bloomEnabled: true,
    colorGradingEnabled: true,
    chromaticAberrationEnabled: false,
    noiseEnabled: true,
    vignetteEnabled: true,

    lightingEnabled: true,

    starMultiplier: 0.68,
    particleMultiplier: 0.6,
    nebulaMultiplier: 0.65,
    hazeMultiplier: 0.55,

    cameraMotionMultiplier: 0.7,
    lightingMultiplier: 0.85,
    bloomMultiplier: 0.76,
  },

  high: {
    level: "high",

    dprMinimum: 1,
    dprMaximum: 1.5,

    motionEnabled: true,
    postprocessingEnabled: true,

    atmosphereEnabled: true,
    hazeEnabled: true,
    nebulaEnabled: true,

    starsEnabled: true,
    particlesEnabled: true,

    bloomEnabled: true,
    colorGradingEnabled: true,
    chromaticAberrationEnabled: true,
    noiseEnabled: true,
    vignetteEnabled: true,

    lightingEnabled: true,

    starMultiplier: 1,
    particleMultiplier: 1,
    nebulaMultiplier: 1,
    hazeMultiplier: 1,

    cameraMotionMultiplier: 1,
    lightingMultiplier: 1,
    bloomMultiplier: 1,
  },
};

function normalizeQualityLevel(
  qualityLevel
) {
  return QUALITY_PROFILES[
    qualityLevel
  ]
    ? qualityLevel
    : "high";
}

function getLowerQualityLevel(
  firstLevel,
  secondLevel
) {
  const firstIndex =
    QUALITY_ORDER.indexOf(
      normalizeQualityLevel(
        firstLevel
      )
    );

  const secondIndex =
    QUALITY_ORDER.indexOf(
      normalizeQualityLevel(
        secondLevel
      )
    );

  return QUALITY_ORDER[
    Math.min(
      firstIndex,
      secondIndex
    )
  ];
}

function mergeBooleanSetting(
  baseValue,
  profileValue
) {
  return (
    baseValue !== false &&
    profileValue !== false
  );
}

function createEffectiveQuality(
  baseQuality,
  runtimeLevel,
  isMobile,
  prefersReducedMotion
) {
  const profile =
    QUALITY_PROFILES[
      runtimeLevel
    ] ??
    QUALITY_PROFILES.high;

  const safeBaseQuality =
    baseQuality ?? {};

  const motionEnabled =
    prefersReducedMotion
      ? false
      : mergeBooleanSetting(
          safeBaseQuality
            .motionEnabled,
          profile.motionEnabled
        );

  return {
    ...safeBaseQuality,
    ...profile,

    level: runtimeLevel,

    requestedLevel:
      normalizeQualityLevel(
        safeBaseQuality.level
      ),

    runtimeLevel,

    isMobile:
      safeBaseQuality
        .isMobile ??
      isMobile,

    motionEnabled,

    postprocessingEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .postprocessingEnabled,
        profile
          .postprocessingEnabled
      ),

    atmosphereEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .atmosphereEnabled,
        profile
          .atmosphereEnabled
      ),

    hazeEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .hazeEnabled,
        profile.hazeEnabled
      ),

    nebulaEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .nebulaEnabled,
        profile.nebulaEnabled
      ),

    starsEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .starsEnabled,
        profile.starsEnabled
      ),

    particlesEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .particlesEnabled,
        profile
          .particlesEnabled
      ),

    lightingEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .lightingEnabled,
        profile
          .lightingEnabled
      ),

    bloomEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .bloomEnabled,
        profile.bloomEnabled
      ),

    colorGradingEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .colorGradingEnabled,
        profile
          .colorGradingEnabled
      ),

    chromaticAberrationEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .chromaticAberrationEnabled,
        profile
          .chromaticAberrationEnabled
      ),

    noiseEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .noiseEnabled,
        profile.noiseEnabled
      ),

    vignetteEnabled:
      mergeBooleanSetting(
        safeBaseQuality
          .vignetteEnabled,
        profile.vignetteEnabled
      ),

    prefersReducedMotion,
  };
}

function AdaptiveQualityController({
  quality,
  children,
  debug = false,
}) {
  const {
    recommendedQuality,
    maximumQuality,
    deviceTier,
    isMobile,
    prefersReducedMotion,
    performanceStateRef,
  } =
    usePerformanceMonitor();

  const requestedLevel =
    normalizeQualityLevel(
      quality?.level
    );

  /*
   * Never allow the runtime quality to exceed:
   *
   * 1. The quality requested by the application
   * 2. The device's maximum quality
   * 3. The performance monitor recommendation
   */
  const runtimeLevel =
    useMemo(() => {
      const deviceLimitedLevel =
        getLowerQualityLevel(
          requestedLevel,
          maximumQuality
        );

      return getLowerQualityLevel(
        deviceLimitedLevel,
        recommendedQuality
      );
    }, [
      requestedLevel,
      maximumQuality,
      recommendedQuality,
    ]);

  const effectiveQuality =
    useMemo(
      () =>
        createEffectiveQuality(
          quality,
          runtimeLevel,
          isMobile,
          prefersReducedMotion
        ),
      [
        quality,
        runtimeLevel,
        isMobile,
        prefersReducedMotion,
      ]
    );

  /*
   * Mutable runtime data for components that need to read performance
   * information without causing React renders on every FPS sample.
   */
  const adaptiveQualityStateRef =
    useRef({
      runtimeLevel,

      requestedLevel,

      recommendedQuality,

      maximumQuality,

      deviceTier,

      effectiveQuality,

      performancePressure: 0,

      fps: 60,

      smoothedFps: 60,
    });

  useEffect(() => {
    const performance =
      performanceStateRef.current;

    adaptiveQualityStateRef.current = {
      runtimeLevel,

      requestedLevel,

      recommendedQuality,

      maximumQuality,

      deviceTier,

      effectiveQuality,

      performancePressure:
        performance
          ?.performancePressure ??
        0,

      fps:
        performance?.fps ??
        60,

      smoothedFps:
        performance
          ?.smoothedFps ??
        60,
    };

    if (debug) {
      console.table({
        requestedLevel,

        maximumQuality,

        recommendedQuality,

        runtimeLevel,

        deviceTier,

        isMobile:
          effectiveQuality
            .isMobile,

        motionEnabled:
          effectiveQuality
            .motionEnabled,

        postprocessingEnabled:
          effectiveQuality
            .postprocessingEnabled,

        atmosphereEnabled:
          effectiveQuality
            .atmosphereEnabled,

        particlesEnabled:
          effectiveQuality
            .particlesEnabled,
      });
    }
  }, [
    runtimeLevel,
    requestedLevel,
    recommendedQuality,
    maximumQuality,
    deviceTier,
    effectiveQuality,
    performanceStateRef,
    debug,
  ]);

  const contextValue =
    useMemo(
      () => ({
        quality:
          effectiveQuality,

        runtimeLevel,

        requestedLevel,

        recommendedQuality,

        maximumQuality,

        deviceTier,

        adaptiveQualityStateRef,
      }),
      [
        effectiveQuality,
        runtimeLevel,
        requestedLevel,
        recommendedQuality,
        maximumQuality,
        deviceTier,
      ]
    );

  return (
    <AdaptiveQualityContext.Provider
      value={contextValue}
    >
      {children}
    </AdaptiveQualityContext.Provider>
  );
}

function useAdaptiveQuality() {
  const context =
    useContext(
      AdaptiveQualityContext
    );

  if (!context) {
    throw new Error(
      "useAdaptiveQuality must be used inside AdaptiveQualityController."
    );
  }

  return context;
}

export {
  AdaptiveQualityController,
  QUALITY_PROFILES,
  useAdaptiveQuality,
};

export default AdaptiveQualityController;
