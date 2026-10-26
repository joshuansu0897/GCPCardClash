/**
 * Application use cases for starting a scenario match and executing player turn actions.
 */

import type { ArchitectureBlueprint, CatalogCard } from '../../../catalog';
import { executeRivalArchitectTurn } from '../../domain/ai-rival';
import {
  DISCARDS_PER_TURN,
  MAX_TURN_ENERGY,
  dealScenarioDeck,
  drawUpToHandLimit,
} from '../../domain/deck-rules';
import type {
  ArenaMode,
  HandCardInstance,
  MatchState,
  SlotDeployment,
  TurnAction,
} from '../../domain/match-types';
import {
  appendLog,
  applyEnergyCard,
  applyServiceDeployment,
} from '../../domain/placement-rules';
import { applyShieldToSlot, discardAndDrawCard } from '../../domain/shield-rules';

export interface StartMatchOptions {
  readonly blueprint: ArchitectureBlueprint;
  readonly allCards: readonly CatalogCard[];
  readonly mode: ArenaMode;
  readonly seed?: number;
}

export function startScenarioMatch(options: StartMatchOptions): MatchState {
  // Initialize empty blueprint slot map
  const { blueprint, allCards, mode, seed = 202610 } = options;
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

  // Deal deterministic scenario deck and opening log
  const deal = dealScenarioDeck(blueprint, allCards, seed);
  const initialEnergy = mode === 'study' ? MAX_TURN_ENERGY : 2;
  const logs = appendLog([], 1, 'system', buildOpeningLogEntry(blueprint, mode));

  return {
    blueprintId: blueprint.id,
    mode,
    turn: 1,
    maxEnergy: MAX_TURN_ENERGY,
    playerEnergy: initialEnergy,
    rivalEnergy: 1,
    discardsRemaining: DISCARDS_PER_TURN,
    playerScore: 0,
    rivalScore: 0,
    playerMistakes: 0,
    hand: deal.hand,
    drawPile: deal.drawPile,
    discardPile: deal.discardPile,
    slots,
    logs,
    status: 'active',
    outcome: null,
  };
}

function buildOpeningLogEntry(blueprint: ArchitectureBlueprint, mode: ArenaMode) {
  if (mode === 'study') {
    return {
      severity: 'system' as const,
      headline: `Guided Study Mode — ${blueprint.code} ${blueprint.title}`,
      detail: 'Optimal GCP services and recommended shields are revealed on every slot. Click any node or test-deploy freely.',
      pointsDelta: 0,
    };
  }

  return {
    severity: 'system' as const,
    headline: `Battle Initialized — ${blueprint.code} ${blueprint.title}`,
    detail: 'Play Provisioning tools for Energy, deploy matching GCP Services onto open slots, and attach Security Shields!',
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
    return advanceToNextTurn(state, blueprint, cardsById);
  }

  const handItem = state.hand.find((h) => h.instanceId === action.instanceId);
  const card = handItem !== undefined ? cardsById[handItem.cardId] : undefined;
  if (handItem === undefined || card === undefined) {
    return state;
  }

  return dispatchCardAction({ state, blueprint, handItem, card, action });
}

function dispatchCardAction(params: {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly handItem: HandCardInstance;
  readonly card: CatalogCard;
  readonly action: Exclude<TurnAction, { readonly type: 'end-turn' }>;
}): MatchState {
  const { state, blueprint, handItem, card, action } = params;

  if (action.type === 'discard-card') {
    return discardAndDrawCard(state, handItem.instanceId, card.title);
  }
  if (action.type === 'play-energy' && card.kind === 'energy') {
    return applyEnergyCard(state, handItem, card);
  }
  if (action.type === 'deploy-service' && card.kind === 'service') {
    return applyServiceDeployment({ state, blueprint, handItem, card, slotId: action.slotId });
  }
  if (action.type === 'apply-shield' && card.kind === 'shield') {
    return applyShieldToSlot({ state, blueprint, handItem, card, slotId: action.slotId });
  }

  return state;
}

function advanceToNextTurn(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): MatchState {
  // Run AI Rival Architect turn when in Battle mode
  const afterRival = executeRivalArchitectTurn(state, blueprint, cardsById);
  if (afterRival.status === 'completed') {
    return afterRival;
  }

  // Refill player hand, grant baseline +1 energy (or full 6 in Study mode), and advance turn counter
  const refilled = drawUpToHandLimit(afterRival.hand, afterRival.drawPile, afterRival.discardPile);
  const nextEnergy = afterRival.mode === 'study'
    ? afterRival.maxEnergy
    : Math.min(afterRival.maxEnergy, afterRival.playerEnergy + 1);

  return {
    ...afterRival,
    turn: afterRival.turn + 1,
    playerEnergy: nextEnergy,
    discardsRemaining: DISCARDS_PER_TURN,
    hand: refilled.hand,
    drawPile: refilled.drawPile,
    discardPile: refilled.discardPile,
  };
}
