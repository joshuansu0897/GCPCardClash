/**
 * Primary Arena Workbench shell: header, Rival tray, incident ticker, playboard, inspector,
 * player hand, and the overlays (incident announcement, turn banner, dialogs).
 */

import { type ComponentType, type JSX, useState } from 'react';

import { BOSS_INCIDENT_CADENCE, type MatchState, STANDARD_INCIDENT_CADENCE, getIncidentCard } from '../../battle';
import type { CatalogRepository } from '../../catalog';
import { type ProgressRepository, deriveArchitectRank } from '../../progression';
import { type BoardRendererProps, type BoardView, BoardViewSwitch } from './board-view-switch';
import { MatchDebriefDialog, RulesReferenceDialog } from './debrief-and-rules-dialogs';
import { FlightHeader } from './flight-header';
import { HandDock } from './hand-dock';
import { IncidentAnnouncement, IncidentTicker, RivalDock, TurnPhaseBanner } from './match-hud';
import { ScenarioCatalogDialog } from './scenario-dialog';
import { SpecInspectorPanel } from './spec-inspector-panel';
import { type ArenaControllerState, useArenaController } from './use-arena-controller';

export interface ArenaWorkbenchProps {
  readonly catalogRepository: CatalogRepository;
  readonly progressRepository: ProgressRepository;
  /** Optional 3D playboard injected by the composition root; omitted when WebGL is unavailable. */
  readonly boardRenderer3d?: ComponentType<BoardRendererProps>;
  /** Pause between Rival actions so its turn plays out visibly; 0 resolves the turn instantly. */
  readonly rivalStepDelayMs?: number;
  /** Seed for each new match's shuffles and incident draws; fixed by default so tests are deterministic. */
  readonly nextMatchSeed?: () => number;
}

const FIXED_MATCH_SEED = (): number => 202610;

export function ArenaWorkbench(props: ArenaWorkbenchProps): JSX.Element {
  const ctrl = useArenaController(
    props.catalogRepository,
    props.progressRepository,
    props.rivalStepDelayMs ?? 0,
    props.nextMatchSeed ?? FIXED_MATCH_SEED,
  );
  const { matchState, activeBlueprint } = ctrl;
  const has3d = props.boardRenderer3d !== undefined;
  const [boardView, setBoardView] = useState<BoardView>(has3d ? '3d' : '2d');

  return (
    <div className={`workbench-shell track-${activeBlueprint.trackId} ${ctrl.playMode === 'boss' ? 'is-boss-battle' : ''}`}>
      <ArenaHeaderSection
        ctrl={ctrl}
        boardView={has3d ? boardView : null}
        onChangeBoardView={setBoardView}
      />
      <ArenaStage
        ctrl={ctrl}
        boardView={boardView}
        renderer3d={props.boardRenderer3d}
        onRendererFailed={() => setBoardView('2d')}
      />
      <ArenaHand ctrl={ctrl} />

      <TurnPhaseBanner
        turn={matchState.turn}
        rivalActing={ctrl.rivalActing}
        rival={ctrl.rival}
        hidden={matchState.mode === 'study' || matchState.status === 'completed' || (props.rivalStepDelayMs ?? 0) <= 0}
      />
      <IncidentAnnouncement incident={ctrl.announcedIncident} boss={ctrl.boss} onDismiss={ctrl.dismissIncident} />
      <ArenaDialogs ctrl={ctrl} />
    </div>
  );
}

function ArenaStage(props: {
  readonly ctrl: ArenaControllerState;
  readonly boardView: BoardView;
  readonly renderer3d: ComponentType<BoardRendererProps> | undefined;
  readonly onRendererFailed: () => void;
}): JSX.Element {
  const { ctrl } = props;
  const { matchState, activeBlueprint, curriculum } = ctrl;
  const activeIncident = matchState.incident !== null ? (getIncidentCard(matchState.incident.incidentId) ?? null) : null;
  const affectedZoneId = matchState.incident?.affectedZoneId ?? null;

  return (
    <main className="workbench-stage">
      <div className="arena-main-column">
        <RivalDock matchState={matchState} rival={ctrl.rival} isActing={ctrl.rivalActing} />
        <IncidentTicker
          incident={activeIncident}
          zoneLabel={activeBlueprint.zones.find((z) => z.id === affectedZoneId)?.label ?? null}
          turnsUntilNext={turnsUntilNextIncident(matchState)}
        />
        <BoardViewSwitch
          view={props.boardView}
          renderer3d={props.renderer3d}
          onRendererFailed={props.onRendererFailed}
          blueprint={activeBlueprint}
          matchState={matchState}
          cardsById={curriculum.cardsById}
          selectedHandCard={ctrl.selectedCard}
          inspectedSlotId={ctrl.inspectedSlotId}
          onInspectSlot={ctrl.handleInspectSlot}
          onTargetSlot={ctrl.handleTargetSlot}
        />
      </div>

      <SpecInspectorPanel
        mode={matchState.mode}
        inspectedCard={ctrl.selectedCard}
        inspectedSlot={ctrl.inspectedSlot}
        inspectedSlotState={
          ctrl.inspectedSlotId !== null ? matchState.slots[ctrl.inspectedSlotId] : undefined
        }
        cardsById={curriculum.cardsById}
        logs={matchState.logs}
      />
    </main>
  );
}

