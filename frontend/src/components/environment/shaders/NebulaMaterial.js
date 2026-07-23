import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;

    gl_Position = projectionMatrix *
      modelViewMatrix *
      vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(
      sin(dot(point, vec2(127.1, 311.7))) *
      43758.5453123
    );
  }

  float noise(vec2 point) {
    vec2 integerPoint = floor(point);
    vec2 fractionalPoint = fract(point);

    fractionalPoint =
      fractionalPoint *
      fractionalPoint *
      (3.0 - 2.0 * fractionalPoint);

    float a = hash(integerPoint);
    float b = hash(integerPoint + vec2(1.0, 0.0));
    float c = hash(integerPoint + vec2(0.0, 1.0));
    float d = hash(integerPoint + vec2(1.0, 1.0));

    return mix(
      mix(a, b, fractionalPoint.x),
      mix(c, d, fractionalPoint.x),
      fractionalPoint.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;

    mat2 rotation = mat2(
      0.8, -0.6,
      0.6,  0.8
    );

    for (int index = 0; index < 5; index++) {
      value += amplitude * noise(point);

      point = rotation * point * 2.02;
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = vUv;

    vec2 centeredUv = uv - 0.5;

    float aspect =
      uResolution.x /
      max(uResolution.y, 1.0);

    centeredUv.x *= aspect;

    float time = uTime * 0.025;

    vec2 flowA = vec2(
      time,
      -time * 0.55
    );

    vec2 flowB = vec2(
      -time * 0.42,
      time * 0.7
    );

    float largeCloud =
      fbm(centeredUv * 2.2 + flowA);

    float mediumCloud =
      fbm(centeredUv * 4.1 + flowB);

    float fineCloud =
      fbm(
        centeredUv * 7.5 +
        vec2(time * 0.25, time * 0.15)
      );

    float cloud =
      largeCloud * 0.56 +
      mediumCloud * 0.3 +
      fineCloud * 0.14;

    float centralMask =
      smoothstep(
        1.15,
        0.05,
        length(centeredUv * vec2(0.8, 1.2))
      );

    float leftMask =
      smoothstep(
        0.9,
        0.05,
        length(
          centeredUv -
          vec2(-0.42, 0.1)
        )
      );

    float rightMask =
      smoothstep(
        0.85,
        0.05,
        length(
          centeredUv -
          vec2(0.48, -0.16)
        )
      );

    float nebulaMask =
      centralMask * 0.55 +
      leftMask * 0.34 +
      rightMask * 0.24;

    float density =
      smoothstep(
        0.36,
        0.82,
        cloud
      ) * nebulaMask;

    vec3 deepViolet = vec3(
      0.08,
      0.035,
      0.13
    );

    vec3 mutedRose = vec3(
      0.17,
      0.055,
      0.085
    );

    vec3 coldBlue = vec3(
      0.035,
      0.07,
      0.14
    );

    vec3 nebulaColor =
      mix(
        deepViolet,
        mutedRose,
        mediumCloud
      );

    nebulaColor =
      mix(
        nebulaColor,
        coldBlue,
        fineCloud * 0.48
      );

    float coreGlow =
      pow(
        max(centralMask, 0.0),
        3.0
      ) * 0.15;

    nebulaColor += vec3(
      0.12,
      0.065,
      0.14
    ) * coreGlow;

    float alpha =
      density *
      uIntensity;

    gl_FragColor = vec4(
      nebulaColor,
      alpha
    );
  }
`;

export function createNebulaMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,

    transparent: true,
    depthWrite: false,
    depthTest: false,

    blending: THREE.AdditiveBlending,

    uniforms: {
      uTime: {
        value: 0,
      },

      uResolution: {
        value: new THREE.Vector2(1, 1),
      },

      uIntensity: {
        value: 0.85,
      },
    },
  });
}
