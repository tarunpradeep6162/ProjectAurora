import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  BlendFunction,
} from "postprocessing";

import {
  ACESFilmicToneMapping,
  MathUtils,
  Vector2,
} from "three";

import {
  useEffectsController,
} from "./controllers/EffectsController";

/*
 * Update a numeric value safely.
 *
 * postprocessing effects can expose values through:
 * 1. A direct property
 * 2. A uniforms Map
 * 3. A uniforms object
 */
function updateNumericEffectValue(
  effect,
  propertyName,
  value
) {
  if (
    !effect ||
    !Number.isFinite(value)
  ) {
    return;
  }

  try {
    if (
      propertyName in effect
    ) {
      effect[propertyName] =
        value;

      return;
    }
  } catch {
    /*
     * Some effect properties may be read-only.
     * Continue to the uniform fallbacks.
     */
  }

  const uniforms =
    effect.uniforms;

  if (
    uniforms instanceof Map
  ) {
    const uniform =
      uniforms.get(
        propertyName
      );

    if (
      uniform &&
      "value" in uniform
    ) {
      uniform.value =
        value;
    }

    return;
  }

  const uniform =
    uniforms?.[
      propertyName
    ];

  if (
    uniform &&
    "value" in uniform
  ) {
    uniform.value =
      value;
  }
}

/*
 * Noise opacity is usually held by:
 *
 * effect.blendMode.opacity.value
 */
function updateEffectOpacity(
  effect,
  opacity
) {
  if (
    !effect ||
    !Number.isFinite(opacity)
  ) {
    return;
  }

  const blendOpacity =
    effect.blendMode
      ?.opacity;

  if (
    blendOpacity &&
    "value" in blendOpacity
  ) {
    blendOpacity.value =
      opacity;

    return;
  }

  updateNumericEffectValue(
    effect,
    "opacity",
    opacity
  );
}

function updateBloomEffect(
  bloomEffect,
  effects
) {
  if (!bloomEffect) {
    return;
  }

  updateNumericEffectValue(
    bloomEffect,
    "intensity",
    effects.bloomIntensity
  );

  /*
   * Different postprocessing versions expose the
   * bloom luminance material in different locations.
   */
  const luminanceMaterial =
    bloomEffect
      .luminancePass
      ?.fullscreenMaterial ??
    bloomEffect
      .luminancePass
      ?.material ??
    bloomEffect
      .luminanceMaterial;

  if (!luminanceMaterial) {
    return;
  }

  updateNumericEffectValue(
    luminanceMaterial,
    "threshold",
    effects.bloomThreshold
  );

  updateNumericEffectValue(
    luminanceMaterial,
    "smoothing",
    effects.bloomSmoothing
  );
}

function updateColorGradingEffects(
  hueSaturationEffect,
  brightnessContrastEffect,
  effects
) {
  updateNumericEffectValue(
    hueSaturationEffect,
    "hue",
    effects.hue
  );

  updateNumericEffectValue(
    hueSaturationEffect,
    "saturation",
    effects.saturation
  );

  updateNumericEffectValue(
    brightnessContrastEffect,
    "brightness",
    effects.brightness
  );

  updateNumericEffectValue(
    brightnessContrastEffect,
    "contrast",
    effects.contrast
  );
}

function updateNoiseEffect(
  noiseEffect,
  effects
) {
  updateEffectOpacity(
    noiseEffect,
    effects.noiseOpacity
  );
}

function updateVignetteEffect(
  vignetteEffect,
  effects
) {
  updateNumericEffectValue(
    vignetteEffect,
    "offset",
    effects.vignetteOffset
  );

  updateNumericEffectValue(
    vignetteEffect,
    "darkness",
    effects.vignetteDarkness
  );
}

function updateChromaticEffect(
  chromaticEffect,
  effects
) {
  if (!chromaticEffect) {
    return;
  }

  const offsetX =
    Number.isFinite(
      effects.chromaticOffsetX
    )
      ? effects.chromaticOffsetX
      : 0;

  const offsetY =
    Number.isFinite(
      effects.chromaticOffsetY
    )
      ? effects.chromaticOffsetY
      : 0;

  /*
   * Preferred public/internal property.
   */
  if (
    chromaticEffect.offset &&
    typeof chromaticEffect
      .offset.set === "function"
  ) {
    chromaticEffect.offset.set(
      offsetX,
      offsetY
    );
  } else {
    /*
     * Uniform fallback.
     */
    const offsetUniform =
      chromaticEffect.uniforms
        instanceof Map
        ? chromaticEffect.uniforms.get(
            "offset"
          )
        : chromaticEffect
            .uniforms
            ?.offset;

    if (
      offsetUniform?.value &&
      typeof offsetUniform
        .value.set === "function"
    ) {
      offsetUniform.value.set(
        offsetX,
        offsetY
      );
    }
  }

  updateNumericEffectValue(
    chromaticEffect,
    "modulationOffset",
    effects.chromaticModulation
  );
}

