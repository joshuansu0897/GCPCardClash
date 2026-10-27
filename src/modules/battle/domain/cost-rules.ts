/**
 * Single source of truth for what an action costs right now, including the active incident.
 * Used by the engine to validate moves, by the Rival AI to plan, and by the UI to label targets.
 */

import type { ArchitectureBlueprint, ServiceCard, ShieldCard } from '../../catalog';
import { getActiveModifiers } from './incident-rules';
import type { MatchState, PlayerActor, SlotDeployment } from './match-types';

export const CAPTURE_SURCHARGE = 1;

/**
 * Energy needed for `actor` to put `card` on a slot, or `null` when the slot is not a legal
 * target (already owned by the actor, or an opponent node protected by a shield).
 */
export function quoteServiceCost(
  state: MatchState,
  actor: PlayerActor,
  card: ServiceCard,
  slotState: SlotDeployment | undefined,
): number | null {
  if (slotState === undefined || slotState.owner === actor) {
    return null;
  }
  if (slotState.owner === null) {
    return card.energyCost;
  }
  if (slotState.shieldCardId !== null) {
    return null;
  }
  const delta = getActiveModifiers(state).captureCostDelta ?? 0;
  return Math.max(card.energyCost, card.energyCost + CAPTURE_SURCHARGE + delta);
}

export function quoteShieldCost(state: MatchState, card: ShieldCard): number {
  return getActiveModifiers(state).shieldCostOverride ?? card.energyCost;
}

/** Bonus points the active incident grants for deploying into `slotId`. */
export function incidentDeployBonus(state: MatchState, blueprint: ArchitectureBlueprint, slotId: string): number {
  const bonus = getActiveModifiers(state).deployBonus;
  if (bonus === undefined) {
    return 0;
  }
  const slot = blueprint.slots.find((s) => s.id === slotId);
  const zone = slot !== undefined ? blueprint.zones.find((z) => z.id === slot.zoneId) : undefined;
  return zone?.ink === bonus.zoneInk ? bonus.points : 0;
}
