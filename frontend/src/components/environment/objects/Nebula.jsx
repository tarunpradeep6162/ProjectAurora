function Nebula() {
  return (
    <mesh
      position={[0, 0, 0]}
      frustumCulled={false}
      renderOrder={999}
    >
      <planeGeometry args={[8, 5]} />

      <meshBasicMaterial
        color="#ff0000"
        wireframe
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default Nebula;
