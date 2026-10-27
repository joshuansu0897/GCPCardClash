/**
 * Deterministic Rival Architect AI. The Rival holds a real hand drawn from its own deck and may
 * only play cards it holds, paying the same costs as the player through `performCardAction`.
 * A turn is returned as a list of intermediate states so the UI can play it out step by step.
 *
 * Profiles differ only in tactics, never in rules:
 * - `standard` deploys once and shields once per turn, claiming open slots in blueprint order.
 * - `boss` chains several moves, captures from Turn 2, and picks the highest-value target.
 */

import type { ArchitectureBlueprint, CatalogCard, ServiceCard, ShieldCard } from '../../catalog';
import { readSide, writeSide } from './architect-side';
import { incidentDeployBonus, quoteServiceCost, quoteShieldCost } from './cost-rules';
import { drawUpToHandLimit } from './deck-rules';
import type { HandCardInstance, MatchState, RivalProfile } from './match-types';
import { logAction } from './placement-rules';
import {
  CAPTURE_SWING_BONUS,
  CAPTURE_VICTIM_LOSS,
  FLOW_SYNERGY_BONUS,
  countConnectedOwnedNeighbors,
} from './scoring';
import { type CardAction, performCardAction } from './turn-actions';

interface RivalTactics {
  readonly maxDeploys: number;
  readonly maxShields: number;
  readonly maxDiscards: number;
  readonly captureFromTurn: number;
  readonly optimize: boolean;
}

const TACTICS: Readonly<Record<RivalProfile, RivalTactics>> = {
  standard: { maxDeploys: 1, maxShields: 1, maxDiscards: 1, captureFromTurn: 3, optimize: false },
  boss: { maxDeploys: 3, maxShields: 2, maxDiscards: 6, captureFromTurn: 2, optimize: true },
};

const MAX_ACTIONS_PER_TURN = 16;

interface TurnCounters {
  deploys: number;
  shields: number;
  discards: number;
}

type PlannedAction = { readonly kind: keyof TurnCounters | 'energy'; readonly action: CardAction };

interface HeldCard<C extends CatalogCard> {
  readonly item: HandCardInstance;
  readonly card: C;
}

/** Start-of-turn upkeep, identical to the player's: +1 Energy (capped) and a draw back up to the hand limit. */
export function beginRivalTurn(state: MatchState): MatchState {
  const side = readSide(state, 'rival');
  return writeSide(state, 'rival', {
    energy: Math.min(state.maxEnergy, side.energy + 1),
    ...drawUpToHandLimit(side.hand, side.drawPile, side.discardPile, state.seed * 29 + state.turn),
  });
}

export function planRivalTurn(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): readonly MatchState[] {
  if (state.status === 'completed' || state.mode === 'study') {
    return [];
  }

  const tactics = TACTICS[state.rivalProfile];
  const counters: TurnCounters = { deploys: 0, shields: 0, discards: 0 };
  const steps: MatchState[] = [];
  let working = beginRivalTurn(state);

  for (let guard = 0; guard < MAX_ACTIONS_PER_TURN; guard += 1) {
    const planned = chooseRivalAction(working, blueprint, cardsById, tactics, counters);
    if (planned === null) {
      break;
    }
    const next = performCardAction(working, blueprint, cardsById, 'rival', planned.action);
    if (next === working) {
      break;
    }
    if (planned.kind !== 'energy') {
      counters[planned.kind] += 1;
    }
    working = next;
    steps.push(working);
    if (working.status === 'completed') {
      return steps;
    }
  }

  if (steps.length === 0) {
    steps.push(
      logAction(working, 'rival', {
        severity: 'rival',
        headline: 'Passed the Turn',
        detail: 'Holding cards and banking Energy for a bigger play.',
        pointsDelta: 0,
      }),
    );
  }
  return steps;
}

function chooseRivalAction(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
  tactics: RivalTactics,
  counters: TurnCounters,
): PlannedAction | null {
  const held = state.rivalHand
    .map((item) => ({ item, card: cardsById[item.cardId] }))
    .filter((h): h is HeldCard<CatalogCard> => h.card !== undefined);

  const energyCard = held.find((h) => h.card.kind === 'energy');
  if (energyCard !== undefined && state.rivalEnergy < state.maxEnergy) {
    return { kind: 'energy', action: { type: 'play-energy', instanceId: energyCard.item.instanceId } };
  }

  if (counters.deploys < tactics.maxDeploys) {
    const deploy = pickDeploy(state, blueprint, held, tactics);
    if (deploy !== null) {
      return { kind: 'deploys', action: deploy };
    }
  }

  if (counters.shields < tactics.maxShields) {
    const shield = pickShield(state, blueprint, held, tactics);
    if (shield !== null) {
      return { kind: 'shields', action: shield };
    }
  }

  if (counters.discards < tactics.maxDiscards) {
    const dead = held.find((h) => isDeadCard(state, blueprint, h.card));
    if (dead !== undefined) {
      return { kind: 'discards', action: { type: 'discard-card', instanceId: dead.item.instanceId } };
    }
  }

  return null;
}

