/**
 * Single dispatcher for card actions. The player's UI and the Rival AI both go through here,
 * so neither side has a code path the other lacks.
 */

import type { ArchitectureBlueprint, CatalogCard } from '../../catalog';
import { readSide } from './architect-side';
import type { MatchState, PlayerActor, TurnAction } from './match-types';
import { applyEnergyCard, applyServiceDeployment } from './placement-rules';
import { applyShieldToSlot, discardFromHand } from './shield-rules';

export type CardAction = Exclude<TurnAction, { readonly type: 'end-turn' }>;

export function performCardAction(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
  actor: PlayerActor,
  action: CardAction,
): MatchState {
  const handItem = readSide(state, actor).hand.find((h) => h.instanceId === action.instanceId);
  const card = handItem !== undefined ? cardsById[handItem.cardId] : undefined;
  if (handItem === undefined || card === undefined) {
    return state;
  }

  if (action.type === 'discard-card') {
    return discardFromHand(state, actor, handItem.instanceId, card.title);
  }
  if (action.type === 'play-energy' && card.kind === 'energy') {
    return applyEnergyCard(state, actor, handItem, card);
  }
  if (action.type === 'deploy-service' && card.kind === 'service') {
    return applyServiceDeployment({ state, blueprint, actor, handItem, card, slotId: action.slotId });
  }
  if (action.type === 'apply-shield' && card.kind === 'shield') {
    return applyShieldToSlot({ state, blueprint, actor, handItem, card, slotId: action.slotId });
  }
  return state;
}
