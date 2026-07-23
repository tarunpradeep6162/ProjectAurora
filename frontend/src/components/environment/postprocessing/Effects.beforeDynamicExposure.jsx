import { useFrame } from "@react-three/fiber";
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
  useMemo,
  useRef,
} from "react";
import {
  BlendFunction,
} from "postprocessing";
import {
  Vector2,
} from "three";
import {
  useEffectsController,
} from "./controllers/EffectsController";

/*
 * Safely updates a numeric property on a post-processing effect.
 *
 * Different postprocessing versions expose values in different ways:
 *
 * 1. Direct effect properties
 * 2. Effect uniforms Map
 * 3. Effect uniforms object
 *
 * This helper supports all three structures.
 */
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
     * Ignore read-only or unsupported direct properties.
     * The uniform fallbacks below may still work.
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

  if (
    uniforms &&
    uniforms[propertyName] &&
    "value" in
      uniforms[propertyName]
  ) {
    uniforms[
      propertyName
    ].value = value;
  }
}

/*
 * NoiseEffect generally stores opacity inside its blend mode rather
 * than exposing a direct "opacity" field.
 */
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

  /*
   * Bloom luminance properties differ slightly between versions.
   * Check all known locations without assuming one internal shape.
   */
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
    /*
     * Fallback for versions exposing the offset through uniforms.
     */
    const offsetUniform =
      chromaticEffect.uniforms
        instanceof Map
        ? chromaticEffect.uniforms.get(
            "offset"
          )
        : chromaticEffect.uniforms
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

  /*
   * Initial values are used during the first render.
   * Runtime values are then supplied by EffectsController.
   */
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
   * Reuse one Vector2 instance.
   * Creating Vector2 directly inside JSX would allocate a new object
   * whenever the component renders.
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

  useFrame(() => {
    const effects =
      effectsStateRef.current;

    if (!effects) {
      return;
    }

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
  });

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
          hue={
            initialHue
          }
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
          ref={
            chromaticRef
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