function ArenaHand(props: { readonly ctrl: ArenaControllerState }): JSX.Element {
  const { ctrl } = props;
  const { matchState } = ctrl;

  return (
    <HandDock
      hand={matchState.hand}
      drawPileCount={matchState.drawPile.length}
      discardPileCount={matchState.discardPile.length}
      cardsById={ctrl.curriculum.cardsById}
      selectedInstanceId={ctrl.selectedInstanceId}
      playerEnergy={matchState.playerEnergy}
      isMatchCompleted={matchState.status === 'completed'}
      isLocked={ctrl.rivalActing}
      onSelectOrPlayCard={ctrl.handleCardClick}
      onDiscardCard={ctrl.handleDiscardCard}
      onEndTurn={ctrl.handleEndTurn}
    />
  );
}

function turnsUntilNextIncident(state: MatchState): number | null {
  if (state.mode === 'study' || state.status === 'completed') {
    return null;
  }
  const cadence = state.rivalProfile === 'boss' ? BOSS_INCIDENT_CADENCE : STANDARD_INCIDENT_CADENCE;
  const remainder = state.turn % cadence;
  return remainder === 0 ? cadence : cadence - remainder;
}

function ArenaHeaderSection(props: {
  readonly ctrl: ArenaControllerState;
  readonly boardView: BoardView | null;
  readonly onChangeBoardView: (view: BoardView) => void;
}): JSX.Element {
  const { ctrl } = props;
  const { matchState, activeBlueprint, curriculum } = ctrl;

  return (
    <FlightHeader
      mode={ctrl.playMode}
      bossUnlocked={ctrl.bossUnlocked}
      turn={matchState.turn}
      playerScore={matchState.playerScore}
      rivalScore={matchState.rivalScore}
      playerEnergy={matchState.playerEnergy}
      maxEnergy={matchState.maxEnergy}
      totalStars={ctrl.totalStars}
      maxCampaignStars={curriculum.blueprints.length * 3}
      rank={deriveArchitectRank(ctrl.totalStars)}
      boardView={props.boardView}
      onChangeBoardView={props.onChangeBoardView}
      onOpenScenarios={() => ctrl.setCatalogOpen(true)}
      onOpenRules={() => ctrl.setRulesOpen(true)}
      onToggleMode={(nextMode) => ctrl.launchScenario(activeBlueprint.id, nextMode)}
      onRestartMatch={() => ctrl.launchScenario(activeBlueprint.id, ctrl.playMode)}
    />
  );
}

function ArenaDialogs(props: { readonly ctrl: ArenaControllerState }): JSX.Element {
  const { ctrl } = props;

  return (
    <>
      <ScenarioCatalogDialog
        isOpen={ctrl.catalogOpen}
        tracks={ctrl.curriculum.tracks}
        blueprints={ctrl.curriculum.blueprints}
        activeBlueprintId={ctrl.activeBlueprint.id}
        progress={ctrl.progress}
        onSelectScenario={(id, mode) => ctrl.launchScenario(id, mode)}
        onClose={() => ctrl.setCatalogOpen(false)}
      />

      <MatchDebriefDialog
        isOpen={ctrl.debriefOpen}
        blueprint={ctrl.activeBlueprint}
        matchState={ctrl.matchState}
        onReplay={(mode) => ctrl.launchScenario(ctrl.activeBlueprint.id, mode)}
        onOpenCatalog={() => {
          ctrl.dismissDebrief();
          ctrl.setCatalogOpen(true);
        }}
        onClose={ctrl.dismissDebrief}
      />

      <RulesReferenceDialog isOpen={ctrl.rulesOpen} onClose={() => ctrl.setRulesOpen(false)} />
    </>
  );
}
