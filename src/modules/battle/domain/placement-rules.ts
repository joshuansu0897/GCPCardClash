/**
 * Pure card placement, energy provisioning, shield hardening, capture, and anti-pattern rules.
 */

import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  EnergyCard,
  ServiceCard,
  ShieldCard,
} from '../../catalog';
import { drawUpToHandLimit } from './deck-rules';
import type {
  HandCardInstance,
  MatchState,
  SlotDeployment,
  TurnLogEntry,
  TurnLogSeverity,
} from './match-types';
import {
  BASE_SHIELD_POINTS,
  CAPTURE_SWING_BONUS,
  FLOW_SYNERGY_BONUS,
  RECOMMENDED_SHIELD_BONUS,
  RIVAL_CAPTURE_LOSS,
  areAllSlotsDeployed,
  countConnectedOwnedNeighbors,
  evaluateMatchOutcome,
} from './scoring';

export interface ServiceDeployInput {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly handItem: HandCardInstance;
  readonly card: ServiceCard;
  readonly slotId: string;
}

export interface ShieldDeployInput {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly handItem: HandCardInstance;
  readonly card: ShieldCard;
  readonly slotId: string;
}

export function appendLog(
  logs: readonly TurnLogEntry[],
  turn: number,
  actor: 'player' | 'rival' | 'system',
  entry: { readonly severity: TurnLogSeverity; readonly headline: string; readonly detail: string; readonly pointsDelta: number },
): readonly TurnLogEntry[] {
  const nextEntry: TurnLogEntry = {
    id: `log-t${turn}-${logs.length + 1}`,
    turn,
    actor,
    severity: entry.severity,
    headline: entry.headline,
    detail: entry.detail,
    pointsDelta: entry.pointsDelta,
  };
  return [nextEntry, ...logs];
}

function consumeHandInstance(
  state: MatchState,
  instanceId: string,
): { readonly hand: readonly HandCardInstance[]; readonly discardPile: readonly HandCardInstance[] } {
  const target = state.hand.find((item) => item.instanceId === instanceId);
  const hand = state.hand.filter((item) => item.instanceId !== instanceId);
  const discardPile = target !== undefined ? [...state.discardPile, target] : state.discardPile;
  return { hand, discardPile };
}

export function finalizeIfComplete(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
): MatchState {
  if (!areAllSlotsDeployed(blueprint, state.slots)) {
    return state;
  }

  const outcome = evaluateMatchOutcome(state);
  const logs = appendLog(state.logs, state.turn, 'system', {
    severity: 'system',
    headline: `Blueprint Complete — ${outcome.stars} Star(s)`,
    detail: outcome.summary,
    pointsDelta: 0,
  });

  return { ...state, status: 'completed', outcome, logs };
}

export function applyEnergyCard(
  state: MatchState,
  handItem: HandCardInstance,
  card: EnergyCard,
): MatchState {
  // Calculate new energy cap and move card to discard
  const nextEnergy = Math.min(state.maxEnergy, state.playerEnergy + card.energyGrant);
  const gained = nextEnergy - state.playerEnergy;
  const piles = consumeHandInstance(state, handItem.instanceId);

  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'energy',
    headline: `Provisioned via ${card.title} (+${gained} Energy)`,
    detail: `${card.examTip}`,
    pointsDelta: card.bonusPoints,
  });

  return {
    ...state,
    playerEnergy: nextEnergy,
    playerScore: state.playerScore + card.bonusPoints,
    hand: piles.hand,
    discardPile: piles.discardPile,
    logs,
  };
}

