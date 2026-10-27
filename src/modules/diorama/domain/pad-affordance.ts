/**
 * Pure targeting affordance for a single slot pad given the currently selected hand card.
 * Mirrors the engine's legality so the pad can glow before the player commits.
 */

import type { SlotDeployment } from '../../battle';
import type { CatalogCard } from '../../catalog';

export type PadAffordance =
  | { readonly kind: 'none' }
  | { readonly kind: 'deploy'; readonly cost: number }
  | { readonly kind: 'capture'; readonly cost: number }
  | { readonly kind: 'harden'; readonly cost: number }
  | { readonly kind: 'unaffordable'; readonly cost: number };

export function resolvePadAffordance(
  slotState: SlotDeployment | undefined,
  selectedCard: CatalogCard | undefined,
  playerEnergy: number,
): PadAffordance {
  if (selectedCard?.kind === 'service') {
    if (!slotState?.owner) {
      return withBudget({ kind: 'deploy', cost: selectedCard.energyCost }, playerEnergy);
    }
    if (slotState.owner === 'rival' && slotState.shieldCardId === null) {
      return withBudget({ kind: 'capture', cost: selectedCard.energyCost + 1 }, playerEnergy);
    }
    return { kind: 'none' };
  }

  if (selectedCard?.kind === 'shield' && slotState?.owner === 'player' && slotState.shieldCardId === null) {
    return withBudget({ kind: 'harden', cost: selectedCard.energyCost }, playerEnergy);
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
