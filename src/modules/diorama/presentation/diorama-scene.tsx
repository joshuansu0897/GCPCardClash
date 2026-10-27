/**
 * R3F scene graph for the Cloud Diorama: track-themed lighting and sky, fitted camera rig,
 * floating island, slot pads, flow roads, the track's enemy, and transient VFX. Rendered inside `<Canvas>` by `DioramaBoard`.
 */

import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { type JSX, type ReactNode, useMemo, useRef } from 'react';
import type { Group } from 'three';

import { type MatchState, getIncidentCard } from '../../battle';
import type { ArchitectureBlueprint, ArchitectureSlot, CatalogCard } from '../../catalog';
import type { IslandLayout } from '../domain/board-layout';
import type { TrackTheme } from '../domain/track-theme';
import { resolvePadAffordance } from '../domain/pad-affordance';
import { computeTerraceDecor } from '../domain/terrace-decor';
import type { CameraFrame, ViewInsets } from '../domain/camera-fit';
import { FittedCameraRig } from './fitted-camera-rig';
import { FloatingIsland, SkyClouds } from './floating-island';
import { type LabelAnchor, LabelProjector, type LabelRegistry } from './label-overlay';
import { nowSec } from './motion';
import { RivalAvatar } from './rival-avatar';
import { RoadFlowPipes } from './road-flow-pipes';
import { SlotPad } from './slot-pad';
import { TerraceDecor } from './terrace-decor';
import { type ActiveEffect, TOSS_DURATION_SEC, VfxLayer } from './vfx-layer';

const SHAKE_WINDOW_SEC = 0.32;
/** Incidents that rattle the island while they hit: [start, end] seconds after the strike. */
const RUMBLE_WINDOW_SEC = [0.8, 3.2] as const;

export interface DioramaSceneProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly layout: IslandLayout;
  readonly theme: TrackTheme;
  /** Where the track's enemy hovers; `null` hides it (Guided Study has no opponent). */
  readonly rivalAnchor: readonly [number, number, number] | null;
  /** What the camera frames: the island, plus room for the enemy beside it. */
  readonly cameraFrame: CameraFrame;
  /** HUD panels covering the board's edges; `undefined` when the board is embedded in the page. */
  readonly viewInsets: ViewInsets | undefined;
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
  const { layout, matchState, blueprint, theme } = props;
  const slotsById = new Map(blueprint.slots.map((s) => [s.id, s]));
  const [width, depth] = layout.islandSize;
  const decor = useMemo(() => computeTerraceDecor(layout), [layout]);

  return (
    <>
      <SceneLights theme={theme} />

      <FittedCameraRig frame={props.cameraFrame} insets={props.viewInsets} />
      <LabelProjector anchors={props.labelAnchors} registry={props.labelRegistry} />

      <IslandRoot effects={props.effects} reducedMotion={props.reducedMotion}>
        <FloatingIsland
          size={layout.islandSize}
          terraces={layout.terraces}
          theme={theme}
          reducedMotion={props.reducedMotion}
        />
        <TerraceDecor decor={decor} foliage={theme.grass} />
        <RoadFlowPipes roads={layout.roads} slots={matchState.slots} reducedMotion={props.reducedMotion} />

        <PadField scene={props} slotsById={slotsById} />

        <VfxLayer
          effects={props.effects}
          padsBySlotId={layout.padsBySlotId}
          terraces={layout.terraces}
          islandWidth={width}
          cardsById={props.cardsById}
          onDone={props.onEffectDone}
        />
      </IslandRoot>

      {props.rivalAnchor !== null && (
        <RivalAvatar
          theme={theme}
          position={props.rivalAnchor}
          effects={props.effects}
          reducedMotion={props.reducedMotion}
        />
      )}

      <SceneAtmosphere theme={theme} width={width} depth={depth} reducedMotion={props.reducedMotion} />
    </>
  );
}

function SceneLights(props: { readonly theme: TrackTheme }): JSX.Element {
  const { theme } = props;

  return (
    <>
      <hemisphereLight args={[theme.hemisphereSky, theme.hemisphereGround, 0.85]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        color={theme.sunColor}
        position={[9, 16, 8]}
        intensity={theme.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
    </>
  );
}

function PadField(props: {
  readonly scene: DioramaSceneProps;
  readonly slotsById: ReadonlyMap<string, ArchitectureSlot>;
}): JSX.Element {
  const { scene, slotsById } = props;

  return (
    <>
      {scene.layout.pads.map((pad) => {
        const slot = slotsById.get(pad.slotId);
        if (slot === undefined) {
          return null;
        }
        return (
          <SlotPad
            key={pad.slotId}
            placement={pad}
            slot={slot}
            slotState={scene.matchState.slots[pad.slotId]}
            cardsById={scene.cardsById}
            affordance={resolvePadAffordance(scene.matchState, pad.slotId, scene.selectedHandCard)}
            isInspected={scene.inspectedSlotId === pad.slotId}
            popDelaySec={scene.popDelays[pad.slotId] ?? 0}
            reducedMotion={scene.reducedMotion}
            onInspectSlot={scene.onInspectSlot}
            onTargetSlot={scene.onTargetSlot}
          />
        );
      })}
    </>
  );
}

function SceneAtmosphere(props: {
  readonly theme: TrackTheme;
  readonly width: number;
  readonly depth: number;
  readonly reducedMotion: boolean;
}): JSX.Element {
  const { theme, width, depth } = props;

  return (
    <>
      <Sparkles
        count={props.reducedMotion ? 0 : theme.ambient.count}
        scale={[width + 8, 9, depth + 8]}
        position={[0, 2.5, 0]}
        size={theme.ambient.size}
        speed={theme.ambient.speed}
        color={theme.ambient.color}
      />
      <SkyClouds
        spread={width}
        color={theme.cloud}
        opacity={theme.cloudOpacity}
        reducedMotion={props.reducedMotion}
      />
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
    const shake = Math.max(0, ...props.effects.map((effect) => effectShake(effect, now)));
    group.position.set(shake * Math.sin(now * 90), shake * Math.cos(now * 70) * 0.5, shake * Math.cos(now * 80));
  });

  return <group ref={ref}>{props.children}</group>;
}

/** How hard one active effect rattles the island right now (0 when it does not). */
function effectShake({ event, startsAt }: ActiveEffect, now: number): number {
  if (event.type === 'incident-struck') {
    const kind = getIncidentCard(event.incidentId)?.manifestation.kind;
    const since = now - startsAt;
    const rumbles = kind === 'meteor-shower' || kind === 'lightning';
    return rumbles && since > RUMBLE_WINDOW_SEC[0] && since < RUMBLE_WINDOW_SEC[1] ? 0.05 : 0;
  }
  if (event.type !== 'card-deployed' && event.type !== 'slot-captured') {
    return 0;
  }

  const sinceImpact = now - (startsAt + TOSS_DURATION_SEC);
  if (sinceImpact < 0 || sinceImpact >= SHAKE_WINDOW_SEC) {
    return 0;
  }
  const strength = event.type === 'slot-captured' ? 0.16 : 0.07;
  return strength * (1 - sinceImpact / SHAKE_WINDOW_SEC);
}
