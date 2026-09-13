import * as THREE from "three";

export type ModelFit = {
  /** Uniform scale that brings the model to the requested world height. */
  scale: number;
  /**
   * Offset applied *after* scaling so the model's feet rest on y=0 and it is
   * centred on x/z, regardless of where the exporter put its origin.
   */
  offset: THREE.Vector3;
  /** Y rotation (radians) that brings the figure's broad side to face camera. */
  yaw: number;
  /** Raw measured size, in the model's own units — useful for logging/diagnosis. */
  size: THREE.Vector3;
};

/**
 * Derives presentation transforms from a model's *actual* bounding box rather
 * than hard-coded guesses, so an externally generated asset can be dropped in
 * without hand-tuning magic numbers: exporters disagree wildly about units
 * (metres vs centimetres vs arbitrary), about origin (feet, hips, or scene
 * centre) and about which way "forward" points.
 *
 * Orientation note — `yaw` is a *heuristic*, and a deliberately conservative
 * one. A standing human is reliably wider (shoulder to shoulder) than deep
 * (chest to back), so a bounding box whose Z extent clearly exceeds its X
 * extent suggests the figure was exported facing along X and needs a quarter
 * turn. That is a reasonable inference from geometry alone, but it is still an
 * inference: it cannot distinguish front from back, and a couple posed
 * side-by-side widens X further (making a false positive unlikely, a false
 * negative possible). `ORIENTATION_OVERRIDE` in CoupleModel.tsx exists so this
 * can be corrected in one line once a real file is on disk and can be looked
 * at — which is the only way to actually confirm it.
 */
export function fitModelToHeight(
  object: THREE.Object3D,
  targetHeight: number
): ModelFit {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // A degenerate/empty box (no renderable meshes) must not produce Infinity.
  const scale = size.y > 1e-6 ? targetHeight / size.y : 1;

  const offset = new THREE.Vector3(
    -center.x * scale,
    -box.min.y * scale,
    -center.z * scale
  );

  const yaw = size.z > size.x * 1.25 ? Math.PI / 2 : 0;

  return { scale, offset, yaw, size };
}
