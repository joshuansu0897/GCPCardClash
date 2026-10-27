/**
 * Sky-fall: coins, snow, ice shards or goo rain onto the affected areas while a tint of the
 * incident's color spreads over the ground.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useMemo, useRef } from 'react';
import { type InstancedMesh, type MeshBasicMaterial, Object3D } from 'three';

import { clamp01, nowSec } from '../motion';
import {
  type Colors,
  SPECTACLE_DURATION_SEC,
  type SkyParticle,
  type SpectacleArea,
  type SpectacleProps,
  hash01,
} from './spectacle-kit';

const SKYFALL_COUNT = 140;
const DROP_HEIGHT = 9;
const LANDING_OFFSET = 0.08;

interface Drop {
  readonly x: number;
  readonly z: number;
  readonly floor: number;
  readonly delay: number;
  readonly speed: number;
  readonly spin: number;
}

export function SkyFall(props: SpectacleProps & { readonly particle: SkyParticle }): JSX.Element {
  const meshRef = useRef<InstancedMesh>(null);
  const tintRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const dummy = useMemo(() => new Object3D(), []);
  const drops = useMemo(() => scatterDrops(props.areas), [props.areas]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) {
      return;
    }
    const elapsed = nowSec() - props.startsAt;
    const fade = 1 - clamp01((elapsed - (SPECTACLE_DURATION_SEC - 0.6)) / 0.6);
    drops.forEach((drop, index) => {
      placeDrop(dummy, drop, { elapsed, fade, particle: props.particle });
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    setTintOpacity(tintRefs.current, 0.32 * clamp01(elapsed / 1.2) * fade);
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SKYFALL_COUNT]} frustumCulled={false}>
        <ParticleGeometry particle={props.particle} />
        <ParticleMaterial particle={props.particle} colors={props.colors} />
      </instancedMesh>
      <GroundTints areas={props.areas} color={props.colors.main} tintRefs={tintRefs} />
    </group>
  );
}

function scatterDrops(areas: readonly SpectacleArea[]): Drop[] {
  return Array.from({ length: SKYFALL_COUNT }, (_, index) => {
    const area = areas[index % Math.max(1, areas.length)];
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
  });
}

function placeDrop(
  dummy: Object3D,
  drop: Drop,
  frame: { readonly elapsed: number; readonly fade: number; readonly particle: SkyParticle },
): void {
  const local = frame.elapsed - drop.delay;
  const y = Math.max(drop.floor + LANDING_OFFSET, DROP_HEIGHT - local * drop.speed);
  const landed = y <= drop.floor + LANDING_OFFSET;
  const scale = local > 0 && frame.fade > 0 ? frame.fade : 0;
  // WHY: goo splats flat when it lands; everything else keeps its shape
  const squash = frame.particle === 'goo' && landed ? 0.35 : 1;

  dummy.position.set(drop.x, y, drop.z);
  dummy.rotation.set(local * drop.spin, local * drop.spin * 0.7, 0);
  dummy.scale.set(scale, scale * squash, scale);
  dummy.updateMatrix();
}

function setTintOpacity(materials: readonly (MeshBasicMaterial | null)[], opacity: number): void {
  for (const material of materials) {
    if (material !== null) {
      material.opacity = opacity;
    }
  }
}

function GroundTints(props: {
  readonly areas: readonly SpectacleArea[];
  readonly color: string;
  readonly tintRefs: RefObject<(MeshBasicMaterial | null)[]>;
}): JSX.Element {
  return (
    <>
      {props.areas.map((area, index) => (
        <mesh
          key={index}
          position={[area.center[0], area.center[1] + 0.03, area.center[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[area.size[0], area.size[1]]} />
          <meshBasicMaterial
            ref={(material) => {
              props.tintRefs.current[index] = material;
            }}
            color={props.color}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

function ParticleGeometry(props: { readonly particle: SkyParticle }): JSX.Element {
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

function ParticleMaterial(props: { readonly particle: SkyParticle; readonly colors: Colors }): JSX.Element {
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
