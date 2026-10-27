/**
 * CC0 low-poly models (Kenney kits, optimized into `public/models`) and the component that
 * stands one on the island: cloned per use, fitted to a target footprint, resting on y = 0,
 * casting shadows, and playing a looped animation when the model has one.
 */

import { useAnimations, useGLTF } from '@react-three/drei';
import { type JSX, useEffect, useMemo, useRef } from 'react';
import { Box3, type Group, type Mesh, Vector3 } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { ContextNodeKind } from '../../catalog';
import type { BuildingArchetype } from '../domain/board-layout';
import type { DecorKind } from '../domain/terrace-decor';

export type KitModelName =
  | 'industrial-building-a'
  | 'industrial-building-e'
  | 'industrial-building-k'
  | 'industrial-tank-large'
  | 'industrial-tank'
  | 'industrial-container-a'
  | 'industrial-windmill'
  | 'industrial-solar-panel'
  | 'commercial-building-c'
  | 'commercial-skyscraper-c'
  | 'space-satellite-dish'
  | 'space-desk-computer'
  | 'space-wireless'
  | 'td-tower-crystals'
  | 'td-tower-square'
  | 'td-crystal'
  | 'td-rocks'
  | 'nature-tree-default'
  | 'nature-tree-oak'
  | 'nature-pine'
  | 'nature-bush'
  | 'nature-flowers'
  | 'mini-character-female-b'
  | 'mini-character-male-a';

/** What a deployed GCP service looks like, by building archetype. */
export const BUILDING_MODEL: Readonly<Record<BuildingArchetype, KitModelName>> = {
  rack: 'commercial-skyscraper-c',
  vault: 'industrial-tank-large',
  silo: 'industrial-building-e',
  tower: 'space-satellite-dish',
  crystal: 'td-tower-crystals',
  bastion: 'td-tower-square',
};

/** The models that stand for each kind of context actor (users get a small crowd). */
export const ACTOR_MODELS: Readonly<Record<ContextNodeKind, readonly KitModelName[]>> = {
  users: ['mini-character-female-b', 'mini-character-male-a'],
  browser: ['space-desk-computer'],
  devices: ['space-wireless'],
  'on-prem': ['industrial-building-k'],
  partner: ['commercial-building-c'],
  service: ['industrial-building-a'],
};

/** District props by decor kind; trees pick one of several species. */
export const DECOR_MODELS: Readonly<Record<DecorKind, readonly KitModelName[]>> = {
  tree: ['nature-tree-default', 'nature-tree-oak', 'nature-pine', 'nature-bush'],
  rack: ['industrial-container-a', 'industrial-solar-panel'],
  tank: ['industrial-tank'],
  antenna: ['space-wireless', 'industrial-windmill'],
  bollard: ['td-rocks'],
  crystal: ['td-crystal'],
};

export function kitModelUrl(name: KitModelName): string {
  return `${import.meta.env.BASE_URL}models/${name}.glb`;
}

/** Starts downloading every model the board can show, so the first deploy does not wait. */
export function preloadKitModels(): void {
  const names = new Set<KitModelName>([
    ...Object.values(BUILDING_MODEL),
    ...Object.values(ACTOR_MODELS).flat(),
    ...Object.values(DECOR_MODELS).flat(),
  ]);
  names.forEach((name) => useGLTF.preload(kitModelUrl(name), false));
}

export interface KitModelProps {
  readonly name: KitModelName;
  /** Widest horizontal extent the model is scaled to, in world units. */
  readonly width: number;
  /** Looped animation clip to play, when the model has one (e.g. `idle`). */
  readonly animation?: string;
}

export function KitModel(props: KitModelProps): JSX.Element {
  const gltf = useGLTF(kitModelUrl(props.name), false);
  const rootRef = useRef<Group>(null);
  const model = useMemo(() => fitClone(gltf.scene, props.width), [gltf.scene, props.width]);
  const { actions } = useAnimations(gltf.animations, rootRef);

  // Loop the requested clip, if any
  useEffect(() => {
    const action = props.animation !== undefined ? actions[props.animation] : undefined;
    action?.reset().fadeIn(0.2).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, props.animation]);

  return (
    <group ref={rootRef}>
      <primitive object={model} />
    </group>
  );
}

/** A shadow-casting copy of `source`, scaled to `width` and centred on its base. */
function fitClone(source: Group, width: number): Group {
  const copy = cloneSkinned(source) as Group;
  copy.traverse((child) => {
    if ((child as Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const box = new Box3().setFromObject(copy);
  const size = box.getSize(new Vector3());
  const scale = width / Math.max(size.x, size.z, 1e-3);
  copy.scale.setScalar(scale);
  copy.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
  return copy;
}
