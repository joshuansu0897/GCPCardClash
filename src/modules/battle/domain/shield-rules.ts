/**
 * Pure defense-in-depth shield hardening and discard rules, symmetric for both architects.
 */

import type { ArchitectureBlueprint, ArchitectureSlot, ShieldCard } from '../../catalog';
import { readSide, writeSide } from './architect-side';
import { quoteShieldCost } from './cost-rules';
import { HAND_LIMIT } from './deck-rules';
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

/**
 * Discards are free and unlimited during your own turn. Nothing is drawn now: the hand is
 * refilled to the limit at the start of that architect's next turn.
 */
export function discardFromHand(
  state: MatchState,
  actor: PlayerActor,
  instanceId: string,
  cardTitle: string,
): MatchState {
  const next = consumeHandInstance(state, actor, instanceId);
  const toDraw = HAND_LIMIT - readSide(next, actor).hand.length;

  return logAction(next, actor, {
    severity: 'system',
    headline: actor === 'player' ? `Discarded ${cardTitle}` : 'Discarded a card',
    detail: `Will draw ${toDraw} card${toDraw === 1 ? '' : 's'} at the start of the next turn.`,
    pointsDelta: 0,
  });
}
