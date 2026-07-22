import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

function CameraController() {
  const t = useRef(0);

  useFrame((state, delta) => {
    t.current += delta * 0.15;

    const camera = state.camera;

    // Cinematic slow camera drift
    camera.position.x = Math.sin(t.current) * 0.35;
    camera.position.y = Math.cos(t.current * 0.8) * 0.18;
    camera.position.z = 5 + Math.sin(t.current * 0.5) * 0.15;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default CameraController;
