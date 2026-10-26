/**
 * Deterministic tactical AI Rival Architect turn logic.
 * Prioritizes capturing unshielded player nodes (after Turn 2), deploying open slots, and shielding.
 */

import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  CatalogCard,
  ServiceCard,
  ShieldCard,
} from '../../catalog';
import type { MatchState, SlotDeployment } from './match-types';
import { appendLog, finalizeIfComplete } from './placement-rules';
import {
  FLOW_SYNERGY_BONUS,
  RIVAL_CAPTURE_LOSS,
  countConnectedOwnedNeighbors,
} from './scoring';

const RIVAL_TURN_ENERGY_GRANT = 2;
const RIVAL_MAX_ENERGY = 5;

export function executeRivalArchitectTurn(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): MatchState {
  if (state.status === 'completed' || state.mode === 'study') {
    return state;
  }

  // Recharge Rival Architect deploy energy
  let working: MatchState = {
    ...state,
    rivalEnergy: Math.min(RIVAL_MAX_ENERGY, state.rivalEnergy + RIVAL_TURN_ENERGY_GRANT),
  };

  // Attempt one primary service move (capture unshielded node on Turn >= 3, else claim open slot)
  working = performRivalPrimaryMove(working, blueprint, cardsById);
  if (working.status === 'completed') {
    return working;
  }

  // Harden an unshielded Rival node if 1 energy remains
  return performRivalShieldMove(working, blueprint, cardsById);
}

function performRivalPrimaryMove(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): MatchState {
  const vulnerableSlot = state.turn >= 3 ? findUnshieldedPlayerSlot(state, blueprint) : undefined;
  if (vulnerableSlot !== undefined && state.rivalEnergy >= 3) {
    return captureUnshieldedPlayerSlot(state, blueprint, vulnerableSlot, cardsById);
  }

  const openSlot = blueprint.slots.find((slot) => state.slots[slot.id]?.owner === null);
  if (openSlot === undefined) {
    return state;
  }

  const primaryCard = resolvePrimaryService(openSlot, cardsById);
  if (primaryCard === undefined || state.rivalEnergy < primaryCard.energyCost) {
    return appendRivalReserveLog(state);
  }

  return deployRivalOpenSlot(state, blueprint, openSlot, primaryCard);
}

function findUnshieldedPlayerSlot(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
): ArchitectureSlot | undefined {
  return blueprint.slots.find((slot) => {
    const deployed = state.slots[slot.id];
    return deployed?.owner === 'player' && deployed.shieldCardId === null;
  });
}

function resolvePrimaryService(
  slot: ArchitectureSlot,
  cardsById: Readonly<Record<string, CatalogCard>>,
): ServiceCard | undefined {
  const primaryId = slot.acceptedServiceIds[0];
  const candidate = primaryId !== undefined ? cardsById[primaryId] : undefined;
  return candidate?.kind === 'service' ? candidate : undefined;
}

function captureUnshieldedPlayerSlot(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  slot: ArchitectureSlot,
  cardsById: Readonly<Record<string, CatalogCard>>,
): MatchState {
  const svc = resolvePrimaryService(slot, cardsById);
  if (svc === undefined) {
    return state;
  }

  const updatedSlot: SlotDeployment = {
    slotId: slot.id,
    owner: 'rival',
    serviceCardId: svc.id,
    shieldCardId: null,
    shieldMatchedRecommendation: false,
  };

  const points = Math.round(svc.basePoints * 0.85) + 20;
  const logs = appendLog(state.logs, state.turn, 'rival', {
    severity: 'rival',
    headline: `Rival Compromised Unshielded ${slot.title}!`,
    detail: `Because ${slot.title} lacked a Security Shield (${slot.recommendedShield}), the Rival took it over with ${svc.title}.`,
    pointsDelta: points,
  });

  return {
    ...state,
    rivalEnergy: Math.max(0, state.rivalEnergy - 3),
    rivalScore: state.rivalScore + points,
    playerScore: Math.max(0, state.playerScore - RIVAL_CAPTURE_LOSS),
    slots: { ...state.slots, [slot.id]: updatedSlot },
    logs,
  };
}

function deployRivalOpenSlot(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  slot: ArchitectureSlot,
  svc: ServiceCard,
): MatchState {
  const synergies = countConnectedOwnedNeighbors(blueprint, state.slots, slot.id, 'rival');
  const points = Math.round(svc.basePoints * 0.85) + synergies * FLOW_SYNERGY_BONUS;

  const updatedSlot: SlotDeployment = {
    slotId: slot.id,
    owner: 'rival',
    serviceCardId: svc.id,
    shieldCardId: null,
    shieldMatchedRecommendation: false,
  };

  const logs = appendLog(state.logs, state.turn, 'rival', {
    severity: 'rival',
    headline: `Rival Deployed ${svc.title} -> ${slot.title}`,
    detail: `Slot remains UNSHIELDED right now—you can capture it for ${svc.energyCost + 1} Energy before Rival hardens it!`,
    pointsDelta: points,
  });

  const nextState: MatchState = {
    ...state,
    rivalEnergy: state.rivalEnergy - svc.energyCost,
    rivalScore: state.rivalScore + points,
    slots: { ...state.slots, [slot.id]: updatedSlot },
    logs,
  };

  return finalizeIfComplete(nextState, blueprint);
}

function appendRivalReserveLog(state: MatchState): MatchState {
  return {
    ...state,
    logs: appendLog(state.logs, state.turn, 'rival', {
      severity: 'rival',
      headline: 'Rival Provisioned Terraform Capacity',
      detail: 'Rival banked Deploy Energy for a high-tier service deployment next turn.',
      pointsDelta: 10,
    }),
    rivalScore: state.rivalScore + 10,
  };
}

function performRivalShieldMove(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  cardsById: Readonly<Record<string, CatalogCard>>,
): MatchState {
  const rivalUnshielded = state.rivalEnergy >= 1 ? findUnshieldedRivalSlot(state, blueprint) : undefined;
  const shieldCard = rivalUnshielded !== undefined ? findRecommendedShield(rivalUnshielded, cardsById) : undefined;
  const existing = rivalUnshielded !== undefined ? state.slots[rivalUnshielded.id] : undefined;

  if (rivalUnshielded === undefined || shieldCard === undefined || existing === undefined) {
    return state;
  }

  const logs = appendLog(state.logs, state.turn, 'rival', {
    severity: 'rival',
    headline: `Rival Hardened ${rivalUnshielded.title} with ${shieldCard.title}`,
    detail: 'Rival locked this perimeter node against capture (+45 Rival pts).',
    pointsDelta: 45,
  });

  return {
    ...state,
    rivalEnergy: state.rivalEnergy - 1,
    rivalScore: state.rivalScore + 45,
    slots: {
      ...state.slots,
      [rivalUnshielded.id]: { ...existing, shieldCardId: shieldCard.id, shieldMatchedRecommendation: true },
    },
    logs,
  };
}

function findUnshieldedRivalSlot(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
): ArchitectureSlot | undefined {
  return blueprint.slots.find((slot) => {
    const deployed = state.slots[slot.id];
    return deployed?.owner === 'rival' && deployed.shieldCardId === null;
  });
}

function findRecommendedShield(
  slot: ArchitectureSlot,
  cardsById: Readonly<Record<string, CatalogCard>>,
): ShieldCard | undefined {
  return Object.values(cardsById).find(
    (c): c is ShieldCard => c.kind === 'shield' && c.capability === slot.recommendedShield,
  );
}
