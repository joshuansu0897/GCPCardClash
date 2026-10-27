/**
 * Cloud Incidents played out on the island: a meteor shower on the zone that goes dark, a ship
 * sweeping its beam across the nodes, coins / snow / ice / goo falling from the sky, lightning
 * striking the AI tier, or a storm of packets racing through the edge. Driven purely by the
 * incident's `manifestation`; the rules effect has already been applied to the match state.
 */

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, useLayoutEffect, useMemo, useRef } from 'react';
import {
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  Object3D,
  type PointLight,
  Vector3,
} from 'three';

import type { IncidentManifestation, IncidentPalette } from '../../battle';
import type { Vec3 } from '../domain/board-layout';
import { clamp01, easeInQuad, easeOutCubic, nowSec } from './motion';

export const SPECTACLE_DURATION_SEC = 3.6;

const PALETTE_HEX: Readonly<Record<IncidentPalette, { readonly main: string; readonly accent: string }>> = {
  fire: { main: '#F97316', accent: '#FDE047' },
  ice: { main: '#BAE6FD', accent: '#F0F9FF' },
  gold: { main: '#FACC15', accent: '#FEF9C3' },
  toxic: { main: '#84CC16', accent: '#D9F99D' },
  neon: { main: '#22D3EE', accent: '#A5F3FC' },
  scan: { main: '#4ADE80', accent: '#BBF7D0' },
  shadow: { main: '#7C3AED', accent: '#C4B5FD' },
  glitch: { main: '#E879F9', accent: '#F5D0FE' },
};

/** A rectangular patch of island the incident lands on (a zone terrace or the whole island). */
export interface SpectacleArea {
  readonly center: Vec3;
  readonly size: readonly [width: number, depth: number];
}

export interface IncidentSpectacleProps {
  readonly manifestation: IncidentManifestation;
  readonly startsAt: number;
  readonly areas: readonly SpectacleArea[];
  /** Pads the incident actually hit; meteors and bolts aim at these first. */
  readonly struckPoints: readonly Vec3[];
  readonly islandWidth: number;
  readonly onDone: () => void;
}

export function IncidentSpectacle(props: IncidentSpectacleProps): JSX.Element {
  const finished = useRef<boolean>(false);
  useFrame(() => {
    if (!finished.current && nowSec() - props.startsAt > SPECTACLE_DURATION_SEC) {
      finished.current = true;
      props.onDone();
    }
  });

  const colors = PALETTE_HEX[props.manifestation.palette];
  switch (props.manifestation.kind) {
    case 'meteor-shower':
      return <MeteorShower {...props} colors={colors} />;
    case 'flyover':
      return <Flyover {...props} colors={colors} dark={props.manifestation.palette === 'shadow'} />;
    case 'sky-fall':
      return <SkyFall {...props} colors={colors} particle={props.manifestation.particle ?? 'snow'} />;
    case 'lightning':
      return <LightningStorm {...props} colors={colors} />;
    case 'packet-stream':
      return <PacketStream {...props} colors={colors} />;
  }
}

type Colors = (typeof PALETTE_HEX)[IncidentPalette];

/** Deterministic pseudo-random in [0, 1) so a replayed incident looks the same. */
function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function pickPoints(areas: readonly SpectacleArea[], struck: readonly Vec3[], count: number): Vec3[] {
  const points: Vec3[] = [...struck];
  for (let i = 0; points.length < count && areas.length > 0; i += 1) {
    const area = areas[i % areas.length] as SpectacleArea;
    points.push([
      area.center[0] + (hash01(i * 3 + 1) - 0.5) * area.size[0] * 0.85,
      area.center[1],
      area.center[2] + (hash01(i * 3 + 2) - 0.5) * area.size[1] * 0.85,
    ]);
  }
  return points.slice(0, count);
}

/* ---------- Meteor shower ---------- */

const METEOR_FALL_SEC = 0.75;

function MeteorShower(props: IncidentSpectacleProps & { readonly colors: Colors }): JSX.Element {
  const targets = useMemo(() => pickPoints(props.areas, props.struckPoints, 11), [props.areas, props.struckPoints]);
  return (
    <group>
      {targets.map((target, index) => (
        <Meteor
          key={index}
          target={target}
          startsAt={props.startsAt + 0.15 + index * 0.2}
          colors={props.colors}
          big={index < props.struckPoints.length}
        />
      ))}
    </group>
  );
}

