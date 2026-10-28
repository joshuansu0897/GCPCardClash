/**
 * Transient combat VFX driven by `BoardEvent` cues: card toss onto a pad, impact rings,
 * rival capture beams, shield lock flashes, Cloud Incident spectacles, and a victory sparkle burst.
 * Each effect retires itself through `onDone` once its timeline has played out.
 */

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';

import { type IncidentManifestation, getIncidentCard } from '../../battle';
import type { CatalogCard } from '../../catalog';
import type { BoardEvent } from '../domain/board-events';
import { INK_HEX, type PadPlacement, type TerracePlacement } from '../domain/board-layout';
import { GlowSparkles } from './glow-sparkles';
import { IncidentSpectacle, type SpectacleArea } from './incident-spectacle';
import { OWNER_HEX, clamp01, easeInQuad, easeOutCubic, nowSec } from './motion';

export const TOSS_DURATION_SEC = 0.5;
const RING_DURATION_SEC = 0.65;
const BEAM_DURATION_SEC = 0.9;
const VICTORY_DURATION_SEC = 3.2;

export interface ActiveEffect {
  readonly event: BoardEvent;
  readonly startsAt: number;
}

export interface VfxLayerProps {
  readonly effects: readonly ActiveEffect[];
  readonly padsBySlotId: Readonly<Record<string, PadPlacement>>;
  readonly terraces: readonly TerracePlacement[];
  readonly islandWidth: number;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly onDone: (eventId: string) => void;
}

export function VfxLayer(props: VfxLayerProps): JSX.Element {
  return (
    <group>
      {props.effects.map((effect) => (
        <EffectSwitch key={effect.event.id} effect={effect} {...props} />
      ))}
    </group>
  );
}

type EventOf<T extends BoardEvent['type']> = Extract<BoardEvent, { readonly type: T }>;

interface EffectProps<E extends BoardEvent> {
  readonly layer: VfxLayerProps;
  readonly event: E;
  readonly startsAt: number;
  readonly done: () => void;
}

function EffectSwitch(props: VfxLayerProps & { readonly effect: ActiveEffect }): JSX.Element | null {
  const { event, startsAt } = props.effect;
  const done = (): void => props.onDone(event.id);

  switch (event.type) {
    case 'card-deployed':
    case 'slot-captured':
      return <PlacementEffect layer={props} event={event} startsAt={startsAt} done={done} />;
    case 'shield-locked':
      return <ShieldLockEffect layer={props} event={event} startsAt={startsAt} done={done} />;
    case 'incident-struck':
      return <IncidentEffect layer={props} event={event} startsAt={startsAt} done={done} />;
    case 'match-completed':
      return event.winner === 'player' ? <VictoryBurst startsAt={startsAt} onDone={done} /> : <Retire onDone={done} />;
    case 'board-reset':
    case 'energy-gained':
    case 'mistake':
    case 'turn-advanced':
      return <Retire onDone={done} />;
  }
}

/** A card tossed onto the pad, with a capture beam first when it takes over a Rival node. */
function PlacementEffect(props: EffectProps<EventOf<'card-deployed' | 'slot-captured'>>): JSX.Element | null {
  const { event, startsAt } = props;
  const pad = props.layer.padsBySlotId[event.slotId];
  if (pad === undefined) {
    return null;
  }
  const card = props.layer.cardsById[event.cardId];
  const ownerHex = OWNER_HEX[event.owner];

  return (
    <group position={pad.position as [number, number, number]}>
      {event.type === 'slot-captured' && <CaptureBeam startsAt={startsAt} colorHex={ownerHex} />}
      <CardToss startsAt={startsAt} bodyHex={card !== undefined ? INK_HEX[card.ink] : ownerHex} ownerHex={ownerHex} />
      <ImpactRing startsAt={startsAt + TOSS_DURATION_SEC} colorHex={ownerHex} onDone={props.done} />
    </group>
  );
}

function ShieldLockEffect(props: EffectProps<EventOf<'shield-locked'>>): JSX.Element | null {
  const pad = props.layer.padsBySlotId[props.event.slotId];
  if (pad === undefined) {
    return null;
  }

  return (
    <group position={pad.position as [number, number, number]}>
      <ImpactRing
        startsAt={props.startsAt}
        colorHex={props.event.matchedRecommendation ? '#38BDF8' : '#A78BFA'}
        onDone={props.done}
      />
    </group>
  );
}

