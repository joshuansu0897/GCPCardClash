/**
 * Arena building blocks shared by the classic page layout and the immersive 3D HUD: the header,
 * the Rival tray with its incident ticker, the playboard, the inspector, the hand, and the
 * overlays (turn banner, incident toast, dialogs).
 */

import type { ComponentType, JSX } from 'react';

import { GENTLE_INCIDENT_CADENCE, type MatchState, SHARP_INCIDENT_CADENCE, getIncidentCard } from '../../battle';
import { deriveArchitectRank } from '../../progression';
import { type BoardRendererProps, type BoardView, BoardViewSwitch, type ViewInsets } from './board-view-switch';
import { MatchDebriefDialog, RulesReferenceDialog } from './debrief-and-rules-dialogs';
import { FlightHeader } from './flight-header';
import { HandDock } from './hand-dock';
import { IncidentAnnouncement, IncidentTicker, RivalDock, TurnPhaseBanner } from './match-hud';
import { ScenarioCatalogDialog } from './scenario-dialog';
import { SpecInspectorPanel } from './spec-inspector-panel';
import type { ArenaControllerState } from './use-arena-controller';

export interface SectionProps {
  readonly ctrl: ArenaControllerState;
}

export function ArenaHeaderSection(props: SectionProps & {
  readonly boardView: BoardView | null;
  readonly onChangeBoardView: (view: BoardView) => void;
}): JSX.Element {
  const { ctrl } = props;
  const { matchState, activeBlueprint, curriculum } = ctrl;

  return (
    <FlightHeader
      mode={ctrl.playMode}
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

/** The Rival's tray and the incident ticker under it. */
export function RivalSection(props: SectionProps): JSX.Element {
  const { matchState, activeBlueprint } = props.ctrl;
  const activeIncident = matchState.incident !== null ? (getIncidentCard(matchState.incident.incidentId) ?? null) : null;
  const affectedZoneId = matchState.incident?.affectedZoneId ?? null;

  return (
    <>
      <RivalDock matchState={matchState} rival={props.ctrl.rival} isActing={props.ctrl.rivalActing} />
      <IncidentTicker
        incident={activeIncident}
        zoneLabel={activeBlueprint.zones.find((z) => z.id === affectedZoneId)?.label ?? null}
        turnsUntilNext={turnsUntilNextIncident(matchState)}
      />
    </>
  );
}

export function BoardSection(props: SectionProps & {
  readonly boardView: BoardView;
  readonly renderer3d: ComponentType<BoardRendererProps> | undefined;
  readonly onRendererFailed: () => void;
  readonly onInspectSlot: (slotId: string) => void;
  readonly viewInsets?: ViewInsets;
}): JSX.Element {
  const { ctrl } = props;

  return (
    <BoardViewSwitch
      view={props.boardView}
      renderer3d={props.renderer3d}
      onRendererFailed={props.onRendererFailed}
      blueprint={ctrl.activeBlueprint}
      matchState={ctrl.matchState}
      cardsById={ctrl.curriculum.cardsById}
      selectedHandCard={ctrl.selectedCard}
      inspectedSlotId={ctrl.inspectedSlotId}
      onInspectSlot={props.onInspectSlot}
      onTargetSlot={ctrl.handleTargetSlot}
      viewInsets={props.viewInsets}
    />
  );
}

export function InspectorSection(props: SectionProps): JSX.Element {
  const { ctrl } = props;
  const { matchState } = ctrl;

  return (
    <SpecInspectorPanel
      mode={matchState.mode}
      inspectedCard={ctrl.selectedCard}
      inspectedSlot={ctrl.inspectedSlot}
      inspectedSlotState={ctrl.inspectedSlotId !== null ? matchState.slots[ctrl.inspectedSlotId] : undefined}
      cardsById={ctrl.curriculum.cardsById}
      logs={matchState.logs}
    />
  );
}

/** The player's hand; `withEnergy` adds the energy meter beside End Turn (immersive HUD). */
export function HandSection(props: SectionProps & { readonly withEnergy?: boolean }): JSX.Element {
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
      maxEnergy={props.withEnergy === true ? matchState.maxEnergy : undefined}
      isMatchCompleted={matchState.status === 'completed'}
      isLocked={ctrl.rivalActing}
      onSelectOrPlayCard={ctrl.handleCardClick}
      onDiscardCard={ctrl.handleDiscardCard}
      onEndTurn={ctrl.handleEndTurn}
    />
  );
}

/** Turn banner, incident toast and the modal dialogs, layered above either layout. */
export function ArenaOverlays(props: SectionProps & { readonly showTurnBanner: boolean }): JSX.Element {
  const { ctrl } = props;
  const { matchState } = ctrl;

  return (
    <>
      <TurnPhaseBanner
        turn={matchState.turn}
        rivalActing={ctrl.rivalActing}
        rival={ctrl.rival}
        hidden={!props.showTurnBanner || matchState.mode === 'study' || matchState.status === 'completed'}
      />
      <IncidentAnnouncement incident={ctrl.announcedIncident} rival={ctrl.rival} onDismiss={ctrl.dismissIncident} />
      <ArenaDialogs ctrl={ctrl} />
    </>
  );
}

function ArenaDialogs(props: SectionProps): JSX.Element {
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

function turnsUntilNextIncident(state: MatchState): number | null {
  if (state.mode === 'study' || state.status === 'completed') {
    return null;
  }
  const cadence = state.rivalTier === 'sharp' ? SHARP_INCIDENT_CADENCE : GENTLE_INCIDENT_CADENCE;
  const remainder = state.turn % cadence;
  return remainder === 0 ? cadence : cadence - remainder;
}

/** Shell classes shared by both layouts: the track's palette. */
export function shellClassName(ctrl: ArenaControllerState, extra = ''): string {
  return `workbench-shell track-${ctrl.activeBlueprint.trackId} ${extra}`.trim();
}