function Meteor(props: {
  readonly target: Vec3;
  readonly startsAt: number;
  readonly colors: Colors;
  readonly big: boolean;
}): JSX.Element {
  const rockRef = useRef<Group>(null);
  const blastRef = useRef<Mesh>(null);
  const blastMat = useRef<MeshBasicMaterial>(null);
  const ringRef = useRef<Mesh>(null);
  const ringMat = useRef<MeshBasicMaterial>(null);
  const lightRef = useRef<PointLight>(null);
  const [tx, ty, tz] = props.target;
  const from = useMemo(() => new Vector3(tx - 5, ty + 11, tz - 4), [tx, ty, tz]);
  const to = useMemo(() => new Vector3(tx, ty + 0.2, tz), [tx, ty, tz]);
  const size = props.big ? 0.42 : 0.26;

  useLayoutEffect(() => {
    rockRef.current?.lookAt(to.clone().sub(from).add(rockRef.current.position));
  }, [from, to]);

  useFrame(() => {
    const elapsed = nowSec() - props.startsAt;
    const fall = clamp01(elapsed / METEOR_FALL_SEC);
    const rock = rockRef.current;
    if (rock !== null) {
      rock.visible = elapsed >= 0 && fall < 1;
      rock.position.lerpVectors(from, to, easeInQuad(fall));
    }
    const sinceImpact = elapsed - METEOR_FALL_SEC;
    const blast = clamp01(sinceImpact / 0.7);
    const impacted = sinceImpact >= 0 && blast < 1;
    if (blastRef.current !== null && blastMat.current !== null) {
      blastRef.current.visible = impacted;
      blastRef.current.scale.setScalar(0.2 + easeOutCubic(blast) * (props.big ? 1.8 : 1.1));
      blastMat.current.opacity = 0.9 * (1 - blast);
    }
    if (ringRef.current !== null && ringMat.current !== null) {
      ringRef.current.visible = impacted;
      ringRef.current.scale.setScalar(0.3 + easeOutCubic(blast) * (props.big ? 3 : 2));
      ringMat.current.opacity = 0.8 * (1 - blast);
    }
    if (lightRef.current !== null) {
      lightRef.current.intensity = impacted ? 30 * (1 - blast) : 0;
    }
  });

  return (
    <group>
      <group ref={rockRef} visible={false}>
        <mesh>
          <dodecahedronGeometry args={[size, 0]} />
          <meshStandardMaterial color="#44403C" emissive={props.colors.main} emissiveIntensity={1.4} flatShading />
        </mesh>
        <mesh position={[0, 0, -size * 3]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[size * 0.95, size * 6, 12, 1, true]} />
          <meshBasicMaterial color={props.colors.accent} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={blastRef} position={to} visible={false}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshBasicMaterial ref={blastMat} color={props.colors.accent} transparent depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} position={[tx, ty + 0.08, tz]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.6, 0.85, 36]} />
        <meshBasicMaterial ref={ringMat} color={props.colors.main} transparent depthWrite={false} />
      </mesh>
      <pointLight ref={lightRef} position={[tx, ty + 1, tz]} color={props.colors.main} intensity={0} distance={6} />
    </group>
  );
}

/* ---------- Flyover ---------- */

function Flyover(props: IncidentSpectacleProps & { readonly colors: Colors; readonly dark: boolean }): JSX.Element {
  const shipRef = useRef<Group>(null);
  const lightsRef = useRef<Group>(null);
  const beamMat = useRef<MeshBasicMaterial>(null);
  const scanTargets = useMemo(
    () => (props.struckPoints.length > 0 ? props.struckPoints : pickPoints(props.areas, [], 6)),
    [props.areas, props.struckPoints],
  );
  const halfSpan = props.islandWidth / 2 + 5;
  const shipX = useRef<number>(-halfSpan);

  useFrame(({ clock }) => {
    const ship = shipRef.current;
    if (ship === null) {
      return;
    }
    const t = clamp01((nowSec() - props.startsAt) / (SPECTACLE_DURATION_SEC - 0.2));
    // Ease in, slow down over the island to scan, then accelerate away
    const eased = t < 0.5 ? 0.5 * easeOutCubic(t * 2) : 0.5 + 0.5 * easeInQuad((t - 0.5) * 2);
    shipX.current = -halfSpan + eased * halfSpan * 2;
    ship.visible = t > 0 && t < 1;
    ship.position.set(shipX.current, 4.4 + Math.sin(clock.elapsedTime * 3) * 0.12, Math.sin(t * Math.PI) * 1.2 - 0.6);
    ship.rotation.set(0, 0, Math.cos(t * Math.PI) * 0.12);
    if (lightsRef.current !== null) {
      lightsRef.current.rotation.y += 0.08;
    }
    if (beamMat.current !== null) {
      beamMat.current.opacity = t > 0.18 && t < 0.82 ? 0.28 + Math.sin(clock.elapsedTime * 14) * 0.05 : 0;
    }
  });

  return (
    <group>
      <group ref={shipRef} visible={false}>
        <mesh scale={[1.7, 0.32, 1.7]} castShadow>
          <sphereGeometry args={[1, 28, 16]} />
          <meshStandardMaterial
            color={props.dark ? '#111827' : '#CBD5E1'}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.62, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={props.colors.main}
            emissive={props.colors.main}
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
        <group ref={lightsRef}>
          {Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * Math.PI * 2;
            return (
              <mesh key={index} position={[Math.cos(angle) * 1.45, -0.05, Math.sin(angle) * 1.45]}>
                <sphereGeometry args={[0.08, 8, 6]} />
                <meshBasicMaterial color={index % 2 === 0 ? props.colors.accent : props.colors.main} />
              </mesh>
            );
          })}
        </group>
        <mesh position={[0, -2.25, 0]}>
          <cylinderGeometry args={[0.35, 1.5, 4.2, 24, 1, true]} />
          <meshBasicMaterial ref={beamMat} color={props.colors.main} transparent opacity={0} depthWrite={false} />
        </mesh>
        <pointLight position={[0, -1, 0]} color={props.colors.main} intensity={10} distance={7} />
      </group>
      {scanTargets.map((point, index) => (
        <ScanMark key={index} point={point} shipX={shipX} color={props.colors.main} />
      ))}
    </group>
  );
}

