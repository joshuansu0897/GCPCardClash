/**
 * Fixed, non-playable diagram nodes on the island (shoppers, browsers, devices, on-prem sites,
 * partner systems), and the dashed "Google Cloud" boundary drawn around everything inside it.
 */

import type { JSX } from 'react';

import type { ContextNodeKind } from '../../catalog';
import type { ContextPlacement, FootprintRect } from '../domain/board-layout';

const BASE_HEX = '#334155';
const FIGURE_HEX = '#E2E8F0';
const SCREEN_HEX = '#38BDF8';
const DASH = 0.55;
const BOUNDARY_HEX = '#F8FAFC';

export function ContextActors(props: { readonly contexts: readonly ContextPlacement[] }): JSX.Element {
  return (
    <group>
      {props.contexts.map((context) => (
        <group key={context.nodeId} position={context.position as [number, number, number]}>
          <mesh position={[0, 0.04, 0]} receiveShadow>
            <cylinderGeometry args={[0.95, 1.05, 0.08, 28]} />
            <meshStandardMaterial color={BASE_HEX} roughness={0.6} />
          </mesh>
          <ActorModel kind={context.kind} />
        </group>
      ))}
    </group>
  );
}

function ActorModel(props: { readonly kind: ContextNodeKind }): JSX.Element {
  switch (props.kind) {
    case 'users':
      return <People />;
    case 'browser':
    case 'devices':
      return <Screen wide={props.kind === 'browser'} />;
    case 'on-prem':
    case 'partner':
    case 'service':
      return <SmallBuilding tint={props.kind === 'partner' ? '#A78BFA' : '#94A3B8'} />;
  }
}

function People(): JSX.Element {
  const spots: readonly (readonly [number, number, number])[] = [
    [-0.42, 0, 0.18],
    [0.42, 0, 0.18],
    [0, 0, -0.25],
  ];
  return (
    <group>
      {spots.map(([x, , z], index) => (
        <group key={index} position={[x, 0.08, z]} scale={index === 2 ? 1.15 : 1}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 0.5, 12]} />
            <meshStandardMaterial color={FIGURE_HEX} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.68, 0]} castShadow>
            <sphereGeometry args={[0.15, 14, 12]} />
            <meshStandardMaterial color={FIGURE_HEX} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Screen(props: { readonly wide: boolean }): JSX.Element {
  const width = props.wide ? 1.1 : 0.7;
  return (
    <group position={[0, 0.08, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.3]} />
        <meshStandardMaterial color="#64748B" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[width, 0.72, 0.08]} />
        <meshStandardMaterial color="#1E293B" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.56, 0.045]}>
        <planeGeometry args={[width - 0.12, 0.6]} />
        <meshStandardMaterial color={SCREEN_HEX} emissive={SCREEN_HEX} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SmallBuilding(props: { readonly tint: string }): JSX.Element {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.9, 1, 0.8]} />
        <meshStandardMaterial color={props.tint} roughness={0.55} />
      </mesh>
      {[0.3, 0.55, 0.8].map((y) => (
        <mesh key={y} position={[0, y, 0.405]}>
          <planeGeometry args={[0.66, 0.1]} />
          <meshStandardMaterial color={SCREEN_HEX} emissive={SCREEN_HEX} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Dashed glowing rectangle on the grass around every node inside the cloud. */
export function CloudBoundary(props: { readonly rect: FootprintRect }): JSX.Element {
  const [cx, , cz] = props.rect.center;
  const [w, d] = props.rect.size;
  const dashes = [
    ...dashesAlong(w).map((x) => [cx + x, cz - d / 2, DASH, 0.07] as const),
    ...dashesAlong(w).map((x) => [cx + x, cz + d / 2, DASH, 0.07] as const),
    ...dashesAlong(d).map((z) => [cx - w / 2, cz + z, 0.07, DASH] as const),
    ...dashesAlong(d).map((z) => [cx + w / 2, cz + z, 0.07, DASH] as const),
  ];

  return (
    <group>
      {dashes.map(([x, z, sw, sd]) => (
        <mesh key={`${x.toFixed(2)}:${z.toFixed(2)}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[sw, sd]} />
          <meshStandardMaterial color={BOUNDARY_HEX} emissive={BOUNDARY_HEX} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Dash centres along a side of `length`, centred on 0 with equal gaps. */
function dashesAlong(length: number): number[] {
  const count = Math.max(1, Math.floor(length / (DASH * 2)));
  const pitch = length / count;
  return Array.from({ length: count }, (_, index) => -length / 2 + pitch * (index + 0.5));
}
