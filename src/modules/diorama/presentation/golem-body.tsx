/**
 * Platform track boss: the YAML Golem, a lumbering stack of config slabs with a glowing visor and
 * two heavy block fists that sway as it waits for its next hand-edit.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useRef } from 'react';
import type { Group, MeshStandardMaterial } from 'three';

import type { TrackTheme } from '../domain/track-theme';

export interface GolemBodyProps {
  readonly theme: TrackTheme;
  readonly glowRef: RefObject<MeshStandardMaterial | null>;
}

/** Torso slabs from the hips up: [width, height, depth, y]. */
const SLABS: readonly (readonly [number, number, number, number])[] = [
  [1.0, 0.45, 0.62, -0.75],
  [1.2, 0.5, 0.7, -0.25],
  [1.05, 0.45, 0.64, 0.25],
  [0.7, 0.4, 0.5, 0.72],
];

export function GolemBody(props: GolemBodyProps): JSX.Element {
  const { theme } = props;
  return (
    <group>
      {SLABS.map(([width, height, depth, y], index) => (
        <mesh key={y} position={[index % 2 === 0 ? 0.04 : -0.04, y, 0]} castShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={theme.enemyBody} roughness={0.7} metalness={0.15} />
        </mesh>
      ))}

      {/* Visor and indented config lines on the chest */}
      <mesh position={[0, 0.76, 0.26]}>
        <boxGeometry args={[0.46, 0.09, 0.02]} />
        <meshStandardMaterial
          ref={props.glowRef}
          color={theme.enemyGlow}
          emissive={theme.enemyGlow}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>
      {[0, 1, 2].map((line) => (
        <mesh key={line} position={[-0.12 + line * 0.08, 0.3 - line * 0.12, 0.33]}>
          <boxGeometry args={[0.5 - line * 0.08, 0.04, 0.02]} />
          <meshStandardMaterial color={theme.enemyGlow} emissive={theme.enemyGlow} emissiveIntensity={0.6} />
        </mesh>
      ))}

      <GolemArms body={theme.enemyBody} />
    </group>
  );
}

/** Two heavy block fists swinging out of step with each other. */
function GolemArms(props: { readonly body: string }): JSX.Element {
  const armsRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    armsRef.current?.children.forEach((arm, index) => {
      arm.rotation.x = Math.sin(clock.elapsedTime * 1.2 + index * Math.PI) * 0.25;
    });
  });

  return (
    <group ref={armsRef}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.8, 0.35, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.32, 0.9, 0.36]} />
            <meshStandardMaterial color={props.body} roughness={0.7} metalness={0.15} />
          </mesh>
          <mesh position={[0, -1.0, 0.04]} castShadow>
            <boxGeometry args={[0.44, 0.34, 0.46]} />
            <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
