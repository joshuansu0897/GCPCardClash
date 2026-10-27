/**
 * The track's enemy, its crowned boss, hovering beside the island and watching the board. Each
 * track has its own creature family (monolith, wraith, hydra, oracle, golem). It lunges toward the
 * island and flares whenever the Rival lands a card, so its turn reads as the enemy acting.
 */

import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useRef } from 'react';
import type { Group, Mesh, MeshStandardMaterial } from 'three';

import type { EnemyForm, TrackTheme } from '../domain/track-theme';
import { GolemBody } from './golem-body';
import { clamp01, nowSec } from './motion';
import type { ActiveEffect } from './vfx-layer';

const LUNGE_SEC = 0.7;
/** The enemy hovers left of the island: turned toward the board and tipped back toward the high camera. */
const FACING_YAW = 0.55;
const FACING_PITCH = -0.32;
const LUNGE_REACH = 1.4;
const CROWN_Y: Readonly<Record<EnemyForm, number>> = { rack: 1.3, wraith: 1.4, hydra: 1.6, oracle: 0.95, golem: 1.45 };
/** The enemy is drawn half again as large as its model, and sunk to keep it level with the board. */
export const ENEMY_SCALE = 1.55;
const ENEMY_SINK = 0.55;

export interface RivalAvatarProps {
  readonly theme: TrackTheme;
  readonly position: readonly [number, number, number];
  readonly effects: readonly ActiveEffect[];
  readonly reducedMotion: boolean;
}

export function RivalAvatar(props: RivalAvatarProps): JSX.Element {
  const rootRef = useRef<Group>(null);
  const glowRef = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock }) => poseRival(rootRef.current, glowRef.current, props, clock.elapsedTime));

  return (
    <group ref={rootRef} position={props.position as [number, number, number]}>
      <EnemyBody form={props.theme.enemyForm} theme={props.theme} glowRef={glowRef} />
      <BossCrown y={CROWN_Y[props.theme.enemyForm]} glow={props.theme.enemyGlow} />
      <Sparkles count={26} scale={[3.2, 3.2, 2]} size={4} speed={0.5} color={props.theme.enemyGlow} />
    </group>
  );
}

/** Idle bob and sway, plus the lunge toward the island when the Rival lands a card. */
function poseRival(
  root: Group | null,
  glow: MeshStandardMaterial | null,
  props: RivalAvatarProps,
  t: number,
): void {
  if (root === null) {
    return;
  }
  const sway = props.reducedMotion ? 0 : 1;
  const lunge = props.reducedMotion ? 0 : rivalLungeStrength(props.effects);
  const bob = Math.sin(t * 1.3) * 0.18 * sway;

  root.position.set(props.position[0] + lunge * LUNGE_REACH, props.position[1] + bob - ENEMY_SINK, props.position[2]);
  root.rotation.set(FACING_PITCH - lunge * 0.25, FACING_YAW + Math.sin(t * 0.5) * 0.18 * sway, 0);
  root.scale.setScalar(ENEMY_SCALE * (1 + lunge * 0.12));
  if (glow !== null) {
    glow.emissiveIntensity = 1.1 + lunge * 2.5 + Math.sin(t * 3) * 0.25 * sway;
  }
}

/** 0 → 1 → 0 pulse after each Rival deploy or capture. */
function rivalLungeStrength(effects: readonly ActiveEffect[]): number {
  const now = nowSec();
  let strength = 0;
  for (const { event, startsAt } of effects) {
    if ((event.type === 'card-deployed' || event.type === 'slot-captured') && event.owner === 'rival') {
      const t = clamp01((now - startsAt) / LUNGE_SEC);
      if (t > 0 && t < 1) {
        strength = Math.max(strength, Math.sin(t * Math.PI));
      }
    }
  }
  return strength;
}

interface BodyProps {
  readonly form: EnemyForm;
  readonly theme: TrackTheme;
  readonly glowRef: RefObject<MeshStandardMaterial | null>;
}

function EnemyBody(props: BodyProps): JSX.Element {
  switch (props.form) {
    case 'rack':
      return <RackBody {...props} />;
    case 'wraith':
      return <WraithBody {...props} />;
    case 'hydra':
      return <HydraBody {...props} />;
    case 'oracle':
      return <OracleBody {...props} />;
    case 'golem':
      return <GolemBody theme={props.theme} glowRef={props.glowRef} />;
  }
}

function Glow(props: { readonly color: string; readonly glowRef?: BodyProps['glowRef'] }): JSX.Element {
  return (
    <meshStandardMaterial
      ref={props.glowRef}
      color={props.color}
      emissive={props.color}
      emissiveIntensity={1.1}
      toneMapped={false}
    />
  );
}

