import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback } from "react";

function AdaptiveQuality({
  maximumDpr = 1.5,
  minimumDpr = 0.75,
}) {
  const setDpr = useThree((state) => state.setDpr);

  const handleIncline = useCallback(() => {
    setDpr(maximumDpr);
  }, [maximumDpr, setDpr]);

  const handleDecline = useCallback(() => {
    setDpr(minimumDpr);
  }, [minimumDpr, setDpr]);

  return (
    <PerformanceMonitor
      flipflops={3}
      onIncline={handleIncline}
      onDecline={handleDecline}
    />
  );
}

export default AdaptiveQuality;
