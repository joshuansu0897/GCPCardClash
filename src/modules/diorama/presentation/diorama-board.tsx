/**
 * Cloud Diorama playboard: blueprint banner, targeting guidance, and the R3F canvas.
 * Drop-in replacement for the 2D drafting sheet — same callbacks, same match state.
 */

import { Canvas } from '@react-three/fiber';
import { type CSSProperties, type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type MatchState, resolveRivalForTrack } from '../../battle';
import type { ArchitectureBlueprint, CatalogCard } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { type BoardEvent, diffBoardEvents } from '../domain/board-events';
import { type IslandLayout, PAD_SIZE, computeIslandLayout } from '../domain/board-layout';
import { resolvePadAffordance } from '../domain/pad-affordance';
import { type TrackTheme, resolveTrackTheme } from '../domain/track-theme';
import { DioramaScene } from './diorama-scene';
import { ENEMY_SCALE } from './rival-avatar';
import { type ViewInsets, computeBoardFrame } from '../domain/camera-fit';
import { type LabelAnchor, PadLabel, useLabelRegistry } from './label-overlay';
import { nowSec, usePrefersReducedMotion } from './motion';
import { type ActiveEffect, TOSS_DURATION_SEC } from './vfx-layer';

const EFFECT_STAGGER_SEC = 0.4;
type LabelBinder = ReturnType<typeof useLabelRegistry>['bind'];
/** The enemy hovers just off the island's front-left edge, facing the board. */
const RIVAL_HOVER_HEIGHT = 1.8;
const RIVAL_SIDE_GAP = 1.8;
const RIVAL_DEPTH = 0.6;

export interface DioramaBoardProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
  /** Set when the board fills the screen behind a HUD: the screen space each HUD edge covers. */
  readonly viewInsets?: ViewInsets;
}

export function DioramaBoard(props: DioramaBoardProps): JSX.Element {
  const { blueprint, matchState } = props;
  const stage = useDioramaStage(blueprint, matchState);
  const { layout, theme, hasRival } = stage;
  const { registry, bind } = useLabelRegistry();
  const rival = resolveRivalForTrack(blueprint.trackId);

  return (
    <section
      className={`drafting-sheet diorama-sheet ${props.viewInsets !== undefined ? 'is-immersive' : ''}`}
      aria-label="3D Architecture Diorama Playboard">
      <DioramaTitleBar blueprint={blueprint} />
      <DioramaGuidance selectedHandCard={props.selectedHandCard} mode={matchState.mode} />

      <div className={`diorama-stage theme-${theme.trackId}`} style={themeStageStyle(theme)} data-theme-name={theme.name}>
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 36, near: 0.1, far: 200, position: [0, 18, 16] }}
        >
          <DioramaScene
            {...props}
            layout={layout}
            theme={theme}
            rivalAnchor={hasRival ? stage.rivalAnchor : null}
            cameraFrame={stage.cameraFrame}
            viewInsets={props.viewInsets}
            effects={stage.effects}
            popDelays={stage.popDelays}
            reducedMotion={stage.reducedMotion}
            labelAnchors={stage.labelAnchors}
            labelRegistry={registry}
            onEffectDone={stage.dismissEffect}
          />
        </Canvas>

        <DioramaLabels board={props} layout={layout} rivalName={hasRival ? rival.name : null} bind={bind} />
        <p className="diorama-hint" aria-hidden="true">
          Drag to orbit · click a pad to inspect or deploy
        </p>
      </div>
    </section>
  );
}

/** Island layout, track theme, queued VFX, the enemy's spot and label anchors for the current match. */
function useDioramaStage(blueprint: ArchitectureBlueprint, matchState: MatchState) {
  const layout = useMemo(() => computeIslandLayout(blueprint), [blueprint]);
  const reducedMotion = usePrefersReducedMotion();
  const { effects, popDelays, dismissEffect } = useBoardEventQueue(matchState, reducedMotion);
  const hasRival = matchState.mode !== 'study';
  const rivalAnchor = useMemo(
    () => [-layout.islandSize[0] / 2 - RIVAL_SIDE_GAP, RIVAL_HOVER_HEIGHT, RIVAL_DEPTH] as const,
    [layout],
  );
  const cameraFrame = useMemo(
    () => computeBoardFrame(layout, hasRival ? { anchor: rivalAnchor, scale: ENEMY_SCALE } : null),
    [layout, hasRival, rivalAnchor],
  );
  const labelAnchors = useMemo(() => computeLabelAnchors(layout, rivalAnchor), [layout, rivalAnchor]);
  const theme = resolveTrackTheme(blueprint.trackId);

  return { layout, theme, hasRival, reducedMotion, effects, popDelays, dismissEffect, rivalAnchor, cameraFrame, labelAnchors };
}

function themeStageStyle(theme: TrackTheme): CSSProperties {
  return {
    '--stage-sky-top': theme.skyTop,
    '--stage-sky-bottom': theme.skyBottom,
    '--stage-ink': theme.skyInk,
  } as CSSProperties;
}

function DioramaTitleBar(props: { readonly blueprint: ArchitectureBlueprint }): JSX.Element {
  const { blueprint } = props;

  return (
    <>
      <div className="sheet-title-bar">
        <h2 className="sheet-heading">
          {blueprint.code} · {blueprint.title}
        </h2>
        <div className="sheet-badges">
          <span className="spec-tag">{blueprint.difficulty}</span>
          <span className="spec-tag">SLA {blueprint.targetSla}</span>
          <span className="spec-tag">{blueprint.costFocus}</span>
        </div>
      </div>
      <p className="workload-brief">{blueprint.workloadBrief}</p>
    </>
  );
}

