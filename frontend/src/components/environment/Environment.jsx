import BackgroundGradient from "./BackgroundGradient";
import NebulaClouds from "./NebulaClouds";
import StarField from "./StarField";
import Aurora from "./Aurora";
import Fog from "./Fog";

function Environment() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <BackgroundGradient />
      <NebulaClouds />
      <StarField />
      <Aurora />
      <Fog />

      {/* Final darkness control */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,2,4,0.28)_65%,rgba(2,2,4,0.78)_100%)]" />
    </div>
  );
}

export default Environment;
