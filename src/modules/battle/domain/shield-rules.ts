/**
 * Pure defense-in-depth shield hardening and hand-cycling rules, symmetric for both architects.
 */

import type { ArchitectureBlueprint, ArchitectureSlot, ShieldCard } from '../../catalog';
import { readSide, writeSide } from './architect-side';
import { quoteShieldCost } from './cost-rules';
import { DISCARDS_PER_TURN, drawUpToHandLimit } from './deck-rules';
import type { HandCardInstance, MatchState, PlayerActor, SlotDeployment } from './match-types';
import { consumeHandInstance, logAction, logSystem } from './placement-rules';
import { BASE_SHIELD_POINTS, RECOMMENDED_SHIELD_BONUS } from './scoring';
import type { LogDraft } from './turn-log';

export interface ShieldDeployInput {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly actor: PlayerActor;
  readonly handItem: HandCardInstance;
  readonly card: ShieldCard;
  readonly slotId: string;
}

export function applyShieldToSlot(input: ShieldDeployInput): MatchState {
  const { state, blueprint, actor, handItem, card, slotId } = input;
  const specSlot = blueprint.slots.find((s) => s.id === slotId);
  const slotState = state.slots[slotId];
  const cost = quoteShieldCost(state, card);

  const rejection = checkShieldEligibility(specSlot, slotState, actor, readSide(state, actor).energy, cost);
  if (rejection !== null || specSlot === undefined || slotState === undefined) {
    return rejection !== null && actor === 'player' ? logSystem(state, rejection) : state;
  }

  // Score recommended vs baseline security hardening
  const matched = card.capability === specSlot.recommendedShield;
  const points = BASE_SHIELD_POINTS + (matched ? RECOMMENDED_SHIELD_BONUS : 0);
  const side = readSide(state, actor);
  const updatedSlot: SlotDeployment = { ...slotState, shieldCardId: card.id, shieldMatchedRecommendation: matched };

  let next = consumeHandInstance(state, actor, handItem.instanceId);
  next = writeSide(next, actor, { energy: side.energy - cost, score: side.score + points });
  next = { ...next, slots: { ...next.slots, [slotId]: updatedSlot } };

  return logAction(next, actor, {
    severity: 'shield',
    headline: `Hardened ${specSlot.title} with ${card.title}${matched ? ' (Optimal Control!)' : ''}`,
    detail: matched
      ? `Matched recommended perimeter control (${card.capability}) for +${points} pts and capture immunity.`
      : `Node is now immune to capture (+${points} pts). Recommended control was ${specSlot.recommendedShield}.`,
    pointsDelta: points,
  });
}

function checkShieldEligibility(
  specSlot: ArchitectureSlot | undefined,
  slotState: SlotDeployment | undefined,
  actor: PlayerActor,
  energy: number,
  cost: number,
): LogDraft | null {
  if (specSlot === undefined || slotState === undefined || slotState.owner !== actor) {
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
  if (energy < cost) {
    return {
      severity: 'system',
      headline: 'Cannot Attach Shield',
      detail: `Need ${cost} Deploy Energy to attach a Security Shield.`,
      pointsDelta: 0,
    };
  }
  return null;
}

export function discardAndDrawCard(
  state: MatchState,
  actor: PlayerActor,
  instanceId: string,
  cardTitle: string,
): MatchState {
  const side = readSide(state, actor);
  if (side.discardsRemaining <= 0) {
    return actor === 'player'
      ? logSystem(state, {
          severity: 'system',
          headline: `Discard Limit Reached (${DISCARDS_PER_TURN} per Turn)`,
          detail: 'End your turn to refresh discard capacity and draw back to 6 cards.',
          pointsDelta: 0,
        })
      : state;
  }

  const consumed = readSide(consumeHandInstance(state, actor, instanceId), actor);
  const refilled = drawUpToHandLimit(consumed.hand, consumed.drawPile, consumed.discardPile);
  const next = writeSide(state, actor, { ...refilled, discardsRemaining: side.discardsRemaining - 1 });

  return logAction(next, actor, {
    severity: 'system',
    headline: actor === 'player' ? `Cycled ${cardTitle} from Hand` : 'Cycled a card',
    detail: `Drew a replacement card (${side.discardsRemaining - 1} discard(s) left this turn).`,
    pointsDelta: 0,
  });
}
