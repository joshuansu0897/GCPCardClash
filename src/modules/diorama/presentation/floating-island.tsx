/**
 * Low-poly floating landmass with one coloured terrace per perimeter zone,
 * a rocky underside, drifting debris, and puffy toy clouds around it.
 */

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import { Color, type Group } from 'three';

import type { TerracePlacement } from '../domain/board-layout';
import { INK_HEX } from '../domain/board-layout';
import type { TrackTheme } from '../domain/track-theme';

const SLAB_THICKNESS = 0.6;

export interface FloatingIslandProps {
  readonly size: readonly [width: number, depth: number];
  readonly terraces: readonly TerracePlacement[];
  readonly theme: TrackTheme;
  readonly reducedMotion: boolean;
}

export function FloatingIsland(props: FloatingIslandProps): JSX.Element {
  const [width, depth] = props.size;

  return (
    <group>
      <RoundedBox
        args={[width, SLAB_THICKNESS, depth]}
        radius={0.28}
        position={[0, -SLAB_THICKNESS / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={props.theme.grass} roughness={0.8} />
      </RoundedBox>

      <mesh position={[0, -SLAB_THICKNESS - 1.6, 0]} scale={[width * 0.5, 1, depth * 0.5]}>
        <cylinderGeometry args={[1, 0.18, 3.2, 7, 2]} />
        <meshStandardMaterial color={props.theme.rock} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, -SLAB_THICKNESS - 0.15, 0]} scale={[width * 0.52, 1, depth * 0.52]}>
        <cylinderGeometry args={[1, 0.92, 0.3, 7]} />
        <meshStandardMaterial color={props.theme.soil} roughness={0.9} flatShading />
      </mesh>

      {props.terraces.map((terrace) => (
        <Terrace key={terrace.zoneId} terrace={terrace} />
      ))}

      <FloatingDebris width={width} depth={depth} rock={props.theme.rock} reducedMotion={props.reducedMotion} />
    </group>
  );
}

function Terrace(props: { readonly terrace: TerracePlacement }): JSX.Element {
  const { terrace } = props;
  const [cx, top, cz] = terrace.center;
  const [w, d] = terrace.size;
  const height = top + 0.2;
  const ink = INK_HEX[terrace.ink];
  const pastel = useMemo(() => `#${new Color(ink).lerp(new Color('#FFFFFF'), 0.58).getHexString()}`, [ink]);

  return (
    <group>
      <RoundedBox args={[w, height, d]} radius={0.12} position={[cx, top - height / 2, cz]} receiveShadow castShadow>
        <meshStandardMaterial color={pastel} roughness={0.55} />
      </RoundedBox>
      <mesh position={[cx, top + 0.006, cz + d / 2 - 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - 0.3, 0.08]} />
        <meshStandardMaterial color={ink} emissive={ink} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function FloatingDebris(props: {
  readonly width: number;
  readonly depth: number;
  readonly rock: string;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current !== null && !props.reducedMotion) {
      ref.current.rotation.y = clock.elapsedTime * 0.05;
    }
  });
  const rocks: readonly (readonly [number, number, number, number])[] = [
    [props.width * 0.42, -2.6, props.depth * 0.2, 0.45],
    [-props.width * 0.45, -3.2, -props.depth * 0.1, 0.35],
    [props.width * 0.15, -4.2, props.depth * 0.35, 0.28],
    [-props.width * 0.25, -2.2, props.depth * 0.42, 0.22],
  ];

  return (
    <group ref={ref}>
      {rocks.map(([x, y, z, r]) => (
        <mesh key={`${x}:${z}`} position={[x, y, z]}>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={props.rock} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function SkyClouds(props: {
  readonly spread: number;
  readonly color: string;
  readonly opacity: number;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current !== null && !props.reducedMotion) {
      ref.current.rotation.y += delta * 0.012;
    }
  });
  const s = props.spread;
  const clouds: readonly (readonly [number, number, number, number])[] = [
    [-s * 0.75, -1.4, -s * 0.35, 1.2],
    [s * 0.8, -2.2, -s * 0.15, 1],
    [s * 0.55, -3.8, s * 0.45, 1.4],
    [-s * 0.6, -4.4, s * 0.4, 1.1],
    [0, -5.6, -s * 0.55, 1.6],
  ];

  return (
    <group ref={ref}>
      {clouds.map(([x, y, z, scale]) => (
        <group key={`${x}:${z}`} position={[x, y, z]} scale={scale}>
          {([
            [0, 0, 0, 0.9],
            [0.85, -0.15, 0.1, 0.65],
            [-0.8, -0.2, -0.05, 0.6],
            [0.3, 0.35, -0.2, 0.6],
          ] as const).map(([px, py, pz, r]) => (
            <mesh key={`${px}:${py}`} position={[px, py, pz]}>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial color={props.color} roughness={1} transparent opacity={props.opacity} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