export function applyServiceDeployment(input: ServiceDeployInput): MatchState {
  const { state, blueprint, handItem, card, slotId } = input;
  const specSlot = blueprint.slots.find((s) => s.id === slotId);
  const slotState = state.slots[slotId];

  // Validate slot existence and ownership preconditions
  if (specSlot === undefined || slotState === undefined) {
    return state;
  }

  const blockReason = checkSlotDeployEligibility(slotState, state.playerEnergy, card.energyCost);
  if (blockReason !== null) {
    return {
      ...state,
      logs: appendLog(state.logs, state.turn, 'system', blockReason),
    };
  }

  // Reject anti-pattern service choices with -1 energy diagnostic penalty
  if (!specSlot.acceptedServiceIds.includes(card.id)) {
    return applyMistakePenalty(state, specSlot, card);
  }

  // Commit valid deployment or unshielded rival capture
  return commitValidServiceDeploy(input, specSlot, slotState);
}

function checkSlotDeployEligibility(
  slotState: SlotDeployment,
  playerEnergy: number,
  cardCost: number,
): { readonly severity: TurnLogSeverity; readonly headline: string; readonly detail: string; readonly pointsDelta: number } | null {
  if (slotState.owner === 'player') {
    return {
      severity: 'system',
      headline: 'Slot Already Owned by You',
      detail: 'Select a Security & Governance Shield card to harden this node against Rival compromise.',
      pointsDelta: 0,
    };
  }

  if (slotState.owner === 'rival' && slotState.shieldCardId !== null) {
    return {
      severity: 'system',
      headline: 'Rival Slot Hardened by Security Shield',
      detail: 'Defense-in-depth blocks takeover of shielded nodes. Target an open or unshielded slot.',
      pointsDelta: 0,
    };
  }

  const requiredCost = slotState.owner === 'rival' ? cardCost + 1 : cardCost;
  if (playerEnergy < requiredCost) {
    return {
      severity: 'system',
      headline: `Insufficient Deploy Energy (Need ${requiredCost}, Have ${playerEnergy})`,
      detail: 'Play a Provisioning tool card (Cloud Console, gcloud, Terraform) or End Turn to recharge.',
      pointsDelta: 0,
    };
  }

  return null;
}

function applyMistakePenalty(
  state: MatchState,
  specSlot: ArchitectureSlot,
  card: ServiceCard,
): MatchState {
  const reason = specSlot.antiPatternHints[card.id] ?? specSlot.defaultAntiPatternReason;
  const nextEnergy = Math.max(0, state.playerEnergy - 1);

  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'mistake',
    headline: `Anti-Pattern on ${specSlot.title}: ${card.title} (-1 Energy)`,
    detail: reason,
    pointsDelta: 0,
  });

  return {
    ...state,
    playerEnergy: nextEnergy,
    playerMistakes: state.playerMistakes + 1,
    logs,
  };
}

function commitValidServiceDeploy(
  input: ServiceDeployInput,
  specSlot: ArchitectureSlot,
  slotState: SlotDeployment,
): MatchState {
  const { state, blueprint, handItem, card } = input;
  const isCapture = slotState.owner === 'rival';
  const energySpent = isCapture ? card.energyCost + 1 : card.energyCost;
  const synergies = countConnectedOwnedNeighbors(blueprint, state.slots, specSlot.id, 'player');
  const pointsEarned = card.basePoints + synergies * FLOW_SYNERGY_BONUS + (isCapture ? CAPTURE_SWING_BONUS : 0);
  const piles = consumeHandInstance(state, handItem.instanceId);

  const updatedSlot: SlotDeployment = {
    slotId: specSlot.id,
    owner: 'player',
    serviceCardId: card.id,
    shieldCardId: null,
    shieldMatchedRecommendation: false,
  };

  const synergyNote = synergies > 0 ? ` (+${synergies * FLOW_SYNERGY_BONUS} Flow Synergy)` : '';
  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: isCapture ? 'capture' : 'deploy',
    headline: `${isCapture ? 'Captured' : 'Deployed'} ${specSlot.title} with ${card.title}${synergyNote}`,
    detail: specSlot.architecturalRationale,
    pointsDelta: pointsEarned,
  });

  const nextState: MatchState = {
    ...state,
    playerEnergy: state.playerEnergy - energySpent,
    playerScore: state.playerScore + pointsEarned,
    rivalScore: isCapture ? Math.max(0, state.rivalScore - RIVAL_CAPTURE_LOSS) : state.rivalScore,
    hand: piles.hand,
    discardPile: piles.discardPile,
    slots: { ...state.slots, [specSlot.id]: updatedSlot },
    logs,
  };

  return finalizeIfComplete(nextState, blueprint);
}