function getExposureLimits(
  qualityLevel,
  isMobile
) {
  if (
    qualityLevel ===
    "reduced"
  ) {
    return {
      minimum: 0.88,
      maximum: 1,
    };
  }

  if (
    qualityLevel === "low"
  ) {
    return {
      minimum: 0.86,
      maximum: 1.02,
    };
  }

  if (isMobile) {
    return {
      minimum: 0.84,
      maximum: 1.04,
    };
  }

  return {
    minimum: 0.82,
    maximum: 1.1,
  };
}

function Effects({
  qualityLevel = "high",
  isMobile = false,
}) {
  /*
   * These refs are kept internally.
   *
   * Important:
   * Do not pass these ref objects directly into
   * @react-three/postprocessing components.
   *
   * React 19 + react-postprocessing 3.0.4 may try to
   * JSON.stringify the ref and crash because Three.js
   * objects contain circular parent/children references.
   */
  const bloomEffectRef =
    useRef(null);

  const hueSaturationEffectRef =
    useRef(null);

  const brightnessContrastEffectRef =
    useRef(null);

  const chromaticEffectRef =
    useRef(null);

  const noiseEffectRef =
    useRef(null);

  const vignetteEffectRef =
    useRef(null);

  const exposureRef =
    useRef(1);

  const originalRendererStateRef =
    useRef(null);

  const {
    gl,
  } = useThree();

  const {
    effectsStateRef,
  } =
    useEffectsController();

  /*
   * Callback refs are functions.
   *
   * JSON.stringify ignores functions, preventing the
   * circular-reference crash while still exposing the
   * effect instances to this component.
   */
  const setBloomEffect =
    useCallback(
      (effect) => {
        bloomEffectRef.current =
          effect;
      },
      []
    );

  const setHueSaturationEffect =
    useCallback(
      (effect) => {
        hueSaturationEffectRef.current =
          effect;
      },
      []
    );

  const setBrightnessContrastEffect =
    useCallback(
      (effect) => {
        brightnessContrastEffectRef.current =
          effect;
      },
      []
    );

  const setChromaticEffect =
    useCallback(
      (effect) => {
        chromaticEffectRef.current =
          effect;
      },
      []
    );

  const setNoiseEffect =
    useCallback(
      (effect) => {
        noiseEffectRef.current =
          effect;
      },
      []
    );

  const setVignetteEffect =
    useCallback(
      (effect) => {
        vignetteEffectRef.current =
          effect;
      },
      []
    );

  const isReduced =
    qualityLevel ===
    "reduced";

  const isLow =
    qualityLevel === "low";

  const isMedium =
    qualityLevel ===
    "medium";

  const exposureLimits =
    useMemo(
      () =>
        getExposureLimits(
          qualityLevel,
          isMobile
        ),
      [
        qualityLevel,
        isMobile,
      ]
    );

  const initialBloomIntensity =
    isReduced
      ? 0.28
      : isLow
        ? 0.32
        : isMedium
          ? 0.42
          : isMobile
            ? 0.48
            : 0.56;

  const initialBloomThreshold =
    isMobile
      ? 0.22
      : 0.18;

  const initialBloomSmoothing =
    isMobile
      ? 0.78
      : 0.9;

  const initialHue =
    -0.008;

  const initialSaturation =
    isMobile
      ? 0.07
      : 0.1;

  const initialBrightness =
    isMobile
      ? 0.005
      : 0.012;

  const initialContrast =
    isMobile
      ? 0.045
      : 0.065;

  const initialNoiseOpacity =
    isReduced
      ? 0
      : isMobile
        ? 0.006
        : 0.011;

  const initialVignetteOffset =
    isMobile
      ? 0.22
      : 0.18;

  const initialVignetteDarkness =
    isMobile
      ? 0.68
      : 0.76;

  const enableColorGrading =
    !isReduced;

  const enableNoise =
    !isReduced &&
    initialNoiseOpacity > 0;

  const enableChromaticAberration =
    !isMobile &&
    !isReduced &&
    !isLow;

  /*
   * A stable Vector2 prevents needless allocations.
   * It contains no scene parent/children relationship.
   */
  const initialChromaticOffset =
    useMemo(
      () =>
        new Vector2(
          0.00018,
          0.0001
        ),
      []
    );

  /*
   * Configure renderer tone mapping once and restore
   * the previous renderer state when unmounted.
   */
  useEffect(() => {
    originalRendererStateRef.current = {
      toneMapping:
        gl.toneMapping,

      toneMappingExposure:
        gl.toneMappingExposure,
    };

    gl.toneMapping =
      ACESFilmicToneMapping;

    exposureRef.current =
      MathUtils.clamp(
        Number.isFinite(
          gl.toneMappingExposure
        )
          ? gl.toneMappingExposure
          : 1,
        exposureLimits.minimum,
        exposureLimits.maximum
      );

    gl.toneMappingExposure =
      exposureRef.current;

    return () => {
      const originalState =
        originalRendererStateRef.current;

      if (!originalState) {
        return;
      }

      gl.toneMapping =
        originalState.toneMapping;

      gl.toneMappingExposure =
        originalState
          .toneMappingExposure;
    };
  }, [
    gl,
    exposureLimits.minimum,
    exposureLimits.maximum,
  ]);

  useFrame(
    (_, delta) => {
      const effects =
        effectsStateRef.current;

      if (!effects) {
        return;
      }

      const safeDelta =
        Math.min(
          Math.max(delta, 0),
          0.05
        );

      const targetExposure =
        MathUtils.clamp(
          Number.isFinite(
            effects.exposure
          )
            ? effects.exposure
            : 1,
          exposureLimits.minimum,
          exposureLimits.maximum
        );

      const exposureAlpha =
        1 -
        Math.exp(
          -safeDelta * 4.8
        );

      exposureRef.current =
        MathUtils.lerp(
          exposureRef.current,
          targetExposure,
          exposureAlpha
        );

      gl.toneMappingExposure =
        exposureRef.current;

      updateBloomEffect(
        bloomEffectRef.current,
        effects
      );

      if (
        enableColorGrading
      ) {
        updateColorGradingEffects(
          hueSaturationEffectRef.current,
          brightnessContrastEffectRef.current,
          effects
        );
      }

      if (enableNoise) {
        updateNoiseEffect(
          noiseEffectRef.current,
          effects
        );
      }

      updateVignetteEffect(
        vignetteEffectRef.current,
        effects
      );

      if (
        enableChromaticAberration
      ) {
        updateChromaticEffect(
          chromaticEffectRef.current,
          effects
        );
      }
    }
  );

  return (
    <EffectComposer
      multisampling={
        isMobile || isLow
          ? 0
          : 4
      }
      enableNormalPass={
        false
      }
    >
      <Bloom
        ref={setBloomEffect}
        intensity={
          initialBloomIntensity
        }
        luminanceThreshold={
          initialBloomThreshold
        }
        luminanceSmoothing={
          initialBloomSmoothing
        }
        mipmapBlur
      />

      {enableColorGrading && (
        <HueSaturation
          ref={
            setHueSaturationEffect
          }
          blendFunction={
            BlendFunction.NORMAL
          }
          hue={initialHue}
          saturation={
            initialSaturation
          }
        />
      )}

      {enableColorGrading && (
        <BrightnessContrast
          ref={
            setBrightnessContrastEffect
          }
          blendFunction={
            BlendFunction.NORMAL
          }
          brightness={
            initialBrightness
          }
          contrast={
            initialContrast
          }
        />
      )}

      {enableChromaticAberration && (
        <ChromaticAberration
          ref={
            setChromaticEffect
          }
          blendFunction={
            BlendFunction.NORMAL
          }
          offset={
            initialChromaticOffset
          }
          radialModulation
          modulationOffset={
            0.72
          }
        />
      )}

      {enableNoise && (
        <Noise
          ref={setNoiseEffect}
          blendFunction={
            BlendFunction.SOFT_LIGHT
          }
          opacity={
            initialNoiseOpacity
          }
          premultiply
        />
      )}

      <Vignette
        ref={
          setVignetteEffect
        }
        eskil={false}
        offset={
          initialVignetteOffset
        }
        darkness={
          initialVignetteDarkness
        }
      />
    </EffectComposer>
  );
}

export default Effects;
