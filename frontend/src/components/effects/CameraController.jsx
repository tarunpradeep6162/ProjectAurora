import { useFrame, useThree } from "@react-three/fiber";

function CameraController() {
  const { camera, mouse } = useThree();

  useFrame(() => {
    camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.05;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default CameraController;
