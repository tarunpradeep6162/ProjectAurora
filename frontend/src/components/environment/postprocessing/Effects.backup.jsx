import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        mipmapBlur
      />

      <Noise
        opacity={0.015}
      />

      <Vignette
        eskil={false}
        offset={0.15}
        darkness={0.9}
      />
    </EffectComposer>
  );
}

export default Effects;
