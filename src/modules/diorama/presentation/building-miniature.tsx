/**
 * Glossy toy-like miniatures that pop onto a pad when a GCP service is deployed.
 * The archetype comes from the card category; the body uses the card's subsystem ink
 * and accents use the owning architect's colour.
 */

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, useRef } from 'react';
import { DoubleSide, type Group, type Mesh } from 'three';

import type { PlayerActor } from '../../battle';
import type { BuildingArchetype } from '../domain/board-layout';
import { OWNER_HEX, usePopIn } from './motion';

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
      {renderArchetype(props.archetype, props.bodyHex, accent, props.reducedMotion)}
    </group>
  );
}

function renderArchetype(
  archetype: BuildingArchetype,
  body: string,
  accent: string,
  reducedMotion: boolean,
): JSX.Element {
  switch (archetype) {
    case 'rack':
      return <ServerRacks body={body} accent={accent} />;
    case 'vault':
      return <DatabaseVault body={body} accent={accent} />;
    case 'silo':
      return <AnalyticsSilos body={body} accent={accent} />;
    case 'tower':
      return <EdgeTower body={body} accent={accent} reducedMotion={reducedMotion} />;
    case 'crystal':
      return <AiCrystalCore body={body} accent={accent} reducedMotion={reducedMotion} />;
    case 'bastion':
      return <Bastion body={body} accent={accent} />;
  }
}

function Glossy(props: { readonly color: string; readonly emissive?: number }): JSX.Element {
  return (
    <meshStandardMaterial
      color={props.color}
      roughness={0.32}
      metalness={0.08}
      emissive={props.color}
      emissiveIntensity={props.emissive ?? 0}
    />
  );
}

interface PartProps {
  readonly body: string;
  readonly accent: string;
}

function ServerRacks(props: PartProps): JSX.Element {
  const racks: readonly (readonly [number, number])[] = [
    [-0.45, 1.1],
    [0, 1.35],
    [0.45, 0.95],
  ];
  return (
    <group>
      {racks.map(([x, h]) => (
        <group key={x} position={[x, 0, 0]}>
          <RoundedBox args={[0.36, h, 0.7]} radius={0.06} position={[0, h / 2, 0]} castShadow>
            <Glossy color={props.body} />
          </RoundedBox>
          {[0.25, 0.5, 0.75].map((f) => (
            <mesh key={f} position={[0, h * f, 0.36]}>
              <boxGeometry args={[0.26, 0.05, 0.02]} />
              <Glossy color={props.accent} emissive={1.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function DatabaseVault(props: PartProps): JSX.Element {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.2 + i * 0.36, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.3, 28]} />
            <Glossy color={props.body} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[0.5, 0.025, 8, 32]} />
            <Glossy color={props.accent} emissive={1.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AnalyticsSilos(props: PartProps): JSX.Element {
  return (
    <group>
      {([
        [-0.35, 1.2],
        [0.38, 0.9],
      ] as const).map(([x, h]) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, h, 20]} />
            <Glossy color={props.body} />
          </mesh>
          <mesh position={[0, h + 0.17, 0]} castShadow>
            <coneGeometry args={[0.32, 0.34, 20]} />
            <Glossy color={props.accent} emissive={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.75, 10]} />
        <Glossy color="#E2E8F0" />
      </mesh>
    </group>
  );
}

function EdgeTower(props: PartProps & { readonly reducedMotion: boolean }): JSX.Element {
  const dishRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (dishRef.current !== null && !props.reducedMotion) {
      dishRef.current.rotation.y += delta * 0.9;
    }
  });

  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.32, 1.6, 6]} />
        <Glossy color={props.body} />
      </mesh>
      <group ref={dishRef} position={[0, 1.7, 0]}>
        <mesh rotation={[-Math.PI / 3, 0, 0]} castShadow>
          <sphereGeometry args={[0.48, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.25} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.12, 0.22]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <Glossy color={props.accent} emissive={1.6} />
        </mesh>
      </group>
    </group>
  );
}

function AiCrystalCore(props: PartProps & { readonly reducedMotion: boolean }): JSX.Element {
  const crystalRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const crystal = crystalRef.current;
    if (crystal === null || props.reducedMotion) {
      return;
    }
    crystal.rotation.y = clock.elapsedTime * 0.8;
    crystal.position.y = 1.15 + Math.sin(clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.36, 8]} />
        <Glossy color="#F1F5F9" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <torusGeometry args={[0.42, 0.04, 8, 32]} />
        <Glossy color={props.accent} emissive={1.4} />
      </mesh>
      <mesh ref={crystalRef} position={[0, 1.15, 0]} castShadow>
        <octahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial
          color={props.body}
          emissive={props.body}
          emissiveIntensity={0.9}
          roughness={0.1}
          metalness={0.2}
          flatShading
          transparent
          opacity={0.92}
        />
      </mesh>
    </group>
  );
}

function Bastion(props: PartProps): JSX.Element {
  return (
    <group>
      <RoundedBox args={[1.2, 0.8, 1]} radius={0.08} position={[0, 0.4, 0]} castShadow>
        <Glossy color={props.body} />
      </RoundedBox>
      {[-0.45, -0.15, 0.15, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.92, 0.38]} castShadow>
          <boxGeometry args={[0.18, 0.24, 0.18]} />
          <Glossy color={props.accent} emissive={0.3} />
        </mesh>
      ))}
    </group>
  );
}
