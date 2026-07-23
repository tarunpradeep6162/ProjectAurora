import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function CameraRig({ motionEnabled = true }) {
  const { camera } = useThree();

  const pointerTarget = useRef({
    x: 0,
    y: 0,
  });

  const smoothPointer = useRef(
    new THREE.Vector2(0, 0)
  );

  useEffect(() => {
    if (!motionEnabled) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      pointerTarget.current.x =
        (event.clientX / window.innerWidth - 0.5) * 2;

      pointerTarget.current.y =
        (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, [motionEnabled]);

  useFrame((state, delta) => {
    if (!motionEnabled) {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.lookAt(0, 0, 0);

      return;
    }

    const interpolation =
      1 - Math.pow(0.001, delta);

    smoothPointer.current.x = THREE.MathUtils.lerp(
      smoothPointer.current.x,
      pointerTarget.current.x,
      interpolation
    );

    smoothPointer.current.y = THREE.MathUtils.lerp(
      smoothPointer.current.y,
      pointerTarget.current.y,
      interpolation
    );

    const time = state.clock.elapsedTime;

    const driftX = Math.sin(time * 0.075) * 0.07;
    const driftY = Math.cos(time * 0.06) * 0.05;

    camera.position.x =
      smoothPointer.current.x * 0.16 + driftX;

    camera.position.y =
      smoothPointer.current.y * -0.1 + driftY;

    camera.position.z = 6;

    camera.lookAt(
      smoothPointer.current.x * 0.035,
      smoothPointer.current.y * -0.025,
      0
    );
  });

  return null;
}

export default CameraRig;
