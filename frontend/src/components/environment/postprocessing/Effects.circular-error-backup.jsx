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

function updateNumericEffectValue(
  effect,
  propertyName,
  value
) {
  if (!effect) {
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
     * Some post-processing values can be read-only.
     * Uniform-based fallbacks are checked below.
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

function updateEffectOpacity(
  effect,
  opacity
) {
  if (!effect) {
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

  const luminanceMaterial =
    bloomEffect
      .luminancePass
      ?.fullscreenMaterial ??
    bloomEffect
      .luminanceMaterial ??
    bloomEffect
      .luminancePass
      ?.material;

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

  const offset =
    chromaticEffect.offset;

  if (
    offset &&
    typeof offset.set ===
      "function"
  ) {
    offset.set(
      effects.chromaticOffsetX,
      effects.chromaticOffsetY
    );
  } else {
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
        .value.set ===
        "function"
    ) {
      offsetUniform.value.set(
        effects.chromaticOffsetX,
        effects.chromaticOffsetY
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
  const bloomRef =
    useRef(null);

  const hueSaturationRef =
    useRef(null);

  const brightnessContrastRef =
    useRef(null);

  const chromaticRef =
    useRef(null);

  const noiseRef =
    useRef(null);

  const vignetteRef =
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

  const initialChromaticOffset =
    useMemo(
      () =>
        new Vector2(
          0.00018,
          0.0001
        ),
      []
    );

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
        gl.toneMappingExposure ||
          1,
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
    exposureLimits,
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
          delta,
          0.05
        );

      const exposureDamping =
        1 -
        Math.exp(
          -safeDelta * 4.8
        );

      const targetExposure =
        MathUtils.clamp(
          effects.exposure,
          exposureLimits.minimum,
          exposureLimits.maximum
        );

      exposureRef.current =
        MathUtils.lerp(
          exposureRef.current,
          targetExposure,
          exposureDamping
        );

      gl.toneMappingExposure =
        exposureRef.current;

      updateBloomEffect(
        bloomRef.current,
        effects
      );

      if (
        enableColorGrading
      ) {
        updateColorGradingEffects(
          hueSaturationRef.current,
          brightnessContrastRef.current,
          effects
        );
      }

      if (enableNoise) {
        updateNoiseEffect(
          noiseRef.current,
          effects
        );
      }

      updateVignetteEffect(
        vignetteRef.current,
        effects
      );

      if (
        enableChromaticAberration
      ) {
        updateChromaticEffect(
          chromaticRef.current,
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
      enableNormalPass={false}
    >
      <Bloom
        ref={bloomRef}
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
            hueSaturationRef
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
            brightnessContrastRef
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
          ref={chromaticRef}
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
          ref={noiseRef}
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
        ref={vignetteRef}
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
