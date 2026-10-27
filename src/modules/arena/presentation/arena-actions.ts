/**
 * Player actions for the Arena controller: launching scenarios, playing and discarding cards,
 * targeting slots, and ending the turn (the Rival's reply plays out one step at a time).
 */

import {
  type HandCardInstance,
  type MatchState,
  performMatchAction,
  resolveEndTurnSequence,
  startScenarioMatch,
} from '../../battle';
import type { ArchitectureBlueprint, CatalogCard, CatalogRepository } from '../../catalog';
import { type ProgressRepository, recordScenarioOutcome, rememberSelectedBlueprint } from '../../progression';
import type { SessionState } from './arena-session-state';
import type { PlayMode } from './use-arena-controller';

export interface ControllerDeps {
  readonly catalogRepository: CatalogRepository;
  readonly progressRepository: ProgressRepository;
  /** Pause between Rival actions; 0 resolves the Rival's turn instantly. */
  readonly rivalStepDelayMs: number;
  readonly nextSeed: () => number;
}

export interface HandSelection {
  readonly item: HandCardInstance | undefined;
  readonly card: CatalogCard | undefined;
}

type CommitState = (next: MatchState, bp: ArchitectureBlueprint) => void;

export function createControllerActions(s: SessionState, deps: ControllerDeps, selection: HandSelection) {
  const commitState = makeCommitter(s, deps.progressRepository);
  const runEndTurn = makeEndTurnRunner(s, deps.rivalStepDelayMs, commitState);

  return {
    launchScenario: makeScenarioLauncher(s, deps),
    handleCardClick: (instance: HandCardInstance, card: CatalogCard) => {
      if (!s.rivalActing) {
        onCardAction(s, instance, card, commitState);
      }
    },
    handleInspectSlot: (slotId: string) => {
      s.setSelectedInstanceId(null);
      s.setInspectedSlotId(slotId);
    },
    handleTargetSlot: (slotId: string) => {
      if (!s.rivalActing) {
        onTargetSlotAction(s, slotId, selection, commitState);
      }
    },
    handleDiscardCard: (instanceId: string) => {
      if (!s.rivalActing) {
        onDiscardAction(s, instanceId, commitState);
      }
    },
    handleEndTurn: () => {
      if (!s.rivalActing) {
        runEndTurn();
      }
    },
  };
}

function makeCommitter(s: SessionState, progressRepository: ProgressRepository): CommitState {
  return (nextState, blueprint) => {
    s.setMatchState(nextState);
    if (nextState.status === 'completed' && nextState.outcome !== null && nextState.mode === 'battle') {
      s.setProgress(recordScenarioOutcome(progressRepository, {
        blueprintId: blueprint.id,
        stars: nextState.outcome.stars,
        playerScore: nextState.playerScore,
        bossDefeated: nextState.outcome.bossDefeated,
      }));
    }
    if (nextState.incident !== null && nextState.incident.turn === nextState.turn && nextState.status === 'active') {
      s.setAnnouncedIncidentId(nextState.incident.incidentId);
    }
  };
}

function clearRivalTimers(s: SessionState): void {
  s.timers.current.forEach((id) => window.clearTimeout(id));
  s.timers.current = [];
}

function makeScenarioLauncher(s: SessionState, deps: ControllerDeps) {
  return (blueprintId: string, mode: PlayMode, seed = deps.nextSeed()): void => {
    // Reset the session around the new blueprint
    const target = deps.catalogRepository.getBlueprintById(blueprintId) ?? s.activeBlueprint;
    clearRivalTimers(s);
    s.setRivalActing(false);
    s.setAnnouncedIncidentId(null);
    s.setActiveBlueprint(target);
    s.setSelectedInstanceId(null);
    s.setInspectedSlotId(target.slots[0]?.id ?? null);
    s.setDebriefDismissed(false);
    s.setCatalogOpen(false);

    // Start the match
    s.setProgress(rememberSelectedBlueprint(deps.progressRepository, target.id));
    s.setMatchState(
      startScenarioMatch({
        blueprint: target,
        allCards: s.allCards,
        mode: mode === 'study' ? 'study' : 'battle',
        rivalProfile: mode === 'boss' ? 'boss' : 'standard',
        seed,
      }),
    );
  };
}

function makeEndTurnRunner(s: SessionState, rivalStepDelayMs: number, commitState: CommitState) {
  return (): void => {
    s.setSelectedInstanceId(null);
    s.setAnnouncedIncidentId(null);
    const steps = resolveEndTurnSequence(s.matchState, s.activeBlueprint, s.curriculum.cardsById);
    const last = steps[steps.length - 1];
    if (last === undefined) {
      return;
    }
    if (rivalStepDelayMs <= 0 || s.matchState.mode === 'study') {
      commitState(last, s.activeBlueprint);
      return;
    }

    // Play the Rival's turn out one action at a time, like a real opponent
    clearRivalTimers(s);
    s.setRivalActing(true);
    scheduleRivalSteps(s, steps, rivalStepDelayMs, commitState);
  };
}

function scheduleRivalSteps(
  s: SessionState,
  steps: readonly MatchState[],
  rivalStepDelayMs: number,
  commitState: CommitState,
): void {
  const blueprint = s.activeBlueprint;
  steps.forEach((step, index) => {
    const id = window.setTimeout(() => {
      commitState(step, blueprint);
      if (index === steps.length - 1) {
        s.setRivalActing(false);
      }
    }, (index + 1) * rivalStepDelayMs);
    s.timers.current.push(id);
  });
}

function onCardAction(s: SessionState, instance: HandCardInstance, card: CatalogCard, commitState: CommitState): void {
  if (card.kind === 'energy') {
    s.setSelectedInstanceId(null);
    commitState(
      performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, {
        type: 'play-energy',
        instanceId: instance.instanceId,
      }),
      s.activeBlueprint,
    );
    return;
  }
  s.setSelectedInstanceId((prev) => (prev === instance.instanceId ? null : instance.instanceId));
}

function onTargetSlotAction(s: SessionState, slotId: string, selection: HandSelection, commitState: CommitState): void {
  s.setInspectedSlotId(slotId);
  if (selection.item === undefined || selection.card === undefined) {
    return;
  }

  const actionType = selection.card.kind === 'shield' ? 'apply-shield' : 'deploy-service';
  const next = performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, {
    type: actionType,
    instanceId: selection.item.instanceId,
    slotId,
  });
  s.setSelectedInstanceId(null);
  commitState(next, s.activeBlueprint);
}

function onDiscardAction(s: SessionState, instanceId: string, commitState: CommitState): void {
  s.setSelectedInstanceId(null);
  commitState(
    performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, { type: 'discard-card', instanceId }),
    s.activeBlueprint,
  );
}
