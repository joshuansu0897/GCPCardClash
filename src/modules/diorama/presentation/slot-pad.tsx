/**
 * A single data-center pad on the island: LED-rimmed plinth, owner glow, targeting pulse,
 * deployed building miniature, and shield dome. Its DOM label lives in `label-overlay.tsx`.
 */

import { RoundedBox, useCursor } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { type JSX, useRef, useState } from 'react';
import type { Group, MeshStandardMaterial } from 'three';

import type { SlotDeployment } from '../../battle';
import type { ArchitectureSlot, CatalogCard } from '../../catalog';
import { INK_HEX, PAD_SIZE, type PadPlacement, resolveBuildingArchetype } from '../domain/board-layout';
import type { PadAffordance } from '../domain/pad-affordance';
import { BuildingMiniature } from './building-miniature';
import { OWNER_HEX } from './motion';
import { ShieldDome } from './shield-dome';

const PAD_HEIGHT = 0.3;
const CLICK_DRAG_TOLERANCE_PX = 6;

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
  const { placement, slot, slotState, cardsById, affordance } = props;
  const [hovered, setHovered] = useState<boolean>(false);
  useCursor(hovered);

  const liftRef = useRef<Group>(null);
  const rimRef = useRef<MeshStandardMaterial>(null);
  const isActionable = affordance.kind === 'deploy' || affordance.kind === 'capture' || affordance.kind === 'harden';
  const owner = slotState?.owner ?? null;
  const rimHex = owner !== null ? OWNER_HEX[owner] : INK_HEX[placement.ink];

  useFrame(({ clock }, delta) => {
    const lift = liftRef.current;
    if (lift !== null) {
      const target = hovered || props.isInspected ? 0.12 : 0;
      lift.position.y += (target - lift.position.y) * Math.min(1, delta * 10);
    }
    const rim = rimRef.current;
    if (rim !== null) {
      const pulse = isActionable && !props.reducedMotion ? 0.6 + 0.6 * Math.sin(clock.elapsedTime * 5) : 0;
      rim.emissiveIntensity = (owner !== null ? 0.9 : 0.35) + pulse + (props.isInspected ? 0.5 : 0);
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (event.delta > CLICK_DRAG_TOLERANCE_PX) {
      return;
    }
    if (isActionable) {
      props.onTargetSlot(slot.id);
    } else {
      props.onInspectSlot(slot.id);
    }
  };

  const service = slotState?.serviceCardId ? cardsById[slotState.serviceCardId] : undefined;
  const hasShield = slotState?.shieldCardId != null;

  return (
    <group position={placement.position as [number, number, number]}>
      <group ref={liftRef}>
        <group
          onClick={handleClick}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <RoundedBox
            args={[PAD_SIZE, PAD_HEIGHT, PAD_SIZE]}
            radius={0.1}
            position={[0, PAD_HEIGHT / 2, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={owner !== null ? '#FFFFFF' : '#F8FAFC'} roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, PAD_HEIGHT + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[PAD_SIZE * 0.36, PAD_SIZE * 0.42, 4, 1, Math.PI / 4]} />
            <meshStandardMaterial ref={rimRef} color={rimHex} emissive={rimHex} emissiveIntensity={0.4} />
          </mesh>
        </group>

        {service !== undefined && owner !== null && (
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

        {hasShield && owner !== null && (
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
      </group>
    </group>
  );
}
