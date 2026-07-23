import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Nebula({
  motionEnabled = true,
  qualityLevel = "high",
}) {
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,

      uniforms: {
        uTime: { value: 0 },
      },

      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
        }

        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash(i);
          float b = hash(i + vec2(1.0,0.0));
          float c = hash(i + vec2(0.0,1.0));
          float d = hash(i + vec2(1.0,1.0));

          vec2 u = f*f*(3.0-2.0*f);

          return mix(a,b,u.x)
               + (c-a)*u.y*(1.0-u.x)
               + (d-b)*u.x*u.y;
        }

        float fbm(vec2 p){
          float v = 0.0;
          float a = 0.5;

          for(int i=0;i<5;i++){
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }

          return v;
        }

        void main(){

          vec2 uv = vUv - 0.5;
          uv.x *= 1.5;

          float n = fbm(
            uv * 3.0 +
            vec2(uTime * 0.02, uTime * 0.01)
          );

          vec3 c1 = vec3(0.03,0.02,0.10);
          vec3 c2 = vec3(0.15,0.05,0.35);
          vec3 c3 = vec3(0.60,0.18,0.85);

          vec3 color = mix(c1, c2, n);
          color = mix(color, c3, pow(n,2.0));

          float alpha = smoothstep(0.15,0.9,n) * 0.35;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, []);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;

    if (motionEnabled && meshRef.current) {
      meshRef.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.05) * 0.02;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -15]}
      scale={25}
      frustumCulled={false}
      renderOrder={-10}
    >
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default Nebula;