interface DeployCandidate {
  readonly instanceId: string;
  readonly slotId: string;
  readonly cost: number;
  readonly value: number;
  readonly isCapture: boolean;
}

function pickDeploy(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  held: readonly HeldCard<CatalogCard>[],
  tactics: RivalTactics,
): CardAction | null {
  const candidates: DeployCandidate[] = [];

  for (const { item, card } of held) {
    if (card.kind !== 'service') {
      continue;
    }
    for (const slot of blueprint.slots) {
      const candidate = evaluateDeploy(state, blueprint, item, card, slot.id, slot.acceptedServiceIds, tactics);
      if (candidate !== null) {
        candidates.push(candidate);
      }
    }
  }

  const chosen = tactics.optimize
    ? [...candidates].sort((a, b) => b.value - a.value || a.cost - b.cost)[0]
    : (candidates.find((c) => !c.isCapture) ?? candidates[0]);

  return chosen !== undefined
    ? { type: 'deploy-service', instanceId: chosen.instanceId, slotId: chosen.slotId }
    : null;
}

function evaluateDeploy(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  item: HandCardInstance,
  card: ServiceCard,
  slotId: string,
  accepted: readonly string[],
  tactics: RivalTactics,
): DeployCandidate | null {
  if (!accepted.includes(card.id)) {
    return null;
  }
  const slotState = state.slots[slotId];
  const cost = quoteServiceCost(state, 'rival', card, slotState);
  if (cost === null || cost > state.rivalEnergy) {
    return null;
  }
  const isCapture = slotState?.owner === 'player';
  if (isCapture && state.turn < tactics.captureFromTurn) {
    return null;
  }

  const ownSynergy = countConnectedOwnedNeighbors(blueprint, state.slots, slotId, 'rival') * FLOW_SYNERGY_BONUS;
  const brokenPlayerSynergy = isCapture
    ? countConnectedOwnedNeighbors(blueprint, state.slots, slotId, 'player') * FLOW_SYNERGY_BONUS
    : 0;
  const value =
    card.basePoints +
    ownSynergy +
    incidentDeployBonus(state, blueprint, slotId) +
    (isCapture ? CAPTURE_SWING_BONUS + CAPTURE_VICTIM_LOSS + brokenPlayerSynergy : 0);

  return { instanceId: item.instanceId, slotId, cost, value, isCapture };
}

function pickShield(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  held: readonly HeldCard<CatalogCard>[],
  tactics: RivalTactics,
): CardAction | null {
  const shields = held.filter((h): h is HeldCard<ShieldCard> => h.card.kind === 'shield');
  let best: { readonly action: CardAction; readonly value: number } | null = null;

  for (const slot of blueprint.slots) {
    const deployed = state.slots[slot.id];
    if (deployed?.owner !== 'rival' || deployed.shieldCardId !== null) {
      continue;
    }
    for (const { item, card } of shields) {
      if (quoteShieldCost(state, card) > state.rivalEnergy) {
        continue;
      }
      const matched = card.capability === slot.recommendedShield;
      const connections = countConnectedOwnedNeighbors(blueprint, state.slots, slot.id, 'rival');
      const value = (matched ? 100 : 0) + (tactics.optimize ? connections * 10 : 0);
      if (best === null || value > best.value) {
        best = { action: { type: 'apply-shield', instanceId: item.instanceId, slotId: slot.id }, value };
      }
    }
    if (!tactics.optimize && best !== null) {
      break;
    }
  }

  return best?.action ?? null;
}

/** A card the Rival cannot use on this board right now — the one worth discarding. */
function isDeadCard(state: MatchState, blueprint: ArchitectureBlueprint, card: CatalogCard): boolean {
  if (card.kind === 'energy') {
    return state.rivalEnergy >= state.maxEnergy;
  }
  if (card.kind === 'shield') {
    return false;
  }
  return !blueprint.slots.some((slot) => {
    const deployed = state.slots[slot.id];
    return (
      slot.acceptedServiceIds.includes(card.id) &&
      (deployed?.owner === null || (deployed?.owner === 'player' && deployed.shieldCardId === null))
    );
  });
}
