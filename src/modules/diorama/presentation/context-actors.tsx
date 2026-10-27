/**
 * Fixed, non-playable diagram nodes on the island (shoppers, browsers, devices, on-prem sites,
 * partner systems), and the dashed "Google Cloud" boundary drawn around everything inside it.
 */

import { type JSX, Suspense } from 'react';

import type { ContextNodeKind } from '../../catalog';
import type { ContextPlacement, FootprintRect } from '../domain/board-layout';
import { ACTOR_MODELS, KitModel, type KitModelName } from './kit-models';

const BASE_HEX = '#334155';
/** Crowd members: x, z and a slight turn, all roughly facing the camera. */
const CROWD_SPOTS: readonly (readonly [number, number, number])[] = [
  [-0.42, 0.22, 0.35],
  [0.42, 0.22, -0.35],
  [0, -0.32, 0],
];
/** Footprint per actor model, so terminals stay small next to buildings. */
const ACTOR_WIDTH: Partial<Record<ContextNodeKind, number>> = { browser: 1.1, devices: 1.1 };
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
          <Suspense fallback={null}>
            <ActorModel kind={context.kind} />
          </Suspense>
        </group>
      ))}
    </group>
  );
}

function ActorModel(props: { readonly kind: ContextNodeKind }): JSX.Element {
  const models = ACTOR_MODELS[props.kind];
  if (props.kind === 'users') {
    return <People models={models} />;
  }
  return (
    <group position={[0, 0.08, 0]}>
      <KitModel name={models[0] ?? 'commercial-building-c'} width={ACTOR_WIDTH[props.kind] ?? 1.3} />
    </group>
  );
}

/** A small idle crowd of mini characters. */
function People(props: { readonly models: readonly KitModelName[] }): JSX.Element {
  return (
    <group>
      {CROWD_SPOTS.map(([x, z, turn], index) => (
        <group key={index} position={[x, 0.08, z]} rotation={[0, turn, 0]}>
          <KitModel name={props.models[index % props.models.length] ?? 'mini-character-male-a'} width={0.62} animation="idle" />
        </group>
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
