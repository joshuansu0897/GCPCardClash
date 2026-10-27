/**
 * Pure topological synergy, completion check, and 3-star mastery scoring rules.
 */

import type { ArchitectureBlueprint } from '../../catalog';
import type { MatchOutcome, MatchState, PlayerActor, SlotDeployment } from './match-types';

export const FLOW_SYNERGY_BONUS = 40;
export const BASE_SHIELD_POINTS = 35;
export const RECOMMENDED_SHIELD_BONUS = 25;
export const CAPTURE_SWING_BONUS = 25;
/** Points the previous owner loses when one of their nodes is captured. */
export const CAPTURE_VICTIM_LOSS = 35;

export function countConnectedOwnedNeighbors(
  blueprint: ArchitectureBlueprint,
  slots: Readonly<Record<string, SlotDeployment>>,
  slotId: string,
  actor: PlayerActor,
): number {
  let count = 0;

  for (const edge of blueprint.edges) {
    const neighborId = getOtherEndpoint(edge.fromSlotId, edge.toSlotId, slotId);
    if (neighborId !== null && slots[neighborId]?.owner === actor) {
      count += 1;
    }
  }

  return count;
}

function getOtherEndpoint(fromId: string, toId: string, targetId: string): string | null {
  if (fromId === targetId) {
    return toId;
  }
  if (toId === targetId) {
    return fromId;
  }
  return null;
}

export function areAllSlotsDeployed(
  blueprint: ArchitectureBlueprint,
  slots: Readonly<Record<string, SlotDeployment>>,
): boolean {
  return blueprint.slots.every((slot) => {
    const deployed = slots[slot.id];
    return deployed !== undefined && deployed.serviceCardId !== null;
  });
}

export function countShieldedPlayerNodes(
  slots: Readonly<Record<string, SlotDeployment>>,
): number {
  let count = 0;
  for (const slotState of Object.values(slots)) {
    if (slotState.owner === 'player' && slotState.shieldCardId !== null) {
      count += 1;
    }
  }
  return count;
}

export function evaluateMatchOutcome(state: MatchState): MatchOutcome {
  // Count defense-in-depth hardened nodes owned by player
  const shieldedPlayerNodes = countShieldedPlayerNodes(state.slots);

  if (state.mode === 'study') {
    return {
      winner: 'player',
      bossDefeated: false,
      stars: 1,
      shieldedPlayerNodes,
      summary: 'Guided Study walkthrough completed. Switch to Battle Mode to earn up to 3 Mastery Stars against the AI Rival.',
    };
  }

  // Resolve winner and 1-3 star mastery criteria
  const winner = resolveWinner(state.playerScore, state.rivalScore);
  const stars = computeBattleStars(winner, state.playerMistakes, shieldedPlayerNodes);
  const bossDefeated = state.rivalProfile === 'boss' && winner === 'player';
  const summary = bossDefeated
    ? `Boss defeated! ${formatOutcomeSummary(winner, stars, state.playerMistakes, shieldedPlayerNodes)}`
    : formatOutcomeSummary(winner, stars, state.playerMistakes, shieldedPlayerNodes);

  return { winner, bossDefeated, stars, summary, shieldedPlayerNodes };
}

function resolveWinner(playerScore: number, rivalScore: number): 'player' | 'rival' | 'tie' {
  if (playerScore > rivalScore) {
    return 'player';
  }
  if (rivalScore > playerScore) {
    return 'rival';
  }
  return 'tie';
}

function computeBattleStars(
  winner: 'player' | 'rival' | 'tie',
  mistakes: number,
  shieldedNodes: number,
): 1 | 2 | 3 {
  if (winner !== 'player') {
    return 1;
  }
  if (mistakes <= 1 && shieldedNodes >= 2) {
    return 3;
  }
  return 2;
}

function formatOutcomeSummary(
  winner: 'player' | 'rival' | 'tie',
  stars: 1 | 2 | 3,
  mistakes: number,
  shieldedNodes: number,
): string {
  if (stars === 3) {
    return `3-Star Cloud Architect Mastery! Outscored the Rival with ${mistakes} mistake(s) and ${shieldedNodes} security-hardened nodes.`;
  }
  if (winner === 'player') {
    return `Victory (2 Stars)! Harden at least 2 nodes with Security Shields and keep mistakes <= 1 to earn 3-Star Mastery.`;
  }
  return 'Blueprint completed (1 Star), but the Rival Architect outscored your deployment. Shield nodes early and chain flow synergies!';
}
