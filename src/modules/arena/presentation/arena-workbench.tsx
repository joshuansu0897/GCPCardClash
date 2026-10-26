/**
 * Primary Arena Workbench shell composing Header, Drafting Canvas, Inspector, Hand, and Dialogs.
 */

import type { JSX } from 'react';

import type { CatalogRepository } from '../../catalog';
import { type ProgressRepository, deriveArchitectRank } from '../../progression';
import { BlueprintCanvas } from './blueprint-canvas';
import { MatchDebriefDialog, RulesReferenceDialog } from './debrief-and-rules-dialogs';
import { FlightHeader } from './flight-header';
import { HandDock } from './hand-dock';
import { ScenarioCatalogDialog } from './scenario-dialog';
import { SpecInspectorPanel } from './spec-inspector-panel';
import { type ArenaControllerState, useArenaController } from './use-arena-controller';

export interface ArenaWorkbenchProps {
  readonly catalogRepository: CatalogRepository;
  readonly progressRepository: ProgressRepository;
}

export function ArenaWorkbench(props: ArenaWorkbenchProps): JSX.Element {
  const ctrl = useArenaController(props.catalogRepository, props.progressRepository);
  const { matchState, activeBlueprint, curriculum } = ctrl;

  return (
    <div className="workbench-shell">
      <ArenaHeaderSection ctrl={ctrl} />

      <main className="workbench-stage">
        <BlueprintCanvas
          blueprint={activeBlueprint}
          mode={matchState.mode}
          playerEnergy={matchState.playerEnergy}
          deployedSlots={matchState.slots}
          cardsById={curriculum.cardsById}
          selectedHandCard={ctrl.selectedCard}
          inspectedSlotId={ctrl.inspectedSlotId}
          onInspectSlot={ctrl.handleInspectSlot}
          onTargetSlot={ctrl.handleTargetSlot}
        />

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

      <HandDock
        hand={matchState.hand}
        cardsById={curriculum.cardsById}
        selectedInstanceId={ctrl.selectedInstanceId}
        playerEnergy={matchState.playerEnergy}
        discardsRemaining={matchState.discardsRemaining}
        isMatchCompleted={matchState.status === 'completed'}
        onSelectOrPlayCard={ctrl.handleCardClick}
        onDiscardCard={ctrl.handleDiscardCard}
        onEndTurn={ctrl.handleEndTurn}
      />

      <ArenaDialogs ctrl={ctrl} />
    </div>
  );
}

function ArenaHeaderSection(props: { readonly ctrl: ArenaControllerState }): JSX.Element {
  const { ctrl } = props;
  const { matchState, activeBlueprint, curriculum } = ctrl;

  return (
    <FlightHeader
      mode={matchState.mode}
      turn={matchState.turn}
      playerScore={matchState.playerScore}
      rivalScore={matchState.rivalScore}
      playerEnergy={matchState.playerEnergy}
      maxEnergy={matchState.maxEnergy}
      totalStars={ctrl.totalStars}
      maxCampaignStars={curriculum.blueprints.length * 3}
      rank={deriveArchitectRank(ctrl.totalStars)}
      onOpenScenarios={() => ctrl.setCatalogOpen(true)}
      onOpenRules={() => ctrl.setRulesOpen(true)}
      onToggleMode={(nextMode) => ctrl.launchScenario(activeBlueprint.id, nextMode)}
      onRestartMatch={() =>
        ctrl.launchScenario(activeBlueprint.id, matchState.mode, matchState.turn + 202610)
      }
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
        onReplay={(mode) => ctrl.launchScenario(ctrl.activeBlueprint.id, mode, 202699)}
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
