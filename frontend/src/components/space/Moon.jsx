import { useTexture } from "@react-three/drei";
import moonImage from "../../assets/images/moon.jpg";

function Moon() {
  const moonTexture = useTexture(moonImage);

  return (
    <mesh position={[-3.5, 1.8, -8]} scale={1.2}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={moonTexture}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export default Moon;