/** Lights up under a target pad while the ship's beam passes over it. */
function ScanMark(props: {
  readonly point: Vec3;
  readonly shipX: { readonly current: number };
  readonly color: string;
}): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    const proximity = clamp01(1 - Math.abs(props.shipX.current - props.point[0]) / 1.6);
    if (meshRef.current !== null && matRef.current !== null) {
      meshRef.current.visible = proximity > 0;
      meshRef.current.scale.setScalar(0.8 + proximity * 0.6);
      matRef.current.opacity = proximity * 0.85;
    }
  });
  return (
    <mesh
      ref={meshRef}
      position={[props.point[0], props.point[1] + 0.4, props.point[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <ringGeometry args={[0.9, 1.15, 40]} />
      <meshBasicMaterial ref={matRef} color={props.color} transparent depthWrite={false} />
    </mesh>
  );
}

/* ---------- Sky-fall (coins, snow, ice shards, goo) ---------- */

const SKYFALL_COUNT = 140;

function SkyFall(
  props: IncidentSpectacleProps & {
    readonly colors: Colors;
    readonly particle: NonNullable<IncidentManifestation['particle']>;
  },
): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const tintRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const dummy = useMemo(() => new Object3D(), []);
  const drops = useMemo(
    () =>
      Array.from({ length: SKYFALL_COUNT }, (_, index) => {
        const area = props.areas[index % Math.max(1, props.areas.length)];
        const cx = area?.center[0] ?? 0;
        const cz = area?.center[2] ?? 0;
        const [w, d] = area?.size ?? [10, 8];
        return {
          x: cx + (hash01(index * 5 + 1) - 0.5) * w,
          z: cz + (hash01(index * 5 + 2) - 0.5) * d,
          floor: area?.center[1] ?? 0,
          delay: hash01(index * 5 + 3) * 1.6,
          speed: 5 + hash01(index * 5 + 4) * 4,
          spin: hash01(index * 5 + 5) * 8,
        };
      }),
    [props.areas],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    const fade = 1 - clamp01((elapsed - (SPECTACLE_DURATION_SEC - 0.6)) / 0.6);
    drops.forEach((drop, index) => {
      const local = elapsed - drop.delay;
      const y = Math.max(drop.floor + 0.08, 9 - local * drop.speed);
      const landed = y <= drop.floor + 0.08;
      const visible = local > 0 && fade > 0;
      dummy.position.set(drop.x, y, drop.z);
      dummy.rotation.set(local * drop.spin, local * drop.spin * 0.7, 0);
      const squash = props.particle === 'goo' && landed ? 0.35 : 1;
      dummy.scale.set(visible ? fade : 0, visible ? fade * squash : 0, visible ? fade : 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const tintOpacity = 0.32 * clamp01(elapsed / 1.2) * fade;
    tintRefs.current.forEach((material) => {
      if (material !== null) {
        material.opacity = tintOpacity;
      }
    });
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SKYFALL_COUNT]} frustumCulled={false}>
        <ParticleGeometry particle={props.particle} />
        <ParticleMaterial particle={props.particle} colors={props.colors} />
      </instancedMesh>
      {props.areas.map((area, index) => (
        <mesh
          key={index}
          position={[area.center[0], area.center[1] + 0.03, area.center[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[area.size[0], area.size[1]]} />
          <meshBasicMaterial
            ref={(material) => {
              tintRefs.current[index] = material;
            }}
            color={props.colors.main}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ParticleGeometry(props: { readonly particle: NonNullable<IncidentManifestation['particle']> }): JSX.Element {
  switch (props.particle) {
    case 'coin':
      return <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />;
    case 'shard':
      return <octahedronGeometry args={[0.16, 0]} />;
    case 'goo':
      return <sphereGeometry args={[0.15, 10, 8]} />;
    case 'snow':
      return <sphereGeometry args={[0.07, 6, 5]} />;
  }
}

function ParticleMaterial(props: {
  readonly particle: NonNullable<IncidentManifestation['particle']>;
  readonly colors: Colors;
}): JSX.Element {
  if (props.particle === 'coin') {
    return <meshStandardMaterial color={props.colors.main} metalness={0.9} roughness={0.2} />;
  }
  return (
    <meshStandardMaterial
      color={props.colors.accent}
      emissive={props.colors.main}
      emissiveIntensity={props.particle === 'snow' ? 0.4 : 0.8}
      roughness={0.3}
      transparent
      opacity={props.particle === 'shard' ? 0.85 : 1}
    />
  );
}

/* ---------- Lightning ---------- */

function LightningStorm(props: IncidentSpectacleProps & { readonly colors: Colors }): JSX.Element {
  const targets = useMemo(() => pickPoints(props.areas, props.struckPoints, 6), [props.areas, props.struckPoints]);
  return (
    <group>
      {targets.map((target, index) => (
        <Bolt key={index} target={target} seed={index} startsAt={props.startsAt + 0.2 + index * 0.42} colors={props.colors} />
      ))}
    </group>
  );
}

function Bolt(props: {
  readonly target: Vec3;
  readonly seed: number;
  readonly startsAt: number;
  readonly colors: Colors;
}): JSX.Element {
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<PointLight>(null);
  const points = useMemo(() => {
    const [x, y, z] = props.target;
    const segments = 9;
    return Array.from({ length: segments + 1 }, (_, i) => {
      const t = i / segments;
      const jitter = i === 0 || i === segments ? 0 : 0.55;
      return [
        x + (hash01(props.seed * 31 + i) - 0.5) * jitter * 2,
        y + 0.3 + (1 - t) * 10,
        z + (hash01(props.seed * 17 + i) - 0.5) * jitter,
      ] as [number, number, number];
    });
  }, [props.target, props.seed]);

  useFrame(() => {
    const elapsed = nowSec() - props.startsAt;
    // Two quick flashes per strike
    const on = (elapsed > 0 && elapsed < 0.12) || (elapsed > 0.2 && elapsed < 0.34);
    if (groupRef.current !== null) {
      groupRef.current.visible = on;
    }
    if (lightRef.current !== null) {
      lightRef.current.intensity = on ? 40 : 0;
    }
  });

  return (
    <group>
      <group ref={groupRef} visible={false}>
        <Line points={points} color={props.colors.accent} lineWidth={5} transparent opacity={0.95} />
        <Line points={points} color={props.colors.main} lineWidth={12} transparent opacity={0.35} />
      </group>
      <pointLight
        ref={lightRef}
        position={[props.target[0], props.target[1] + 1.5, props.target[2]]}
        color={props.colors.main}
        intensity={0}
        distance={8}
      />
    </group>
  );
}

/* ---------- Packet stream ---------- */

const PACKET_COUNT = 90;

function PacketStream(props: IncidentSpectacleProps & { readonly colors: Colors }): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const lanes = useMemo(
    () =>
      Array.from({ length: PACKET_COUNT }, (_, index) => {
        const area = props.areas[index % Math.max(1, props.areas.length)];
        return {
          z: (area?.center[2] ?? 0) + (hash01(index * 7 + 1) - 0.5) * (area?.size[1] ?? 8) * 0.9,
          y: (area?.center[1] ?? 0) + 0.5 + hash01(index * 7 + 2) * 1.6,
          centerX: area?.center[0] ?? 0,
          delay: hash01(index * 7 + 3) * 2,
          speed: 8 + hash01(index * 7 + 4) * 6,
        };
      }),
    [props.areas],
  );
  const span = props.islandWidth + 10;

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    lanes.forEach((lane, index) => {
      const local = elapsed - lane.delay;
      const x = -span / 2 + local * lane.speed;
      // Packets arc upward as they pass over the target zone
      const over = clamp01(1 - Math.abs(x - lane.centerX) / 3);
      const visible = local > 0 && x < span / 2;
      dummy.position.set(x, lane.y + over * 0.8, lane.z);
      dummy.scale.set(visible ? 1.8 : 0, visible ? 0.5 : 0, visible ? 0.5 : 0);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PACKET_COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      <meshStandardMaterial color={props.colors.accent} emissive={props.colors.main} emissiveIntensity={1.6} toneMapped={false} />
    </instancedMesh>
  );
}
