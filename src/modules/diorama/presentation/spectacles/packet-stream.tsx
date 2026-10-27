/**
 * Packet stream: a storm of glowing packets races across the island, arcing up as it passes
 * over the affected zone.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import { type InstancedMesh, Object3D } from 'three';

import { clamp01, nowSec } from '../motion';
import { type SpectacleProps, hash01 } from './spectacle-kit';

const PACKET_COUNT = 90;

export function PacketStream(props: SpectacleProps): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const lanes = useMemo(
    () =>
      Array.from({ length: PACKET_COUNT }, (_, index) => {
        const area = props.areas[index % Math.max(1, props.areas.length)];
        return {
          z: (area?.center[2] ?? 0) + (hash01(index * 7 + 1) - 0.5) * (area?.size[1] ?? 8) * 0.9,
          y: (area?.center[1] ?? 0) + 0.5 + hash01(index * 7 + 2) * 1.6,
          centerX: area?.center[0] ?? 0,
          delay: hash01(index * 7 + 3) * 2,
          speed: 8 + hash01(index * 7 + 4) * 6,
        };
      }),
    [props.areas],
  );
  const span = props.islandWidth + 10;

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    lanes.forEach((lane, index) => {
      const local = elapsed - lane.delay;
      const x = -span / 2 + local * lane.speed;
      // Packets arc upward as they pass over the target zone
      const over = clamp01(1 - Math.abs(x - lane.centerX) / 3);
      const visible = local > 0 && x < span / 2;
      dummy.position.set(x, lane.y + over * 0.8, lane.z);
      dummy.scale.set(visible ? 1.8 : 0, visible ? 0.5 : 0, visible ? 0.5 : 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PACKET_COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      <meshStandardMaterial color={props.colors.accent} emissive={props.colors.main} emissiveIntensity={1.6} toneMapped={false} />
    </instancedMesh>
  );
}
