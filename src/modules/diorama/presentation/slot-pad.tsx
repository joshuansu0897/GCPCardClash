/**
 * A single data-center pad on the island: LED-rimmed plinth, owner glow, targeting pulse,
 * deployed building miniature, and shield dome. Its DOM label lives in `label-overlay.tsx`.
 */

import { RoundedBox, useCursor } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useRef, useState } from 'react';
import type { Group, MeshStandardMaterial } from 'three';

import type { PlayerActor, SlotDeployment } from '../../battle';
import type { ArchitectureSlot, CatalogCard } from '../../catalog';
import { INK_HEX, PAD_SIZE, type PadPlacement, resolveBuildingArchetype } from '../domain/board-layout';
import type { PadAffordance } from '../domain/pad-affordance';
import { BuildingMiniature } from './building-miniature';
import { OWNER_HEX } from './motion';
import { ShieldDome } from './shield-dome';

const PAD_HEIGHT = 0.3;
const CLICK_DRAG_TOLERANCE_PX = 6;
const CORNER = PAD_SIZE / 2 - 0.14;
/** Status lights on the pad's four corners, lit in the owner's (or the zone's) colour. */
const PAD_CORNERS: readonly (readonly [number, number])[] = [
  [-CORNER, -CORNER],
  [CORNER, -CORNER],
  [-CORNER, CORNER],
  [CORNER, CORNER],
];

export interface SlotPadProps {
  readonly placement: PadPlacement;
  readonly slot: ArchitectureSlot;
  readonly slotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly affordance: PadAffordance;
  readonly isInspected: boolean;
  readonly popDelaySec: number;
  readonly reducedMotion: boolean;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

export function SlotPad(props: SlotPadProps): JSX.Element {
  const { placement, slot, slotState, affordance } = props;
  const [hovered, setHovered] = useState<boolean>(false);
  useCursor(hovered);

  const liftRef = useRef<Group>(null);
  const rimRef = useRef<MeshStandardMaterial>(null);
  const isActionable = affordance.kind === 'deploy' || affordance.kind === 'capture' || affordance.kind === 'harden';
  const owner = slotState?.owner ?? null;

  useFrame(({ clock }, delta) => {
    animatePad(liftRef.current, rimRef.current, {
      raised: hovered || props.isInspected,
      pulsing: isActionable && !props.reducedMotion,
      owned: owner !== null,
      isInspected: props.isInspected,
      clockSec: clock.elapsedTime,
      delta,
    });
  });

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (event.delta > CLICK_DRAG_TOLERANCE_PX) {
      return;
    }
    const select = isActionable ? props.onTargetSlot : props.onInspectSlot;
    select(slot.id);
  };

  return (
    <group position={placement.position as [number, number, number]}>
      <group ref={liftRef}>
        <PadPlinth
          rimRef={rimRef}
          rimHex={owner !== null ? OWNER_HEX[owner] : INK_HEX[placement.ink]}
          owned={owner !== null}
          onClick={handleClick}
          onHoverChange={setHovered}
        />
        {owner !== null && <PadOccupants {...props} owner={owner} />}
      </group>
    </group>
  );
}

interface PadFrame {
  readonly raised: boolean;
  readonly pulsing: boolean;
  readonly owned: boolean;
  readonly isInspected: boolean;
  readonly clockSec: number;
  readonly delta: number;
}

/** Eases the pad up while hovered or inspected, and pulses its rim while it is a valid target. */
function animatePad(lift: Group | null, rim: MeshStandardMaterial | null, frame: PadFrame): void {
  if (lift !== null) {
    const target = frame.raised ? 0.12 : 0;
    lift.position.y += (target - lift.position.y) * Math.min(1, frame.delta * 10);
  }
  if (rim !== null) {
    const pulse = frame.pulsing ? 0.6 + 0.6 * Math.sin(frame.clockSec * 5) : 0;
    rim.emissiveIntensity = (frame.owned ? 0.9 : 0.35) + pulse + (frame.isInspected ? 0.5 : 0);
  }
}

function PadPlinth(props: {
  readonly rimRef: RefObject<MeshStandardMaterial | null>;
  readonly rimHex: string;
  readonly owned: boolean;
  readonly onClick: (event: ThreeEvent<MouseEvent>) => void;
  readonly onHoverChange: (hovered: boolean) => void;
}): JSX.Element {
  return (
    <group
      onClick={props.onClick}
      onPointerOver={(event) => {
        event.stopPropagation();
        props.onHoverChange(true);
      }}
      onPointerOut={() => props.onHoverChange(false)}
    >
      <RoundedBox
        args={[PAD_SIZE, PAD_HEIGHT, PAD_SIZE]}
        radius={0.1}
        position={[0, PAD_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={props.owned ? '#FFFFFF' : '#F8FAFC'} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, PAD_HEIGHT + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PAD_SIZE * 0.36, PAD_SIZE * 0.42, 4, 1, Math.PI / 4]} />
        <meshStandardMaterial ref={props.rimRef} color={props.rimHex} emissive={props.rimHex} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[PAD_SIZE + 0.18, 0.06, PAD_SIZE + 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {PAD_CORNERS.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, PAD_HEIGHT + 0.05, z]}>
          <boxGeometry args={[0.12, 0.1, 0.12]} />
          <meshStandardMaterial color={props.rimHex} emissive={props.rimHex} emissiveIntensity={1.3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The deployed building and its shield dome, once someone owns the pad. */
function PadOccupants(props: SlotPadProps & { readonly owner: PlayerActor }): JSX.Element {
  const { slotState, owner } = props;
  const service = slotState?.serviceCardId ? props.cardsById[slotState.serviceCardId] : undefined;
  const hasShield = slotState?.shieldCardId != null;

  return (
    <>
      {service !== undefined && (
        <group position={[0, PAD_HEIGHT, 0]}>
          <BuildingMiniature
            key={`${service.id}:${owner}`}
            archetype={resolveBuildingArchetype(service)}
            bodyHex={INK_HEX[service.ink]}
            owner={owner}
            popDelaySec={props.popDelaySec}
            reducedMotion={props.reducedMotion}
          />
        </group>
      )}
      {hasShield && (
        <group position={[0, PAD_HEIGHT, 0]}>
          <ShieldDome
            key={`${slotState?.shieldCardId}:${owner}`}
            colorHex={slotState?.shieldMatchedRecommendation ? '#38BDF8' : '#A78BFA'}
            radius={PAD_SIZE * 0.62}
            popDelaySec={props.popDelaySec}
            reducedMotion={props.reducedMotion}
          />
        </group>
      )}
    </>
  );
}
