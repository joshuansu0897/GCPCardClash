/**
 * Flyover: a saucer crosses the island, slowing over it to sweep a scanner beam across the
 * struck pads, which light up as the beam passes.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useMemo, useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';

import type { Vec3 } from '../../domain/board-layout';
import { clamp01, easeInQuad, easeOutCubic, nowSec } from '../motion';
import { type Colors, SPECTACLE_DURATION_SEC, type SpectacleProps, pickPoints } from './spectacle-kit';

const SAUCER_LIGHTS = 10;

interface SaucerRefs {
  readonly ship: RefObject<Group | null>;
  readonly lights: RefObject<Group | null>;
  readonly beamMat: RefObject<MeshBasicMaterial | null>;
  readonly shipX: { current: number };
}

export function Flyover(props: SpectacleProps & { readonly dark: boolean }): JSX.Element {
  const halfSpan = props.islandWidth / 2 + 5;
  const refs: SaucerRefs = {
    ship: useRef<Group>(null),
    lights: useRef<Group>(null),
    beamMat: useRef<MeshBasicMaterial>(null),
    shipX: useRef<number>(-halfSpan),
  };
  const scanTargets = useMemo(
    () => (props.struckPoints.length > 0 ? props.struckPoints : pickPoints(props.areas, [], 6)),
    [props.areas, props.struckPoints],
  );

  useFrame(({ clock }) => {
    const t = clamp01((nowSec() - props.startsAt) / (SPECTACLE_DURATION_SEC - 0.2));
    updateSaucerFrame(refs, { t, halfSpan, clockSec: clock.elapsedTime });
  });

  return (
    <group>
      <Saucer refs={refs} colors={props.colors} dark={props.dark} />
      {scanTargets.map((point, index) => (
        <ScanMark key={index} point={point} shipX={refs.shipX} color={props.colors.main} />
      ))}
    </group>
  );
}

/** Ease in, slow down over the island to scan, then accelerate away. */
function flightProgress(t: number): number {
  return t < 0.5 ? 0.5 * easeOutCubic(t * 2) : 0.5 + 0.5 * easeInQuad((t - 0.5) * 2);
}

function updateSaucerFrame(
  refs: SaucerRefs,
  frame: { readonly t: number; readonly halfSpan: number; readonly clockSec: number },
): void {
  const ship = refs.ship.current;
  if (ship === null) {
    return;
  }
  const { t, halfSpan, clockSec } = frame;

  // Move the ship along its arc
  refs.shipX.current = -halfSpan + flightProgress(t) * halfSpan * 2;
  ship.visible = t > 0 && t < 1;
  ship.position.set(refs.shipX.current, 4.4 + Math.sin(clockSec * 3) * 0.12, Math.sin(t * Math.PI) * 1.2 - 0.6);
  ship.rotation.set(0, 0, Math.cos(t * Math.PI) * 0.12);

  // Spin the rim lights and pulse the beam while over the island
  if (refs.lights.current !== null) {
    refs.lights.current.rotation.y += 0.08;
  }
  if (refs.beamMat.current !== null) {
    const scanning = t > 0.18 && t < 0.82;
    refs.beamMat.current.opacity = scanning ? 0.28 + Math.sin(clockSec * 14) * 0.05 : 0;
  }
}

function Saucer(props: { readonly refs: SaucerRefs; readonly colors: Colors; readonly dark: boolean }): JSX.Element {
  const { refs, colors } = props;

  return (
    <group ref={refs.ship} visible={false}>
      <mesh scale={[1.7, 0.32, 1.7]} castShadow>
        <sphereGeometry args={[1, 28, 16]} />
        <meshStandardMaterial color={props.dark ? '#111827' : '#CBD5E1'} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.62, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={colors.main} emissive={colors.main} emissiveIntensity={0.9} transparent opacity={0.85} />
      </mesh>
      <group ref={refs.lights}>
        {Array.from({ length: SAUCER_LIGHTS }, (_, index) => {
          const angle = (index / SAUCER_LIGHTS) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 1.45, -0.05, Math.sin(angle) * 1.45]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshBasicMaterial color={index % 2 === 0 ? colors.accent : colors.main} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, -2.25, 0]}>
        <cylinderGeometry args={[0.35, 1.5, 4.2, 24, 1, true]} />
        <meshBasicMaterial ref={refs.beamMat} color={colors.main} transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight position={[0, -1, 0]} color={colors.main} intensity={10} distance={7} />
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
