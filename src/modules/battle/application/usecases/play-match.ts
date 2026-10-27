/**
 * Application use cases for starting a scenario match and executing turn actions.
 */

import type { ArchitectureBlueprint, CatalogCard } from '../../../catalog';
import { planRivalTurn } from '../../domain/ai-rival';
import { readSide, writeSide } from '../../domain/architect-side';
import { MAX_TURN_ENERGY, dealScenarioDeck, drawUpToHandLimit } from '../../domain/deck-rules';
import { drawIncidentForTurn, strikeIncident } from '../../domain/incident-rules';
import type {
  ArenaMode,
  MatchState,
  RivalProfile,
  SlotDeployment,
  TurnAction,
} from '../../domain/match-types';
import { appendLog } from '../../domain/placement-rules';
import { resolveBossForTrack, resolveRivalForTrack } from '../../domain/rival-roster';
import { performCardAction } from '../../domain/turn-actions';

const RIVAL_DECK_SEED_OFFSET = 7919;

export interface StartMatchOptions {
  readonly blueprint: ArchitectureBlueprint;
  readonly allCards: readonly CatalogCard[];
  readonly mode: ArenaMode;
  readonly rivalProfile?: RivalProfile;
  readonly seed?: number;
}

export function startScenarioMatch(options: StartMatchOptions): MatchState {
  const { blueprint, allCards, mode, seed = 202610 } = options;
  const rivalProfile: RivalProfile = mode === 'study' ? 'standard' : (options.rivalProfile ?? 'standard');

  const slots: Record<string, SlotDeployment> = {};
  for (const slot of blueprint.slots) {
    slots[slot.id] = {
      slotId: slot.id,
      owner: null,
      serviceCardId: null,
      shieldCardId: null,
      shieldMatchedRecommendation: false,
    };
  }

  // Both architects draw from the same scenario card pool, shuffled independently
  const deal = dealScenarioDeck(blueprint, allCards, seed);
  const rivalDeal = dealScenarioDeck(blueprint, allCards, seed + RIVAL_DECK_SEED_OFFSET, 'rival');
  const logs = appendLog([], 1, 'system', buildOpeningLogEntry(blueprint, mode, rivalProfile));

  return {
    blueprintId: blueprint.id,
    mode,
    rivalProfile,
    seed,
    turn: 1,
    maxEnergy: MAX_TURN_ENERGY,
    playerEnergy: mode === 'study' ? MAX_TURN_ENERGY : 2,
    // The Rival gains +1 at the start of its turn, so it also plays Turn 1 with 2 Energy.
    rivalEnergy: 1,
    playerScore: 0,
    rivalScore: 0,
    playerMistakes: 0,
    rivalMistakes: 0,
    hand: deal.hand,
    drawPile: deal.drawPile,
    discardPile: deal.discardPile,
    rivalHand: rivalDeal.hand,
    rivalDrawPile: rivalDeal.drawPile,
    rivalDiscardPile: rivalDeal.discardPile,
    incident: null,
    slots,
    logs,
    status: 'active',
    outcome: null,
  };
}

function buildOpeningLogEntry(blueprint: ArchitectureBlueprint, mode: ArenaMode, rivalProfile: RivalProfile) {
  if (mode === 'study') {
    return {
      severity: 'system' as const,
      headline: `Guided Study Mode — ${blueprint.code} ${blueprint.title}`,
      detail: 'Optimal GCP services and recommended shields are revealed on every slot. Click any node or test-deploy freely.',
      pointsDelta: 0,
    };
  }

  const rival = resolveRivalForTrack(blueprint.trackId, rivalProfile);
  if (rivalProfile === 'boss') {
    return {
      severity: 'rival' as const,
      headline: `BOSS BATTLE — ${rival.name}, ${rival.epithet}`,
      detail: `"${rival.intro}" Incidents strike every 2 turns, including ${rival.name}'s signature move.`,
      pointsDelta: 0,
    };
  }

  return {
    severity: 'rival' as const,
    headline: `${blueprint.code} ${blueprint.title} — vs ${rival.name}`,
    detail: `"${rival.intro}" Play Provisioning for Energy, deploy matching GCP Services onto open slots, and attach Security Shields!`,
    pointsDelta: 0,
  };
}

export function performMatchAction(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
  action: TurnAction,
): MatchState {
  if (state.status === 'completed') {
    return state;
  }
  if (action.type === 'end-turn') {
    const steps = resolveEndTurnSequence(state, blueprint, cardsById);
    return steps[steps.length - 1] ?? state;
  }
  return performCardAction(state, blueprint, cardsById, 'player', action);
}

/**
 * Ends the player's turn and returns every intermediate state: one per Rival action, then the
 * start of the next turn (with any incident that strikes). The last element is the settled state.
 */
export function resolveEndTurnSequence(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): readonly MatchState[] {
  if (state.status === 'completed') {
    return [state];
  }

  const rivalSteps = planRivalTurn(state, blueprint, cardsById);
  const afterRival = rivalSteps[rivalSteps.length - 1] ?? state;
  if (afterRival.status === 'completed') {
    return rivalSteps;
  }

  return [...rivalSteps, startNextTurn(afterRival, blueprint)];
}

function startNextTurn(state: MatchState, blueprint: ArchitectureBlueprint): MatchState {
  const turn = state.turn + 1;
  const upkeep: MatchState = {
    ...state,
    turn,
    playerEnergy: state.mode === 'study' ? state.maxEnergy : Math.min(state.maxEnergy, state.playerEnergy + 1),
    incident: null,
  };
  // Start-of-turn draw back up to the hand limit (the Rival does the same at the start of its turn)
  const player = readSide(upkeep, 'player');
  const next = writeSide(
    upkeep,
    'player',
    drawUpToHandLimit(player.hand, player.drawPile, player.discardPile, upkeep.seed * 13 + turn),
  );

  const signature = state.rivalProfile === 'boss' ? resolveBossForTrack(blueprint.trackId).signatureIncidentId : null;
  const incident = drawIncidentForTurn(next, turn, signature);
  return incident !== null ? strikeIncident(next, blueprint, incident) : next;
}