function DioramaLabels(props: {
  readonly board: DioramaBoardProps;
  readonly layout: IslandLayout;
  readonly rivalName: string | null;
  readonly bind: LabelBinder;
}): JSX.Element {
  const { board, layout, rivalName, bind } = props;
  const { blueprint, matchState } = board;

  return (
    <div className="diorama-labels">
      {rivalName !== null && (
        <span ref={bind('rival')} className="rival-nameplate">
          {rivalName}
        </span>
      )}
      {layout.terraces.map((terrace) => (
        <span key={terrace.zoneId} ref={bind(`zone:${terrace.zoneId}`)} className={`zone-flag zone-ink-${terrace.ink}`}>
          {terrace.label}
        </span>
      ))}
      {blueprint.slots.map((slot) => (
        <PadLabel
          key={slot.id}
          slot={slot}
          slotState={matchState.slots[slot.id]}
          cardsById={board.cardsById}
          mode={matchState.mode}
          affordance={resolvePadAffordance(matchState, slot.id, board.selectedHandCard)}
          isInspected={board.inspectedSlotId === slot.id}
          bindRef={bind(`pad:${slot.id}`)}
          onInspectSlot={board.onInspectSlot}
          onTargetSlot={board.onTargetSlot}
        />
      ))}
    </div>
  );
}

function computeLabelAnchors(
  layout: IslandLayout,
  rivalAnchor: readonly [number, number, number],
): readonly LabelAnchor[] {
  return [
    { id: 'rival', position: [rivalAnchor[0], rivalAnchor[1] - 1.7, rivalAnchor[2]] as const },
    ...layout.terraces.map((t) => ({
      id: `zone:${t.zoneId}`,
      position: [t.center[0], 0, layout.islandSize[1] / 2 - 0.15] as const,
    })),
    ...layout.pads.map((p) => ({
      id: `pad:${p.slotId}`,
      position: [p.position[0], p.position[1] + 0.1, p.position[2] + PAD_SIZE / 2 + 0.25] as const,
    })),
  ];
}

const VISUAL_EVENTS: ReadonlySet<BoardEvent['type']> = new Set([
  'card-deployed',
  'slot-captured',
  'shield-locked',
  'incident-struck',
  'match-completed',
]);

/**
 * Diffs each committed `MatchState` against the previous one and schedules VFX.
 * Events are computed during render (pure) so freshly mounted buildings can read their
 * pop-in delay on the very same frame their card toss starts.
 */
function useBoardEventQueue(matchState: MatchState, reducedMotion: boolean) {
  const committedRef = useRef<MatchState | null>(null);
  const [effects, setEffects] = useState<readonly ActiveEffect[]>([]);

  const scheduled = useMemo(() => {
    const events = diffBoardEvents(committedRef.current, matchState).filter((e) => VISUAL_EVENTS.has(e.type));
    const base = nowSec();
    return events.map((event, index) => ({ event, startsAt: base + index * EFFECT_STAGGER_SEC }));
  }, [matchState]);

  const popDelays = useMemo(() => {
    const delays: Record<string, number> = {};
    if (reducedMotion) {
      return delays;
    }
    for (const { event, startsAt } of scheduled) {
      const offset = startsAt - nowSec();
      if (event.type === 'card-deployed' || event.type === 'slot-captured') {
        delays[event.slotId] = offset + TOSS_DURATION_SEC * 0.9;
      } else if (event.type === 'shield-locked') {
        delays[event.slotId] = offset;
      }
    }
    return delays;
  }, [scheduled, reducedMotion]);

  useEffect(() => {
    committedRef.current = matchState;
    if (!reducedMotion && scheduled.length > 0) {
      setEffects((current) => [...current, ...scheduled]);
    }
  }, [matchState, scheduled, reducedMotion]);

  const dismissEffect = useCallback((eventId: string) => {
    setEffects((current) => current.filter((effect) => effect.event.id !== eventId));
  }, []);

  return { effects, popDelays, dismissEffect };
}

function DioramaGuidance(props: {
  readonly selectedHandCard: CatalogCard | undefined;
  readonly mode: MatchState['mode'];
}): JSX.Element {
  const { selectedHandCard, mode } = props;

  if (selectedHandCard?.kind === 'service') {
    return (
      <div className="target-guidance is-active">
        <TechnicalIcon name={selectedHandCard.ink} size={15} />
        <span>
          <strong>{selectedHandCard.title}</strong> ({selectedHandCard.energyCost}E) ready — click a glowing pad to
          deploy, or an unshielded Rival node to capture ({selectedHandCard.energyCost + 1}E).
        </span>
      </div>
    );
  }

  if (selectedHandCard?.kind === 'shield') {
    return (
      <div className="target-guidance is-shield">
        <TechnicalIcon name="shield" size={15} />
        <span>
          <strong>{selectedHandCard.title}</strong> (1E) ready — click one of YOUR unshielded pads to raise a shield dome.
        </span>
      </div>
    );
  }

  return (
    <div className="target-guidance">
      <TechnicalIcon name="blueprint" size={15} />
      <span>
        {mode === 'study'
          ? 'Guided Study Active: each pad shows its best-fit GCP service. Click any pad to read exam trade-offs.'
          : 'Pick a card from your Hand to provision Energy, deploy a GCP Service onto a pad, or shield a node you own.'}
      </span>
    </div>
  );
}
