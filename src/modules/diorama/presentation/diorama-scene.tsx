/**
 * R3F scene graph for the Cloud Diorama: lighting, fitted camera rig, floating island,
 * slot pads, flow roads, and transient VFX. Rendered inside `<Canvas>` by `DioramaBoard`.
 */

import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { type JSX, type ReactNode, useEffect, useRef } from 'react';
import { type Group, MathUtils, PerspectiveCamera, Vector3 } from 'three';

import type { MatchState } from '../../battle';
import type { ArchitectureBlueprint, CatalogCard } from '../../catalog';
import type { IslandLayout } from '../domain/board-layout';
import { resolvePadAffordance } from '../domain/pad-affordance';
import { FloatingIsland, SkyClouds } from './floating-island';
import { type LabelAnchor, LabelProjector, type LabelRegistry } from './label-overlay';
import { nowSec } from './motion';
import { RoadFlowPipes } from './road-flow-pipes';
import { SlotPad } from './slot-pad';
import { type ActiveEffect, TOSS_DURATION_SEC, VfxLayer } from './vfx-layer';

const CAMERA_DIRECTION = new Vector3(0, 0.62, 0.8).normalize();
const SHAKE_WINDOW_SEC = 0.32;

export interface DioramaSceneProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly layout: IslandLayout;
  readonly matchState: MatchState;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly effects: readonly ActiveEffect[];
  readonly popDelays: Readonly<Record<string, number>>;
  readonly reducedMotion: boolean;
  readonly labelAnchors: readonly LabelAnchor[];
  readonly labelRegistry: LabelRegistry;
  readonly onEffectDone: (eventId: string) => void;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

export function DioramaScene(props: DioramaSceneProps): JSX.Element {
  const { layout, matchState, blueprint } = props;
  const slotsById = new Map(blueprint.slots.map((s) => [s.id, s]));

  return (
    <>
      <hemisphereLight args={['#E0F2FE', '#FDE68A', 0.85]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[9, 16, 8]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />

      <FittedCameraRig size={layout.islandSize} />
      <LabelProjector anchors={props.labelAnchors} registry={props.labelRegistry} />

      <IslandRoot effects={props.effects} reducedMotion={props.reducedMotion}>
        <FloatingIsland size={layout.islandSize} terraces={layout.terraces} reducedMotion={props.reducedMotion} />
        <RoadFlowPipes roads={layout.roads} slots={matchState.slots} reducedMotion={props.reducedMotion} />

        {layout.pads.map((pad) => {
          const slot = slotsById.get(pad.slotId);
          if (slot === undefined) {
            return null;
          }
          const slotState = matchState.slots[pad.slotId];
          return (
            <SlotPad
              key={pad.slotId}
              placement={pad}
              slot={slot}
              slotState={slotState}
              cardsById={props.cardsById}
              affordance={resolvePadAffordance(matchState, pad.slotId, props.selectedHandCard)}
              isInspected={props.inspectedSlotId === pad.slotId}
              popDelaySec={props.popDelays[pad.slotId] ?? 0}
              reducedMotion={props.reducedMotion}
              onInspectSlot={props.onInspectSlot}
              onTargetSlot={props.onTargetSlot}
            />
          );
        })}

        <VfxLayer
          effects={props.effects}
          padsBySlotId={layout.padsBySlotId}
          cardsById={props.cardsById}
          onDone={props.onEffectDone}
        />
      </IslandRoot>

      <SkyClouds spread={layout.islandSize[0]} reducedMotion={props.reducedMotion} />
    </>
  );
}

/**
 * Short shake whenever a card lands or a node is captured. There is deliberately no idle bob:
 * the pad labels are real DOM buttons and must hold still to stay easy to click.
 */
function IslandRoot(props: {
  readonly effects: readonly ActiveEffect[];
  readonly reducedMotion: boolean;
  readonly children: ReactNode;
}): JSX.Element {
  const ref = useRef<Group>(null);

  useFrame(() => {
    const group = ref.current;
    if (group === null || props.reducedMotion) {
      return;
    }
    const now = nowSec();
    let shake = 0;
    for (const { event, startsAt } of props.effects) {
      if (event.type !== 'card-deployed' && event.type !== 'slot-captured') {
        continue;
      }
      const sinceImpact = now - (startsAt + TOSS_DURATION_SEC);
      if (sinceImpact >= 0 && sinceImpact < SHAKE_WINDOW_SEC) {
        const strength = event.type === 'slot-captured' ? 0.16 : 0.07;
        shake = Math.max(shake, strength * (1 - sinceImpact / SHAKE_WINDOW_SEC));
      }
    }
    group.position.set(shake * Math.sin(now * 90), shake * Math.cos(now * 70) * 0.5, shake * Math.cos(now * 80));
  });

  return <group ref={ref}>{props.children}</group>;
}

/** Positions the camera so the whole island fits the viewport at any aspect ratio. */
function FittedCameraRig(props: { readonly size: readonly [number, number] }): JSX.Element {
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.size);
  const controls = useThree((state) => state.controls) as unknown as { update: () => void } | null;
  const [width, depth] = props.size;

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const aspect = viewport.width / Math.max(1, viewport.height);
    const vFov = MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const fitWidth = (width / 2 + 1.2) / Math.tan(hFov / 2);
    const fitDepth = (depth / 2 + 1.4) / Math.tan(vFov / 2);
    const distance = Math.max(fitWidth, fitDepth) + depth * 0.25;

    camera.position.copy(CAMERA_DIRECTION).multiplyScalar(distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controls?.update();
  }, [camera, controls, viewport.width, viewport.height, width, depth]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      enableDamping
      minPolarAngle={0.45}
      maxPolarAngle={1.1}
      minAzimuthAngle={-0.7}
      maxAzimuthAngle={0.7}
      target={[0, 0, 0]}
    />
  );
}
