/**
 * Deterministic deck construction, seeded shuffling, and draw/recycle mechanics.
 */

import type { ArchitectureBlueprint, CatalogCard } from '../../catalog';
import type { HandCardInstance } from './match-types';

export const HAND_LIMIT = 6;
export const MAX_TURN_ENERGY = 6;

export interface DeckDealResult {
  readonly hand: readonly HandCardInstance[];
  readonly drawPile: readonly HandCardInstance[];
  readonly discardPile: readonly HandCardInstance[];
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  const nextRand = createSeededRandom(seed);

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(nextRand() * (i + 1));
    const current = copy[i];
    copy[i] = copy[swapIndex] as T;
    copy[swapIndex] = current as T;
  }

  return copy;
}

function collectScenarioCardIds(
  blueprint: ArchitectureBlueprint,
  allCards: readonly CatalogCard[],
): string[] {
  // Include two copies of every slot's primary service so no slot can become unplayable
  const cardIds: string[] = [];
  for (const slot of blueprint.slots) {
    const primary = slot.acceptedServiceIds[0];
    if (primary !== undefined) {
      cardIds.push(primary, primary);
    }
    const secondary = slot.acceptedServiceIds[1];
    if (secondary !== undefined) {
      cardIds.push(secondary);
    }
  }

  // Add blueprint distractors to test architectural discrimination
  for (const distractorId of blueprint.distractorServiceIds) {
    cardIds.push(distractorId);
  }

  // Add provisioning energy cards and security shields
  const energyCards = allCards.filter((c) => c.kind === 'energy');
  for (const energy of energyCards) {
    cardIds.push(energy.id, energy.id);
  }

  const shieldCards = allCards.filter((c) => c.kind === 'shield');
  for (const shield of shieldCards) {
    cardIds.push(shield.id);
  }

  return cardIds;
}

export function dealScenarioDeck(
  blueprint: ArchitectureBlueprint,
  allCards: readonly CatalogCard[],
  seed: number,
  instancePrefix = 'card',
): DeckDealResult {
  // Build and shuffle card instances
  const rawCardIds = collectScenarioCardIds(blueprint, allCards);
  const shuffledIds = shuffleWithSeed(rawCardIds, seed);
  const instances: HandCardInstance[] = shuffledIds.map((cardId, idx) => ({
    instanceId: `${instancePrefix}-${seed}-${idx + 1}`,
    cardId,
  }));

  // Guarantee opening hand has at least one provisioning card and one valid service
  const validServices = new Set(blueprint.slots.flatMap((s) => s.acceptedServiceIds));
  const energySet = new Set(allCards.filter((c) => c.kind === 'energy').map((c) => c.id));
  const balanced = ensurePlayableOpening(instances, energySet, validServices);

  return {
    hand: balanced.slice(0, HAND_LIMIT),
    drawPile: balanced.slice(HAND_LIMIT),
    discardPile: [],
  };
}

function ensurePlayableOpening(
  deck: readonly HandCardInstance[],
  energyIds: ReadonlySet<string>,
  validServiceIds: ReadonlySet<string>,
): HandCardInstance[] {
  const working = [...deck];
  const opening = working.slice(0, HAND_LIMIT);

  if (!opening.some((inst) => energyIds.has(inst.cardId))) {
    const energyIdx = working.findIndex((inst, idx) => idx >= HAND_LIMIT && energyIds.has(inst.cardId));
    if (energyIdx > 0) {
      const first = working[0] as HandCardInstance;
      working[0] = working[energyIdx] as HandCardInstance;
      working[energyIdx] = first;
    }
  }

  const refreshedOpening = working.slice(0, HAND_LIMIT);
  if (!refreshedOpening.some((inst) => validServiceIds.has(inst.cardId))) {
    const svcIdx = working.findIndex((inst, idx) => idx >= HAND_LIMIT && validServiceIds.has(inst.cardId));
    if (svcIdx > 1) {
      const second = working[1] as HandCardInstance;
      working[1] = working[svcIdx] as HandCardInstance;
      working[svcIdx] = second;
    }
  }

  return working;
}

/**
 * Start-of-turn draw: refills the hand to `limit` from the draw pile. When the draw pile runs
 * dry, the discard pile is reshuffled (seeded, so replays stay deterministic) into a new one.
 */
export function drawUpToHandLimit(
  hand: readonly HandCardInstance[],
  drawPile: readonly HandCardInstance[],
  discardPile: readonly HandCardInstance[],
  reshuffleSeed: number,
  limit: number = HAND_LIMIT,
): DeckDealResult {
  const nextHand = [...hand];
  let nextDraw = [...drawPile];
  let nextDiscard = [...discardPile];

  while (nextHand.length < limit) {
    if (nextDraw.length === 0 && nextDiscard.length > 0) {
      nextDraw = shuffleWithSeed(nextDiscard, reshuffleSeed);
      nextDiscard = [];
    }
    const top = nextDraw.shift();
    if (top === undefined) {
      break;
    }
    nextHand.push(top);
  }

  return { hand: nextHand, drawPile: nextDraw, discardPile: nextDiscard };
}
