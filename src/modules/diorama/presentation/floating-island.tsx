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
      <RoundedBox args={[width - 0.1, 0.5, depth - 0.1]} radius={0.22} position={[0, -SLAB_THICKNESS - 0.2, 0]}>
        <meshStandardMaterial color={props.theme.soil} roughness={0.95} />
      </RoundedBox>

      <IslandUnderside width={width} depth={depth} rock={props.theme.rock} />
      <RimLamps width={width} depth={depth} glow={props.theme.ambient.color} />

      {props.terraces.map((terrace) => (
        <Terrace key={terrace.zoneId} terrace={terrace} />
      ))}

      <FloatingDebris width={width} depth={depth} rock={props.theme.rock} reducedMotion={props.reducedMotion} />
    </group>
  );
}

/** Layered rock strata tapering to a point, with stalactites hanging from the rim. */
function IslandUnderside(props: { readonly width: number; readonly depth: number; readonly rock: string }): JSX.Element {
  const { width, depth } = props;
  const darker = useMemo(() => `#${new Color(props.rock).multiplyScalar(0.72).getHexString()}`, [props.rock]);
  const top = -SLAB_THICKNESS - 0.45;
  const layers = [
    { y: top - 0.35, h: 0.7, r0: 0.52, r1: 0.44, color: props.rock },
    { y: top - 1.15, h: 0.9, r0: 0.44, r1: 0.3, color: darker },
    { y: top - 2.3, h: 1.4, r0: 0.3, r1: 0.06, color: props.rock },
  ];

  return (
    <group>
      {layers.map((layer) => (
        <mesh key={layer.y} position={[0, layer.y, 0]} scale={[width, 1, depth]}>
          <cylinderGeometry args={[layer.r0, layer.r1, layer.h, 9, 1]} />
          <meshStandardMaterial color={layer.color} roughness={0.95} flatShading />
        </mesh>
      ))}
      {STALACTITES.map(([fx, fz, length]) => (
        <mesh key={`${fx}:${fz}`} position={[fx * width, top - 0.7 - length / 2, fz * depth]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, length, 6]} />
          <meshStandardMaterial color={darker} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** [x, z] as fractions of the island size, and length. */
const STALACTITES: readonly (readonly [number, number, number])[] = [
  [-0.38, 0.3, 1.1],
  [0.4, 0.26, 0.9],
  [-0.3, -0.32, 0.8],
  [0.33, -0.3, 1.2],
  [0.05, 0.4, 0.7],
  [-0.06, -0.4, 1],
];

/** Small glowing posts around the island's edge, like runway lights. */
function RimLamps(props: { readonly width: number; readonly depth: number; readonly glow: string }): JSX.Element {
  const lamps = useMemo(() => rimLampPositions(props.width, props.depth), [props.width, props.depth]);

  return (
    <group>
      {lamps.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.18, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshStandardMaterial color={props.glow} emissive={props.glow} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function rimLampPositions(width: number, depth: number): (readonly [number, number])[] {
  const inset = 0.3;
  const halfW = width / 2 - inset;
  const halfD = depth / 2 - inset;
  const across = Math.max(2, Math.round(width / 1.6));
  const positions: (readonly [number, number])[] = [];
  for (let i = 0; i <= across; i += 1) {
    const x = -halfW + (i / across) * halfW * 2;
    positions.push([x, halfD], [x, -halfD]);
  }
  return positions;
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
      <TerraceOutline center={[cx, top + 0.015, cz]} size={[w - 0.24, d - 0.24]} ink={ink} />
    </group>
  );
}

/** A thin lit border just inside the terrace edge, in the zone's ink. */
function TerraceOutline(props: {
  readonly center: readonly [number, number, number];
  readonly size: readonly [number, number];
  readonly ink: string;
}): JSX.Element {
  const [cx, y, cz] = props.center;
  const [w, d] = props.size;
  const line = 0.06;
  const strips: readonly (readonly [number, number, number, number])[] = [
    [cx, cz - d / 2, w, line],
    [cx, cz + d / 2, w, line * 1.6],
    [cx - w / 2, cz, line, d],
    [cx + w / 2, cz, line, d],
  ];

  return (
    <group>
      {strips.map(([x, z, sw, sd]) => (
        <mesh key={`${x}:${z}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[sw, sd]} />
          <meshStandardMaterial color={props.ink} emissive={props.ink} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>
      ))}
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