export function applyShieldToSlot(input: ShieldDeployInput): MatchState {
  const { state, blueprint, handItem, card, slotId } = input;
  const specSlot = blueprint.slots.find((s) => s.id === slotId);
  const slotState = state.slots[slotId];

  // Validate ownership, unshielded status, and energy
  const rejection = checkShieldEligibility(specSlot, slotState, state.playerEnergy, card.energyCost);
  if (rejection !== null || specSlot === undefined || slotState === undefined) {
    return rejection === null
      ? state
      : { ...state, logs: appendLog(state.logs, state.turn, 'system', rejection) };
  }

  // Score recommended vs baseline security hardening
  const matched = card.capability === specSlot.recommendedShield;
  const points = BASE_SHIELD_POINTS + (matched ? RECOMMENDED_SHIELD_BONUS : 0);
  const piles = consumeHandInstance(state, handItem.instanceId);
  const updatedSlot: SlotDeployment = {
    ...slotState,
    shieldCardId: card.id,
    shieldMatchedRecommendation: matched,
  };

  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'shield',
    headline: `Hardened ${specSlot.title} with ${card.title}${matched ? ' (Optimal Control!)' : ''}`,
    detail: matched
      ? `Matched recommended perimeter control (${card.capability}) for +${points} pts and capture immunity.`
      : `Node is now immune to Rival compromise (+${points} pts). Recommended control was ${specSlot.recommendedShield}.`,
    pointsDelta: points,
  });

  return {
    ...state,
    playerEnergy: state.playerEnergy - card.energyCost,
    playerScore: state.playerScore + points,
    hand: piles.hand,
    discardPile: piles.discardPile,
    slots: { ...state.slots, [slotId]: updatedSlot },
    logs,
  };
}

function checkShieldEligibility(
  specSlot: ArchitectureSlot | undefined,
  slotState: SlotDeployment | undefined,
  playerEnergy: number,
  cost: number,
): { readonly severity: TurnLogSeverity; readonly headline: string; readonly detail: string; readonly pointsDelta: number } | null {
  if (specSlot === undefined || slotState === undefined || slotState.owner !== 'player') {
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
  if (playerEnergy < cost) {
    return {
      severity: 'system',
      headline: 'Cannot Attach Shield',
      detail: 'Need 1 Deploy Energy to attach a Security Shield.',
      pointsDelta: 0,
    };
  }
  return null;
}

export function discardAndDrawCard(
  state: MatchState,
  instanceId: string,
  cardTitle: string,
): MatchState {
  if (state.discardsRemaining <= 0) {
    return {
      ...state,
      logs: appendLog(state.logs, state.turn, 'system', {
        severity: 'system',
        headline: 'Discard Limit Reached (2 per Turn)',
        detail: 'End your turn to refresh discard capacity and draw back to 6 cards.',
        pointsDelta: 0,
      }),
    };
  }

  const consumed = consumeHandInstance(state, instanceId);
  const refilled = drawUpToHandLimit(consumed.hand, state.drawPile, consumed.discardPile);
  const logs = appendLog(state.logs, state.turn, 'player', {
    severity: 'system',
    headline: `Cycled ${cardTitle} from Hand`,
    detail: `Drew replacement card (${state.discardsRemaining - 1} discard(s) left this turn).`,
    pointsDelta: 0,
  });

  return {
    ...state,
    discardsRemaining: state.discardsRemaining - 1,
    hand: refilled.hand,
    drawPile: refilled.drawPile,
    discardPile: refilled.discardPile,
    logs,
  };
}
