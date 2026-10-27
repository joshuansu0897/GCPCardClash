/**
 * Low-poly building (CC0 Kenney model) that pops onto a pad when a GCP service is deployed.
 * The model comes from the card category's archetype; a glowing base ring and a corner pennant
 * in the owning architect's colour show who holds the node.
 */

import { type JSX, Suspense, useRef } from 'react';
import type { Group } from 'three';

import type { PlayerActor } from '../../battle';
import type { BuildingArchetype } from '../domain/board-layout';
import { BUILDING_MODEL, KitModel } from './kit-models';
import { OWNER_HEX, usePopIn } from './motion';

/** Footprint of a deployed building, a little inside the pad. */
const BUILDING_WIDTH = 1.9;
/** Tall towers and small props (the edge dish) read better narrower than full-width buildings. */
const ARCHETYPE_WIDTH: Partial<Record<BuildingArchetype, number>> = { rack: 1.25, tower: 1.5, crystal: 1.6 };

export interface BuildingMiniatureProps {
  readonly archetype: BuildingArchetype;
  readonly bodyHex: string;
  readonly owner: PlayerActor;
  readonly popDelaySec: number;
  readonly reducedMotion: boolean;
}

export function BuildingMiniature(props: BuildingMiniatureProps): JSX.Element {
  const groupRef = useRef<Group>(null);
  usePopIn(groupRef, props.popDelaySec, 0.55, props.reducedMotion);
  const accent = OWNER_HEX[props.owner];

  return (
    <group ref={groupRef} scale={0.0001}>
      <OwnerRing accent={accent} />
      <Suspense fallback={null}>
        <KitModel name={BUILDING_MODEL[props.archetype]} width={ARCHETYPE_WIDTH[props.archetype] ?? BUILDING_WIDTH} />
      </Suspense>
      <OwnerPennant accent={accent} body={props.bodyHex} />
    </group>
  );
}

function OwnerRing(props: { readonly accent: string }): JSX.Element {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.92, 1.04, 40]} />
      <meshStandardMaterial color={props.accent} emissive={props.accent} emissiveIntensity={1.6} toneMapped={false} />
    </mesh>
  );
}

/** A small flag on the pad's front corner: owner colour, with the service's subsystem ink as the stripe. */
function OwnerPennant(props: { readonly accent: string; readonly body: string }): JSX.Element {
  return (
    <group position={[0.82, 0, 0.82]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
      </mesh>
      <mesh position={[0.17, 0.76, 0]} castShadow>
        <boxGeometry args={[0.32, 0.2, 0.02]} />
        <meshStandardMaterial color={props.accent} emissive={props.accent} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.17, 0.66, 0.011]}>
        <planeGeometry args={[0.32, 0.05]} />
        <meshStandardMaterial color={props.body} />
      </mesh>
    </group>
  );
}
