/**
 * Pure targeting affordance for a single slot pad given the currently selected hand card.
 * Mirrors the engine's legality so the pad can glow before the player commits.
 */

import { type MatchState, quoteServiceCost, quoteShieldCost } from '../../battle';
import type { CatalogCard } from '../../catalog';

export type PadAffordance =
  | { readonly kind: 'none' }
  | { readonly kind: 'deploy'; readonly cost: number }
  | { readonly kind: 'capture'; readonly cost: number }
  | { readonly kind: 'harden'; readonly cost: number }
  | { readonly kind: 'unaffordable'; readonly cost: number };

/** Uses the engine's own cost quotes, so active incidents (e.g. Zero-Day) are reflected. */
export function resolvePadAffordance(
  state: MatchState,
  slotId: string,
  selectedCard: CatalogCard | undefined,
): PadAffordance {
  const slotState = state.slots[slotId];

  if (selectedCard?.kind === 'service') {
    const cost = quoteServiceCost(state, 'player', selectedCard, slotState);
    if (cost === null) {
      return { kind: 'none' };
    }
    return withBudget({ kind: slotState?.owner === 'rival' ? 'capture' : 'deploy', cost }, state.playerEnergy);
  }

  if (selectedCard?.kind === 'shield' && slotState?.owner === 'player' && slotState.shieldCardId === null) {
    return withBudget({ kind: 'harden', cost: quoteShieldCost(state, selectedCard) }, state.playerEnergy);
  }

  return { kind: 'none' };
}

function withBudget(
  affordance: { readonly kind: 'deploy' | 'capture' | 'harden'; readonly cost: number },
  playerEnergy: number,
): PadAffordance {
  return playerEnergy >= affordance.cost ? affordance : { kind: 'unaffordable', cost: affordance.cost };
}

export function describeAffordance(affordance: PadAffordance): string | null {
  switch (affordance.kind) {
    case 'deploy':
      return `Deploy (${affordance.cost}E)`;
    case 'capture':
      return `Capture (${affordance.cost}E)`;
    case 'harden':
      return `Harden (${affordance.cost}E)`;
    case 'unaffordable':
      return `Need ${affordance.cost}E`;
    case 'none':
      return null;
  }
}
