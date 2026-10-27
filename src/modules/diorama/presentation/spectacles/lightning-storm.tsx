/**
 * Lightning: forked bolts strike the struck pads (then the zone around them), each flashing
 * twice and lighting up the ground.
 */

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, useMemo, useRef } from 'react';
import type { Group, PointLight } from 'three';

import type { Vec3 } from '../../domain/board-layout';
import { nowSec } from '../motion';
import { type Colors, type SpectacleProps, hash01, pickPoints } from './spectacle-kit';

export function LightningStorm(props: SpectacleProps): JSX.Element {
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