/** Foundations: The Monolith, a towering black server rack with a slit visor. */
function RackBody(props: BodyProps): JSX.Element {
  const { theme } = props;
  const height = 2.2;
  const ledRows = 7;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[1.1, height, 0.6]} />
        <meshStandardMaterial color="#0F172A" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, height * 0.28, 0.31]}>
        <boxGeometry args={[0.8, 0.12, 0.02]} />
        <Glow color={theme.enemyGlow} glowRef={props.glowRef} />
      </mesh>
      {Array.from({ length: ledRows }, (_, row) => (
        <mesh key={row} position={[-0.28, height * 0.1 - row * 0.17, 0.31]}>
          <boxGeometry args={[0.5, 0.05, 0.02]} />
          <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={row % 2 === 0 ? 0.9 : 0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** Global: the Shadow Admin, a hooded wraith ringed by a slow packet halo. */
function WraithBody(props: BodyProps): JSX.Element {
  const { theme } = props;
  const haloRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (haloRef.current !== null) {
      haloRef.current.rotation.z += delta * 0.8;
    }
  });
  return (
    <group>
      <mesh position={[0, -0.25, 0]} castShadow>
        <coneGeometry args={[0.75, 1.9, 20, 1, true]} />
        <meshStandardMaterial color={theme.enemyBody} roughness={0.8} side={2} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.42, 20, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.6} />
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.36]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <Glow color={theme.enemyGlow} glowRef={x < 0 ? props.glowRef : undefined} />
        </mesh>
      ))}
      <mesh ref={haloRef} position={[0, 0.85, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.85, 0.035, 8, 40, Math.PI * 1.6]} />
        <Glow color={theme.enemyGlow} />
      </mesh>
    </group>
  );
}

/** Serverless & Data: the Data Swamp, a three-headed backlog hydra. */
function HydraBody(props: BodyProps): JSX.Element {
  const { theme } = props;
  const headsRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    headsRef.current?.children.forEach((neck, index) => {
      neck.rotation.z = (index - 1) * 0.5 + Math.sin(clock.elapsedTime * 1.6 + index * 1.7) * 0.15;
    });
  });
  return (
    <group>
      <mesh position={[0, -0.45, 0]} scale={[1, 0.7, 1]} castShadow>
        <sphereGeometry args={[0.8, 20, 16]} />
        <meshStandardMaterial color={theme.enemyBody} roughness={0.35} metalness={0.1} />
      </mesh>
      <group ref={headsRef}>
        {[0, 1, 2].map((index) => (
          <group key={index} position={[0, -0.2, 0]} rotation={[0, 0, (index - 1) * 0.5]}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.12, 0.18, 1.1, 10]} />
              <meshStandardMaterial color={theme.enemyBody} roughness={0.35} />
            </mesh>
            <mesh position={[0, 1.15, 0.08]}>
              <sphereGeometry args={[0.24, 14, 12]} />
              <meshStandardMaterial color={theme.enemyBody} roughness={0.35} />
            </mesh>
            <mesh position={[0, 1.2, 0.3]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <Glow color={theme.enemyGlow} glowRef={index === 1 ? props.glowRef : undefined} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Agent Platform & GenAI: the Hallucinator, an all-seeing oracle eye orbited by glitch cubes. */
function OracleBody(props: BodyProps): JSX.Element {
  const { theme } = props;
  const orbitRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (orbitRef.current !== null) {
      orbitRef.current.rotation.y += delta * 1.1;
    }
  });
  const cubes = 8;
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.7, 28, 20]} />
        <meshStandardMaterial color={theme.enemyBody} roughness={0.15} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.6]}>
        <circleGeometry args={[0.36, 28]} />
        <Glow color={theme.enemyGlow} glowRef={props.glowRef} />
      </mesh>
      <mesh position={[0, 0, 0.62]}>
        <circleGeometry args={[0.15, 20]} />
        <meshBasicMaterial color="#0F172A" />
      </mesh>
      <group ref={orbitRef}>
        {Array.from({ length: cubes }, (_, index) => {
          const angle = (index / cubes) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 1.2, Math.sin(angle * 2) * 0.3, Math.sin(angle) * 1.2]}>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
              <Glow color={index % 2 === 0 ? theme.enemyGlow : '#22D3EE'} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function BossCrown(props: { readonly y: number; readonly glow: string }): JSX.Element {
  return (
    <group position={[0, props.y, 0]}>
      <mesh>
        <cylinderGeometry args={[0.42, 0.48, 0.2, 10, 1, true]} />
        <meshStandardMaterial color="#FBBF24" metalness={0.8} roughness={0.25} side={2} />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.44, 0.2, Math.sin(angle) * 0.44]}>
            <coneGeometry args={[0.08, 0.24, 5]} />
            <meshStandardMaterial color="#FBBF24" metalness={0.8} roughness={0.25} />
          </mesh>
        );
      })}
      <pointLight color={props.glow} intensity={6} distance={5} />
    </group>
  );
}
