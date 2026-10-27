/**
 * Meteor shower: burning rocks streak down onto the struck pads (then the zone around them),
 * each ending in a blast, a shock ring and a flash of light.
 */

import { useFrame } from '@react-three/fiber';
import { type JSX, type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import { type Group, type Mesh, type MeshBasicMaterial, type PointLight, Vector3 } from 'three';

import type { Vec3 } from '../../domain/board-layout';
import { clamp01, easeInQuad, easeOutCubic, nowSec } from '../motion';
import { type Colors, type SpectacleProps, pickPoints, setFlash } from './spectacle-kit';

const METEOR_FALL_SEC = 0.75;
const BLAST_SEC = 0.7;

export function MeteorShower(props: SpectacleProps): JSX.Element {
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

interface MeteorRefs {
  readonly rock: RefObject<Group | null>;
  readonly blast: RefObject<Mesh | null>;
  readonly blastMat: RefObject<MeshBasicMaterial | null>;
  readonly ring: RefObject<Mesh | null>;
  readonly ringMat: RefObject<MeshBasicMaterial | null>;
  readonly light: RefObject<PointLight | null>;
}

interface MeteorPath {
  readonly from: Vector3;
  readonly to: Vector3;
  readonly big: boolean;
}

function Meteor(props: {
  readonly target: Vec3;
  readonly startsAt: number;
  readonly colors: Colors;
  readonly big: boolean;
}): JSX.Element {
  const refs: MeteorRefs = {
    rock: useRef<Group>(null),
    blast: useRef<Mesh>(null),
    blastMat: useRef<MeshBasicMaterial>(null),
    ring: useRef<Mesh>(null),
    ringMat: useRef<MeshBasicMaterial>(null),
    light: useRef<PointLight>(null),
  };
  const [tx, ty, tz] = props.target;
  const from = useMemo(() => new Vector3(tx - 5, ty + 11, tz - 4), [tx, ty, tz]);
  const to = useMemo(() => new Vector3(tx, ty + 0.2, tz), [tx, ty, tz]);

  useLayoutEffect(() => {
    refs.rock.current?.lookAt(to.clone().sub(from).add(refs.rock.current.position));
  }, [from, to]);
  useFrame(() => updateMeteorFrame(refs, { from, to, big: props.big }, nowSec() - props.startsAt));

  return (
    <group>
      <MeteorRock rockRef={refs.rock} size={props.big ? 0.42 : 0.26} colors={props.colors} />
      <mesh ref={refs.blast} position={to} visible={false}>
        <sphereGeometry args={[0.6, 16, 12]} />
        <meshBasicMaterial ref={refs.blastMat} color={props.colors.accent} transparent depthWrite={false} />
      </mesh>
      <mesh ref={refs.ring} position={[tx, ty + 0.08, tz]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.6, 0.85, 36]} />
        <meshBasicMaterial ref={refs.ringMat} color={props.colors.main} transparent depthWrite={false} />
      </mesh>
      <pointLight ref={refs.light} position={[tx, ty + 1, tz]} color={props.colors.main} intensity={0} distance={6} />
    </group>
  );
}

function MeteorRock(props: {
  readonly rockRef: RefObject<Group | null>;
  readonly size: number;
  readonly colors: Colors;
}): JSX.Element {
  const { size, colors } = props;

  return (
    <group ref={props.rockRef} visible={false}>
      <mesh>
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial color="#44403C" emissive={colors.main} emissiveIntensity={1.4} flatShading />
      </mesh>
      <mesh position={[0, 0, -size * 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size * 0.95, size * 6, 12, 1, true]} />
        <meshBasicMaterial color={colors.accent} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

function updateMeteorFrame(refs: MeteorRefs, path: MeteorPath, elapsed: number): void {
  // Fly the rock in
  const fall = clamp01(elapsed / METEOR_FALL_SEC);
  const rock = refs.rock.current;
  if (rock !== null) {
    rock.visible = elapsed >= 0 && fall < 1;
    rock.position.lerpVectors(path.from, path.to, easeInQuad(fall));
  }

  // Blow up on impact
  const blast = clamp01((elapsed - METEOR_FALL_SEC) / BLAST_SEC);
  const impacted = elapsed >= METEOR_FALL_SEC && blast < 1;
  const grow = easeOutCubic(blast);
  setFlash(refs.blast.current, refs.blastMat.current, impacted, 0.2 + grow * (path.big ? 1.8 : 1.1), 0.9 * (1 - blast));
  setFlash(refs.ring.current, refs.ringMat.current, impacted, 0.3 + grow * (path.big ? 3 : 2), 0.8 * (1 - blast));
  if (refs.light.current !== null) {
    refs.light.current.intensity = impacted ? 30 * (1 - blast) : 0;
  }
}
