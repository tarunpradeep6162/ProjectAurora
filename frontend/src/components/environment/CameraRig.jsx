import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  useEffect,
  useRef,
} from "react";

import * as THREE from "three";

const DEFAULT_CAMERA_POSITION =
  new THREE.Vector3(
    0,
    0,
    6
  );

const DEFAULT_LOOK_TARGET =
  new THREE.Vector3(
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

function clampMultiplier(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return THREE.MathUtils.clamp(
    value,
    0,
    1
  );
}

function CameraRig({
  enabled = true,
  motionEnabled = true,
  qualityLevel = "high",
  motionMultiplier = 1,
}) {
  const camera =
    useThree(
      (state) =>
        state.camera
    );

  const pointerTarget =
    useRef(
      new THREE.Vector2(
        0,
        0
      )
    );

  const pointerCurrent =
    useRef(
      new THREE.Vector2(
        0,
        0
      )
    );

  const pointerVelocity =
    useRef(
      new THREE.Vector2(
        0,
        0
      )
    );

  const cameraTarget =
    useRef(
      DEFAULT_CAMERA_POSITION.clone()
    );

  const lookTarget =
    useRef(
      DEFAULT_LOOK_TARGET.clone()
    );

  /*
   * Reused vector.
   *
   * This prevents creating a new THREE.Vector3
   * during every animation frame.
   */
  const desiredLookTarget =
    useRef(
      new THREE.Vector3(
        0,
        0,
        0
      )
    );

  const isTouchDevice =
    useRef(false);

  const isPointerActive =
    useRef(false);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    isTouchDevice.current =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches;
  }, []);

  useEffect(() => {
    const cameraMotionEnabled =
      enabled &&
      motionEnabled &&
      motionMultiplier > 0;

    if (!cameraMotionEnabled) {
      pointerTarget.current.set(
        0,
        0
      );

      pointerCurrent.current.set(
        0,
        0
      );

      pointerVelocity.current.set(
        0,
        0
      );

      isPointerActive.current =
        false;

      return undefined;
    }

    const updatePointer = (
      clientX,
      clientY
    ) => {
      const width =
        Math.max(
          window.innerWidth,
          1
        );

      const height =
        Math.max(
          window.innerHeight,
          1
        );

      const normalizedX =
        (clientX / width) *
          2 -
        1;

      const normalizedY =
        (clientY / height) *
          2 -
        1;

      pointerTarget.current.set(
        clampPointer(
          normalizedX
        ),

        clampPointer(
          normalizedY
        )
      );
    };

    const handlePointerMove = (
      event
    ) => {
      if (
        isTouchDevice.current
      ) {
        return;
      }

      isPointerActive.current =
        true;

      updatePointer(
        event.clientX,
        event.clientY
      );
    };

    const handlePointerLeave =
      () => {
        isPointerActive.current =
          false;

        pointerTarget.current.set(
          0,
          0
        );
      };

    const handleTouchStart = (
      event
    ) => {
      const touch =
        event.touches?.[0];

      if (!touch) {
        return;
      }

      isPointerActive.current =
        true;

      updatePointer(
        touch.clientX,
        touch.clientY
      );
    };

    const handleTouchMove = (
      event
    ) => {
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

    const handleTouchEnd =
      () => {
        isPointerActive.current =
          false;

        pointerTarget.current.set(
          0,
          0
        );
      };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        passive: true,
      }
    );

    document.documentElement.addEventListener(
      "mouseleave",
      handlePointerLeave
    );

    window.addEventListener(
      "touchstart",
      handleTouchStart,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "touchmove",
      handleTouchMove,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "touchend",
      handleTouchEnd,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "touchcancel",
      handleTouchEnd,
      {
        passive: true,
      }
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
  }, [
    enabled,
    motionEnabled,
    motionMultiplier,
  ]);

  useFrame(
    (
      state,
      delta
    ) => {
      const safeDelta =
        Math.min(
          Number.isFinite(delta)
            ? delta
            : 1 / 60,
          0.05
        );

      const normalizedMotionMultiplier =
        clampMultiplier(
          motionMultiplier
        );

      const cameraMotionEnabled =
        enabled &&
        motionEnabled &&
        normalizedMotionMultiplier >
          0;

      if (
        !cameraMotionEnabled
      ) {
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

      /*
       * R3F still currently exposes state.clock.
       * The THREE.Clock deprecation warning is from
       * the dependency stack, not from this component.
       */
      const time =
        state.clock.elapsedTime;

      const qualityMultiplier =
        qualityLevel ===
        "reduced"
          ? 0
          : qualityLevel ===
              "low"
            ? 0.72
            : qualityLevel ===
                "medium"
              ? 0.86
              : 1;

      const touchMultiplier =
        isTouchDevice.current
          ? 0.72
          : 1;

      const pointerStrength =
        qualityMultiplier *
        touchMultiplier *
        normalizedMotionMultiplier;

      const springStrength =
        isPointerActive.current
          ? 7.5
          : 4.5;

      const dampingStrength =
        6.8;

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
        ) *
        0.055 *
        normalizedMotionMultiplier;

      const driftY =
        Math.cos(
          time * 0.061
        ) *
        0.038 *
        normalizedMotionMultiplier;

      const secondaryDriftX =
        Math.sin(
          time * 0.019 +
            1.7
        ) *
        0.025 *
        normalizedMotionMultiplier;

      const secondaryDriftY =
        Math.cos(
          time * 0.024 +
            0.8
        ) *
        0.018 *
        normalizedMotionMultiplier;

      const breathing =
        Math.sin(
          time * 0.115
        ) *
        0.025 *
        normalizedMotionMultiplier;

      const depthDrift =
        Math.sin(
          time * 0.035
        ) *
        0.035 *
        normalizedMotionMultiplier;

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
        ) *
        0.018 *
        normalizedMotionMultiplier;

      desiredLookTarget.current.set(
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
        desiredLookTarget.current,
        lookDamping
      );

      camera.lookAt(
        lookTarget.current
      );
    }
  );

  return null;
}

export default CameraRig;
