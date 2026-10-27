/**
 * Low-poly district props standing on the zone terraces: racks, storage tanks, antennas,
 * security bollards, AI crystals and trees. Placement comes from `computeTerraceDecor`.
 */

import { type JSX, useMemo } from 'react';
import { Color, DoubleSide } from 'three';

import { INK_HEX } from '../domain/board-layout';
import type { DecorPlacement } from '../domain/terrace-decor';

export function TerraceDecor(props: {
  readonly decor: readonly DecorPlacement[];
  readonly foliage: string;
}): JSX.Element {
  return (
    <group>
      {props.decor.map((item) => (
        <group
          key={item.id}
          position={item.position as [number, number, number]}
          rotation={[0, item.rotationY, 0]}
          scale={item.scale}
        >
          <DecorModel item={item} foliage={props.foliage} />
        </group>
      ))}
    </group>
  );
}

function DecorModel(props: { readonly item: DecorPlacement; readonly foliage: string }): JSX.Element {
  const ink = INK_HEX[props.item.ink];
  switch (props.item.kind) {
    case 'tree':
      return <Tree foliage={props.foliage} />;
    case 'rack':
      return <MiniRack ink={ink} />;
    case 'tank':
      return <StorageTank ink={ink} />;
    case 'antenna':
      return <Antenna ink={ink} />;
    case 'bollard':
      return <Bollard ink={ink} />;
    case 'crystal':
      return <Crystal ink={ink} />;
  }
}

function Glow(props: { readonly color: string; readonly intensity?: number }): JSX.Element {
  return <meshStandardMaterial color={props.color} emissive={props.color} emissiveIntensity={props.intensity ?? 1.2} toneMapped={false} />;
}

function Tree(props: { readonly foliage: string }): JSX.Element {
  const leaf = useMemo(() => `#${new Color(props.foliage).multiplyScalar(0.62).getHexString()}`, [props.foliage]);
  return (
    <group>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.28, 6]} />
        <meshStandardMaterial color="#7C5A3A" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <coneGeometry args={[0.26, 0.5, 7]} />
        <meshStandardMaterial color={leaf} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.74, 0]} castShadow>
        <coneGeometry args={[0.18, 0.36, 7]} />
        <meshStandardMaterial color={leaf} roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function MiniRack(props: { readonly ink: string }): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.32, 0.6, 0.3]} />
        <meshStandardMaterial color="#1E293B" metalness={0.4} roughness={0.5} />
      </mesh>
      {[0.14, 0.28, 0.42].map((y) => (
        <mesh key={y} position={[0, y, 0.152]}>
          <boxGeometry args={[0.24, 0.035, 0.01]} />
          <Glow color={props.ink} />
        </mesh>
      ))}
    </group>
  );
}

function StorageTank(props: { readonly ink: string }): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.52, 14]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#F8FAFC" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.205, 0.022, 6, 20]} />
        <Glow color={props.ink} intensity={0.9} />
      </mesh>
    </group>
  );
}

function Antenna(props: { readonly ink: string }): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.05, 0.9, 6]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.62, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.16, 0.08, 14, 1, true]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.4} roughness={0.3} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.93, 0]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <Glow color={props.ink} intensity={1.8} />
      </mesh>
    </group>
  );
}

function Bollard(props: { readonly ink: string }): JSX.Element {
  return (
    <group>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.17, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.34, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <torusGeometry args={[0.072, 0.018, 6, 16]} />
            <Glow color={props.ink} intensity={1.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Crystal(props: { readonly ink: string }): JSX.Element {
  return (
    <group>
      <mesh position={[0, 0.34, 0]} scale={[0.7, 1.6, 0.7]} castShadow>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={props.ink} emissive={props.ink} emissiveIntensity={0.7} transparent opacity={0.88} flatShading />
      </mesh>
      <mesh position={[0.17, 0.16, 0.05]} rotation={[0, 0, -0.5]} scale={[0.5, 1, 0.5]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color={props.ink} emissive={props.ink} emissiveIntensity={0.7} flatShading />
      </mesh>
    </group>
  );
}
