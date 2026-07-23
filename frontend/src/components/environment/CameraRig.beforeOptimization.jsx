import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(
  0,
  0,
  6
);

const DEFAULT_LOOK_TARGET = new THREE.Vector3(
  0,
  0,
  0
);

function clampPointer(value) {
  return THREE.MathUtils.clamp(
    value,
    -1,
    1
  );
}

function CameraRig({
  motionEnabled = true,
  qualityLevel = "high",
}) {
  const camera = useThree(
    (state) => state.camera
  );

  const pointerTarget = useRef(
    new THREE.Vector2(0, 0)
  );

  const pointerCurrent = useRef(
    new THREE.Vector2(0, 0)
  );

  const pointerVelocity = useRef(
    new THREE.Vector2(0, 0)
  );

  const cameraTarget = useRef(
    DEFAULT_CAMERA_POSITION.clone()
  );

  const lookTarget = useRef(
    DEFAULT_LOOK_TARGET.clone()
  );

  const isTouchDevice = useRef(false);
  const isPointerActive = useRef(false);

  useEffect(() => {
    isTouchDevice.current =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches;
  }, []);

  useEffect(() => {
    if (!motionEnabled) {
      pointerTarget.current.set(0, 0);
      pointerCurrent.current.set(0, 0);
      pointerVelocity.current.set(0, 0);

      return undefined;
    }

    const updatePointer = (
      clientX,
      clientY
    ) => {
      const normalizedX =
        (
          clientX /
          window.innerWidth
        ) *
          2 -
        1;

      const normalizedY =
        (
          clientY /
          window.innerHeight
        ) *
          2 -
        1;

      pointerTarget.current.set(
        clampPointer(normalizedX),
        clampPointer(normalizedY)
      );
    };

    const handlePointerMove = (event) => {
      if (isTouchDevice.current) {
        return;
      }

      isPointerActive.current = true;

      updatePointer(
        event.clientX,
        event.clientY
      );
    };

    const handlePointerLeave = () => {
      isPointerActive.current = false;

      pointerTarget.current.set(
        0,
        0
      );
    };

    const handleTouchStart = (event) => {
      const touch =
        event.touches?.[0];

      if (!touch) {
        return;
      }

      isPointerActive.current = true;

      updatePointer(
        touch.clientX,
        touch.clientY
      );
    };

    const handleTouchMove = (event) => {
      const touch =
        event.touches?.[0];

      if (!touch) {
        return;
      }

      updatePointer(
        touch.clientX,
        touch.clientY
      );
    };

    const handleTouchEnd = () => {
      isPointerActive.current = false;

      pointerTarget.current.set(
        0,
        0
      );
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    document.documentElement.addEventListener(
      "mouseleave",
      handlePointerLeave
    );

    window.addEventListener(
      "touchstart",
      handleTouchStart,
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      handleTouchMove,
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      handleTouchEnd,
      { passive: true }
    );

    window.addEventListener(
      "touchcancel",
      handleTouchEnd,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      document.documentElement.removeEventListener(
        "mouseleave",
        handlePointerLeave
      );

      window.removeEventListener(
        "touchstart",
        handleTouchStart
      );

      window.removeEventListener(
        "touchmove",
        handleTouchMove
      );

      window.removeEventListener(
        "touchend",
        handleTouchEnd
      );

      window.removeEventListener(
        "touchcancel",
        handleTouchEnd
      );
    };
  }, [motionEnabled]);

  useFrame((state, delta) => {
    const safeDelta = Math.min(
      delta,
      0.05
    );

    if (!motionEnabled) {
      const resetDamping =
        1 -
        Math.exp(
          -safeDelta * 5
        );

      camera.position.lerp(
        DEFAULT_CAMERA_POSITION,
        resetDamping
      );

      lookTarget.current.lerp(
        DEFAULT_LOOK_TARGET,
        resetDamping
      );

      camera.lookAt(
        lookTarget.current
      );

      return;
    }

    const time =
      state.clock.elapsedTime;

    const qualityMultiplier =
      qualityLevel === "low"
        ? 0.72
        : qualityLevel === "medium"
          ? 0.86
          : 1;

    const touchMultiplier =
      isTouchDevice.current
        ? 0.72
        : 1;

    const pointerStrength =
      qualityMultiplier *
      touchMultiplier;

    const springStrength =
      isPointerActive.current
        ? 7.5
        : 4.5;

    const dampingStrength = 6.8;

    const displacementX =
      pointerTarget.current.x -
      pointerCurrent.current.x;

    const displacementY =
      pointerTarget.current.y -
      pointerCurrent.current.y;

    pointerVelocity.current.x +=
      displacementX *
      springStrength *
      safeDelta;

    pointerVelocity.current.y +=
      displacementY *
      springStrength *
      safeDelta;

    const velocityDamping =
      Math.exp(
        -dampingStrength *
        safeDelta
      );

    pointerVelocity.current.multiplyScalar(
      velocityDamping
    );

    pointerCurrent.current.x +=
      pointerVelocity.current.x;

    pointerCurrent.current.y +=
      pointerVelocity.current.y;

    pointerCurrent.current.x =
      clampPointer(
        pointerCurrent.current.x
      );

    pointerCurrent.current.y =
      clampPointer(
        pointerCurrent.current.y
      );

    const driftX =
      Math.sin(
        time * 0.072
      ) * 0.055;

    const driftY =
      Math.cos(
        time * 0.061
      ) * 0.038;

    const secondaryDriftX =
      Math.sin(
        time * 0.019 + 1.7
      ) * 0.025;

    const secondaryDriftY =
      Math.cos(
        time * 0.024 + 0.8
      ) * 0.018;

    const breathing =
      Math.sin(
        time * 0.115
      ) * 0.025;

    const depthDrift =
      Math.sin(
        time * 0.035
      ) * 0.035;

    const pointerX =
      pointerCurrent.current.x;

    const pointerY =
      pointerCurrent.current.y;

    cameraTarget.current.set(
      pointerX *
        0.19 *
        pointerStrength +
        driftX +
        secondaryDriftX,

      pointerY *
        -0.115 *
        pointerStrength +
        driftY +
        secondaryDriftY,

      6 +
        breathing +
        depthDrift
    );

    const cameraDamping =
      1 -
      Math.exp(
        -safeDelta * 3.8
      );

    camera.position.lerp(
      cameraTarget.current,
      cameraDamping
    );

    const desiredLookX =
      pointerX *
      0.045 *
      pointerStrength;

    const desiredLookY =
      pointerY *
      -0.03 *
      pointerStrength;

    const desiredLookZ =
      Math.sin(
        time * 0.028
      ) * 0.018;

    const desiredLookTarget =
      new THREE.Vector3(
        desiredLookX,
        desiredLookY,
        desiredLookZ
      );

    const lookDamping =
      1 -
      Math.exp(
        -safeDelta * 3.2
      );

    lookTarget.current.lerp(
      desiredLookTarget,
      lookDamping
    );

    camera.lookAt(
      lookTarget.current
    );
  });

  return null;
}

export default CameraRig;
