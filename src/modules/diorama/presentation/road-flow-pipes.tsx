/**
 * Raised glowing tubes along each blueprint flow edge. When both endpoints are owned by
 * the same architect the flow synergy is live and packet pulses stream along the road.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import { type Mesh, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three';

import type { PlayerActor, SlotDeployment } from '../../battle';
import type { RoadPlacement } from '../domain/board-layout';
import { OWNER_HEX } from './motion';

const PACKETS_PER_ROAD = 3;
const PAD_TOP_LIFT = 0.32;

export interface RoadFlowPipesProps {
  readonly roads: readonly RoadPlacement[];
  readonly slots: Readonly<Record<string, SlotDeployment>>;
  readonly reducedMotion: boolean;
}

export function RoadFlowPipes(props: RoadFlowPipesProps): JSX.Element {
  return (
    <group>
      {props.roads.map((road) => (
        <FlowRoad
          key={road.edgeId}
          road={road}
          liveOwner={resolveLiveOwner(props.slots[road.fromSlotId], props.slots[road.toSlotId])}
          reducedMotion={props.reducedMotion}
        />
      ))}
    </group>
  );
}

function resolveLiveOwner(
  from: SlotDeployment | undefined,
  to: SlotDeployment | undefined,
): PlayerActor | null {
  if (from?.owner && from.owner === to?.owner && from.serviceCardId !== null && to.serviceCardId !== null) {
    return from.owner;
  }
  return null;
}

function FlowRoad(props: {
  readonly road: RoadPlacement;
  readonly liveOwner: PlayerActor | null;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const { road, liveOwner } = props;

  const curve = useMemo(() => {
    const [a, b, c] = road.controlPoints.map(
      ([x, y, z]) => new Vector3(x, y + PAD_TOP_LIFT, z),
    ) as [Vector3, Vector3, Vector3];
    return new QuadraticBezierCurve3(a, b, c);
  }, [road.controlPoints]);

  const geometry = useMemo(() => new TubeGeometry(curve, 40, 0.07, 8, false), [curve]);
  const color = liveOwner !== null ? OWNER_HEX[liveOwner] : '#94A3B8';

  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={liveOwner !== null ? 0.9 : 0}
          roughness={0.3}
          transparent
          opacity={liveOwner !== null ? 0.95 : 0.55}
        />
      </mesh>
      {liveOwner !== null &&
        Array.from({ length: PACKETS_PER_ROAD }, (_, idx) => (
          <PacketPulse
            key={idx}
            curve={curve}
            phase={idx / PACKETS_PER_ROAD}
            color={color}
            reducedMotion={props.reducedMotion}
          />
        ))}
    </group>
  );
}

function PacketPulse(props: {
  readonly curve: QuadraticBezierCurve3;
  readonly phase: number;
  readonly color: string;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const ref = useRef<Mesh>(null);
  const scratch = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (mesh === null) {
      return;
    }
    const t = props.reducedMotion ? props.phase : (clock.elapsedTime * 0.45 + props.phase) % 1;
    props.curve.getPoint(t, scratch);
    mesh.position.copy(scratch);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.13, 14, 14]} />
      <meshStandardMaterial color="#FFFFFF" emissive={props.color} emissiveIntensity={2.2} />
    </mesh>
  );
}