function IncidentEffect(props: EffectProps<EventOf<'incident-struck'>>): JSX.Element {
  const { event, layer } = props;
  const manifestation = getIncidentCard(event.incidentId)?.manifestation;
  if (manifestation === undefined) {
    return <Retire onDone={props.done} />;
  }

  return (
    <IncidentSpectacle
      manifestation={manifestation}
      startsAt={props.startsAt}
      areas={resolveSpectacleAreas(manifestation, layer.terraces, event.affectedZoneId)}
      struckPoints={event.struckSlotIds.flatMap((slotId) => {
        const pad = layer.padsBySlotId[slotId];
        return pad !== undefined ? [pad.position] : [];
      })}
      islandWidth={layer.islandWidth}
      onDone={props.done}
    />
  );
}

function resolveSpectacleAreas(
  manifestation: IncidentManifestation,
  terraces: readonly TerracePlacement[],
  affectedZoneId: string | null,
): readonly SpectacleArea[] {
  const { target } = manifestation;
  const matching =
    target === 'island'
      ? terraces
      : target === 'affected-zone'
        ? terraces.filter((t) => t.zoneId === affectedZoneId)
        : terraces.filter((t) => t.ink === target);
  return (matching.length > 0 ? matching : terraces).map((t) => ({ center: t.center, size: t.size }));
}

function Retire(props: { readonly onDone: () => void }): null {
  const finished = useRef<boolean>(false);
  useFrame(() => {
    if (!finished.current) {
      finished.current = true;
      props.onDone();
    }
  });
  return null;
}

function CardToss(props: { readonly startsAt: number; readonly bodyHex: string; readonly ownerHex: string }): JSX.Element {
  const ref = useRef<Group>(null);

  useFrame(() => {
    const group = ref.current;
    if (group === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    const t = clamp01(elapsed / TOSS_DURATION_SEC);
    group.visible = elapsed >= 0 && elapsed < TOSS_DURATION_SEC + 0.2;
    const fall = easeInQuad(t);
    group.position.set(0, 6.5 - 6.05 * fall, 3.2 * (1 - easeOutCubic(t)));
    group.rotation.set(-0.9 * (1 - t), (1 - t) * Math.PI * 1.5, 0);
    const squash = elapsed > TOSS_DURATION_SEC ? Math.max(0.0001, 1 - (elapsed - TOSS_DURATION_SEC) / 0.2) : 1;
    group.scale.setScalar(squash);
  });

  return (
    <group ref={ref} visible={false}>
      <RoundedBox args={[1.1, 0.07, 1.5]} radius={0.03} castShadow>
        <meshStandardMaterial color={props.bodyHex} roughness={0.25} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 1.3]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.045, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.16]} />
        <meshStandardMaterial color={props.ownerHex} emissive={props.ownerHex} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function ImpactRing(props: { readonly startsAt: number; readonly colorHex: string; readonly onDone: () => void }): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const finished = useRef<boolean>(false);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (mesh === null || material === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    const t = clamp01(elapsed / RING_DURATION_SEC);
    mesh.visible = elapsed >= 0;
    mesh.scale.setScalar(0.4 + easeOutCubic(t) * 2.2);
    material.opacity = 0.9 * (1 - t);
    if (t >= 1 && !finished.current) {
      finished.current = true;
      props.onDone();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.8, 1, 48]} />
      <meshBasicMaterial ref={materialRef} color={props.colorHex} transparent depthWrite={false} />
    </mesh>
  );
}

function CaptureBeam(props: { readonly startsAt: number; readonly colorHex: string }): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (mesh === null || material === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    const t = clamp01(elapsed / BEAM_DURATION_SEC);
    mesh.visible = elapsed >= 0 && t < 1;
    mesh.scale.set(1 - t * 0.7, 1, 1 - t * 0.7);
    material.opacity = 0.75 * (1 - t);
  });

  return (
    <mesh ref={meshRef} position={[0, 5, 0]} visible={false}>
      <cylinderGeometry args={[0.35, 0.6, 10, 20, 1, true]} />
      <meshBasicMaterial ref={materialRef} color={props.colorHex} transparent depthWrite={false} />
    </mesh>
  );
}

function VictoryBurst(props: { readonly startsAt: number; readonly onDone: () => void }): JSX.Element {
  const finished = useRef<boolean>(false);
  useFrame(() => {
    if (!finished.current && nowSec() - props.startsAt > VICTORY_DURATION_SEC) {
      finished.current = true;
      props.onDone();
    }
  });

  return (
    <group position={[0, 2.5, 0]}>
      <GlowSparkles count={90} scale={[12, 5, 8]} size={6} speed={0.8} color="#FBBF24" />
      <GlowSparkles count={60} scale={[10, 4, 7]} size={4} speed={0.6} color="#60A5FA" />
    </group>
  );
}
