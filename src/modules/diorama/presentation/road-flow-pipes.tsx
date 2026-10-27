/**
 * Glowing flow lanes along each routed blueprint edge, with an arrowhead at the target. Paired
 * request/response lanes run side by side in opposite directions. When both endpoints are owned
 * by the same architect the flow synergy is live and packet pulses stream along the lane.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import { CurvePath, LineCurve3, type Mesh, Quaternion, TubeGeometry, Vector3 } from 'three';

import type { PlayerActor, SlotDeployment } from '../../battle';
import type { RoadPlacement } from '../domain/board-layout';
import { OWNER_HEX } from './motion';

const PACKETS_PER_ROAD = 2;
const IDLE_HEX = '#475569';
const UP = new Vector3(0, 1, 0);

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
          key={road.laneId}
          road={road}
          liveOwner={resolveLiveOwner(props.slots[road.fromNodeId], props.slots[road.toNodeId])}
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
  const path = useMemo(() => buildPath(road.points), [road.points]);
  const geometry = useMemo(() => new TubeGeometry(path, road.points.length * 12, 0.065, 6, false), [path, road.points.length]);
  const arrow = useMemo(() => arrowPose(road.points), [road.points]);
  const color = liveOwner !== null ? OWNER_HEX[liveOwner] : IDLE_HEX;
  const material = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={liveOwner !== null ? 0.9 : 0}
      roughness={0.35}
    />
  );

  return (
    <group>
      <mesh geometry={geometry}>{material}</mesh>
      <mesh position={arrow.position} quaternion={arrow.rotation}>
        <coneGeometry args={[0.16, 0.36, 10]} />
        {material}
      </mesh>
      {liveOwner !== null &&
        Array.from({ length: PACKETS_PER_ROAD }, (_, idx) => (
          <PacketPulse
            key={idx}
            path={path}
            phase={idx / PACKETS_PER_ROAD}
            color={color}
            reducedMotion={props.reducedMotion}
          />
        ))}
    </group>
  );
}

function buildPath(points: RoadPlacement['points']): CurvePath<Vector3> {
  const path = new CurvePath<Vector3>();
  const vectors = points.map(([x, y, z]) => new Vector3(x, y, z));
  vectors.slice(1).forEach((point, index) => {
    path.add(new LineCurve3(vectors[index] ?? point, point));
  });
  return path;
}

/** Cone pointing along the lane's last segment, its tip touching the target's border. */
function arrowPose(points: RoadPlacement['points']): { readonly position: Vector3; readonly rotation: Quaternion } {
  const end = new Vector3(...(points[points.length - 1] ?? [0, 0, 0]));
  const before = new Vector3(...(points[points.length - 2] ?? [0, 0, 0]));
  const direction = end.clone().sub(before).normalize();
  return {
    position: end.clone().addScaledVector(direction, -0.18),
    rotation: new Quaternion().setFromUnitVectors(UP, direction),
  };
}

function PacketPulse(props: {
  readonly path: CurvePath<Vector3>;
  readonly phase: number;
  readonly color: string;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (mesh === null) {
      return;
    }
    const t = props.reducedMotion ? props.phase : (clock.elapsedTime * 0.35 + props.phase) % 1;
    mesh.position.copy(props.path.getPointAt(t));
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.11, 12, 12]} />
      <meshStandardMaterial color="#FFFFFF" emissive={props.color} emissiveIntensity={2.2} />
    </mesh>
  );
}
