/**
 * Camera rig that frames the island (and the enemy beside it) at any aspect ratio. When the
 * board fills the screen behind a HUD, it fits everything into the space the HUD leaves free
 * and shifts the view so the board sits in the middle of that space.
 */

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type JSX, useEffect } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';

import type { Vec3 } from '../domain/board-layout';
import { type CameraFrame, type ViewInsets, computeCameraFit } from '../domain/camera-fit';

/** Looking down at about 59°: high enough to read the whole diagram, still tilted enough to feel 3D. */
const CAMERA_DIRECTION: Vec3 = (() => {
  const v = new Vector3(0, 1, 0.6).normalize();
  return [v.x, v.y, v.z] as const;
})();

export function FittedCameraRig(props: {
  readonly frame: CameraFrame;
  readonly insets: ViewInsets | undefined;
}): JSX.Element {
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.size);
  const controls = useThree((state) => state.controls) as unknown as { update: () => void } | null;
  const { frame, insets } = props;

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const fit = computeCameraFit({
      points: frame.points,
      centrePoints: frame.centrePoints,
      focus: frame.focus,
      direction: CAMERA_DIRECTION,
      fovDeg: camera.fov,
      viewport,
      insets,
    });

    // Place the camera, then shift the image onto the free area
    const focus = new Vector3(...frame.focus);
    camera.position.set(...CAMERA_DIRECTION).multiplyScalar(fit.distance).add(focus);
    camera.lookAt(focus);
    camera.setViewOffset(viewport.width, viewport.height, fit.offset[0], fit.offset[1], viewport.width, viewport.height);
    camera.updateProjectionMatrix();
    controls?.update();
  }, [camera, controls, viewport, frame, insets]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      minPolarAngle={0.3}
      maxPolarAngle={1.1}
      minAzimuthAngle={-0.7}
      maxAzimuthAngle={0.7}
      target={[...frame.focus]}
    />
  );
}
