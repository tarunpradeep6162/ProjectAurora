import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useThree,
} from "@react-three/fiber";

const DEFAULT_DPR_LIMITS = {
  reduced: {
    minimum: 0.7,
    maximum: 0.85,
  },

  low: {
    minimum: 0.8,
    maximum: 1,
  },

  medium: {
    minimum: 0.9,
    maximum: 1.25,
  },

  high: {
    minimum: 1,
    maximum: 1.5,
  },
};

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

function getSafeDevicePixelRatio() {
  if (
    typeof window ===
    "undefined"
  ) {
    return 1;
  }

  const devicePixelRatio =
    window.devicePixelRatio;

  if (
    !Number.isFinite(
      devicePixelRatio
    ) ||
    devicePixelRatio <= 0
  ) {
    return 1;
  }

  /*
   * Extremely high mobile DPR values such as 3 or 4 are unnecessary
   * for this cinematic background and can heavily increase GPU load.
   */
  return clamp(
    devicePixelRatio,
    0.7,
    2
  );
}

function getQualityDprLimits(
  quality
) {
  const qualityLevel =
    quality?.level ??
    "high";

  const defaultLimits =
    DEFAULT_DPR_LIMITS[
      qualityLevel
    ] ??
    DEFAULT_DPR_LIMITS.high;

  const configuredMinimum =
    Number.isFinite(
      quality?.dprMinimum
    )
      ? quality.dprMinimum
      : defaultLimits.minimum;

  const configuredMaximum =
    Number.isFinite(
      quality?.dprMaximum
    )
      ? quality.dprMaximum
      : defaultLimits.maximum;

  const minimum =
    Math.min(
      configuredMinimum,
      configuredMaximum
    );

  const maximum =
    Math.max(
      configuredMinimum,
      configuredMaximum
    );

  return {
    minimum: clamp(
      minimum,
      0.5,
      2
    ),

    maximum: clamp(
      maximum,
      0.5,
      2
    ),
  };
}

function calculateTargetDpr(
  quality,
  devicePixelRatio
) {
  const {
    minimum,
    maximum,
  } =
    getQualityDprLimits(
      quality
    );

  /*
   * Do not render above the actual device pixel ratio.
   * Also keep the value within the current quality profile.
   */
  return clamp(
    devicePixelRatio,
    minimum,
    maximum
  );
}

function AdaptiveQuality({
  quality,
  debug = false,
}) {
  const setDpr =
    useThree(
      (state) =>
        state.setDpr
    );

  const currentDpr =
    useThree(
      (state) =>
        state.viewport.dpr
    );

  const initialDprRef =
    useRef(null);

  const appliedDprRef =
    useRef(null);

  const devicePixelRatio =
    getSafeDevicePixelRatio();

  const targetDpr =
    useMemo(
      () =>
        calculateTargetDpr(
          quality,
          devicePixelRatio
        ),
      [
        quality?.level,
        quality?.dprMinimum,
        quality?.dprMaximum,
        devicePixelRatio,
      ]
    );

  /*
   * Store the original Canvas DPR only once.
   */
  useEffect(() => {
    if (
      initialDprRef.current ===
      null
    ) {
      initialDprRef.current =
        Number.isFinite(
          currentDpr
        )
          ? currentDpr
          : 1;
    }
  }, [
    currentDpr,
  ]);

  /*
   * Update DPR only when the quality profile changes.
   *
   * Calling setDpr every animation frame would unnecessarily recreate
   * render targets and could itself cause frame drops.
   */
  useEffect(() => {
    const roundedTargetDpr =
      Math.round(
        targetDpr * 100
      ) / 100;

    if (
      appliedDprRef.current ===
      roundedTargetDpr
    ) {
      return;
    }

    appliedDprRef.current =
      roundedTargetDpr;

    setDpr(
      roundedTargetDpr
    );

    if (debug) {
      console.table({
        qualityLevel:
          quality?.level ??
          "high",

        devicePixelRatio:
          devicePixelRatio.toFixed(
            2
          ),

        targetDpr:
          roundedTargetDpr.toFixed(
            2
          ),

        dprMinimum:
          getQualityDprLimits(
            quality
          ).minimum.toFixed(
            2
          ),

        dprMaximum:
          getQualityDprLimits(
            quality
          ).maximum.toFixed(
            2
          ),
      });
    }
  }, [
    setDpr,
    targetDpr,
    quality,
    devicePixelRatio,
    debug,
  ]);

  /*
   * Restore the Canvas DPR if this component is removed.
   */
  useEffect(
    () => () => {
      const initialDpr =
        initialDprRef.current;

      if (
        Number.isFinite(
          initialDpr
        )
      ) {
        setDpr(
          initialDpr
        );
      }
    },
    [
      setDpr,
    ]
  );

  return null;
}

export {
  DEFAULT_DPR_LIMITS,
  calculateTargetDpr,
  getQualityDprLimits,
};

export default AdaptiveQuality;
