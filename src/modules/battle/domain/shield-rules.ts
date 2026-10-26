/**
 * Pure defense-in-depth shield hardening and hand-cycling rules.
 */

import type { ArchitectureBlueprint, ArchitectureSlot, ShieldCard } from '../../catalog';
import { drawUpToHandLimit } from './deck-rules';
import type {
  HandCardInstance,
  MatchState,
  SlotDeployment,
  TurnLogSeverity,
} from './match-types';
import { appendLog, consumeHandInstance } from './placement-rules';
import { BASE_SHIELD_POINTS, RECOMMENDED_SHIELD_BONUS } from './scoring';

export interface ShieldDeployInput {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly handItem: HandCardInstance;
  readonly card: ShieldCard;
  readonly slotId: string;
}

export function applyShieldToSlot(input: ShieldDeployInput): MatchState {
  const { state, blueprint, handItem, card, slotId } = input;
  const specSlot = blueprint.slots.find((s) => s.id === slotId);
  const slotState = state.slots[slotId];

  // Validate ownership, unshielded status, and energy
  const rejection = checkShieldEligibility(specSlot, slotState, state.playerEnergy, card.energyCost);
  if (rejection !== null || specSlot === undefined || slotState === undefined) {
    return rejection === null
      ? state
      : { ...state, logs: appendLog(state.logs, state.turn, 'system', rejection) };
  }

  // Score recommended vs baseline security hardening
  const matched = card.capability === specSlot.recommendedShield;
  const points = BASE_SHIELD_POINTS + (matched ? RECOMMENDED_SHIELD_BONUS : 0);
  const piles = consumeHandInstance(state, handItem.instanceId);
  const updatedSlot: SlotDeployment = {
    ...slotState,
    shieldCardId: card.id,
    shieldMatchedRecommendation: matched,
  };

  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'shield',
    headline: `Hardened ${specSlot.title} with ${card.title}${matched ? ' (Optimal Control!)' : ''}`,
    detail: matched
      ? `Matched recommended perimeter control (${card.capability}) for +${points} pts and capture immunity.`
      : `Node is now immune to Rival compromise (+${points} pts). Recommended control was ${specSlot.recommendedShield}.`,
    pointsDelta: points,
  });

  return {
    ...state,
    playerEnergy: state.playerEnergy - card.energyCost,
    playerScore: state.playerScore + points,
    hand: piles.hand,
    discardPile: piles.discardPile,
    slots: { ...state.slots, [slotId]: updatedSlot },
    logs,
  };
}

function checkShieldEligibility(
  specSlot: ArchitectureSlot | undefined,
  slotState: SlotDeployment | undefined,
  playerEnergy: number,
  cost: number,
): { readonly severity: TurnLogSeverity; readonly headline: string; readonly detail: string; readonly pointsDelta: number } | null {
  if (specSlot === undefined || slotState === undefined || slotState.owner !== 'player') {
    return {
      severity: 'system',
      headline: 'Shield Requires Your Deployed Node',
      detail: 'Deploy a GCP Service into a slot first, then attach a Security Shield to harden it.',
      pointsDelta: 0,
    };
  }
  if (slotState.shieldCardId !== null) {
    return {
      severity: 'system',
      headline: 'Cannot Attach Shield',
      detail: 'This node is already hardened with a Security Shield.',
      pointsDelta: 0,
    };
  }
  if (playerEnergy < cost) {
    return {
      severity: 'system',
      headline: 'Cannot Attach Shield',
      detail: 'Need 1 Deploy Energy to attach a Security Shield.',
      pointsDelta: 0,
    };
  }
  return null;
}

export function discardAndDrawCard(
  state: MatchState,
  instanceId: string,
  cardTitle: string,
): MatchState {
  if (state.discardsRemaining <= 0) {
    return {
      ...state,
      logs: appendLog(state.logs, state.turn, 'system', {
        severity: 'system',
        headline: 'Discard Limit Reached (2 per Turn)',
        detail: 'End your turn to refresh discard capacity and draw back to 6 cards.',
        pointsDelta: 0,
      }),
    };
  }

  const consumed = consumeHandInstance(state, instanceId);
  const refilled = drawUpToHandLimit(consumed.hand, state.drawPile, consumed.discardPile);
  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'system',
    headline: `Cycled ${cardTitle} from Hand`,
    detail: `Drew replacement card (${state.discardsRemaining - 1} discard(s) left this turn).`,
    pointsDelta: 0,
  });

  return {
    ...state,
    discardsRemaining: state.discardsRemaining - 1,
    hand: refilled.hand,
    drawPile: refilled.drawPile,
    discardPile: refilled.discardPile,
    logs,
  };
}
