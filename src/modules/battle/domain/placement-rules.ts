/**
 * Pure card placement, energy provisioning, capture, and anti-pattern rules.
 * Every rule takes an `actor` and reads/writes that architect's side, so the Rival is held
 * to exactly the same costs, limits, and penalties as the player.
 */

import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  EnergyCard,
  ServiceCard,
} from '../../catalog';
import { adjustScore, opponentOf, readSide, writeSide } from './architect-side';
import { incidentDeployBonus, quoteServiceCost } from './cost-rules';
import type {
  HandCardInstance,
  MatchState,
  PlayerActor,
  SlotDeployment,
} from './match-types';
import {
  CAPTURE_SWING_BONUS,
  CAPTURE_VICTIM_LOSS,
  FLOW_SYNERGY_BONUS,
  areAllSlotsDeployed,
  countConnectedOwnedNeighbors,
  evaluateMatchOutcome,
} from './scoring';
import { type LogDraft, appendLog } from './turn-log';

export { appendLog } from './turn-log';

export interface ServiceDeployInput {
  readonly state: MatchState;
  readonly blueprint: ArchitectureBlueprint;
  readonly actor: PlayerActor;
  readonly handItem: HandCardInstance;
  readonly card: ServiceCard;
  readonly slotId: string;
}

/** Logs an action for `actor`; Rival entries are tagged and prefixed so the feed reads clearly. */
export function logAction(state: MatchState, actor: PlayerActor, draft: LogDraft): MatchState {
  const entry = actor === 'rival' ? { ...draft, severity: 'rival' as const, headline: `Rival ${draft.headline}` } : draft;
  return { ...state, logs: appendLog(state.logs, state.turn, actor, entry) };
}

export function logSystem(state: MatchState, draft: LogDraft): MatchState {
  return { ...state, logs: appendLog(state.logs, state.turn, 'system', draft) };
}

export function consumeHandInstance(
  state: MatchState,
  actor: PlayerActor,
  instanceId: string,
): MatchState {
  const side = readSide(state, actor);
  const target = side.hand.find((item) => item.instanceId === instanceId);
  return writeSide(state, actor, {
    hand: side.hand.filter((item) => item.instanceId !== instanceId),
    discardPile: target !== undefined ? [...side.discardPile, target] : side.discardPile,
  });
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
    headline: outcome.bossDefeated
      ? `BOSS DEFEATED — ${outcome.stars} Star(s)`
      : `Blueprint Complete — ${outcome.stars} Star(s)`,
    detail: outcome.summary,
    pointsDelta: 0,
  });

  return { ...state, status: 'completed', outcome, logs };
}

export function applyEnergyCard(
  state: MatchState,
  actor: PlayerActor,
  handItem: HandCardInstance,
  card: EnergyCard,
): MatchState {
  const side = readSide(state, actor);
  const nextEnergy = Math.min(state.maxEnergy, side.energy + card.energyGrant);
  const gained = nextEnergy - side.energy;

  const consumed = consumeHandInstance(state, actor, handItem.instanceId);
  const funded = writeSide(consumed, actor, { energy: nextEnergy, score: side.score + card.bonusPoints });

  return logAction(funded, actor, {
    severity: 'energy',
    headline: `Provisioned via ${card.title} (+${gained} Energy)`,
    detail: card.examTip,
    pointsDelta: card.bonusPoints,
  });
}

export function applyServiceDeployment(input: ServiceDeployInput): MatchState {
  const { state, actor, card, slotId } = input;
  const specSlot = input.blueprint.slots.find((s) => s.id === slotId);
  const slotState = state.slots[slotId];

  if (specSlot === undefined || slotState === undefined) {
    return state;
  }

  const blockReason = checkSlotDeployEligibility(state, actor, slotState, card);
  if (blockReason !== null) {
    // Illegal targets are explained to the player and silently skipped for the Rival.
    return actor === 'player' ? logSystem(state, blockReason) : state;
  }

  // Reject anti-pattern service choices with -1 energy diagnostic penalty
  if (!specSlot.acceptedServiceIds.includes(card.id)) {
    return applyMistakePenalty(state, actor, specSlot, card);
  }

  return commitValidServiceDeploy(input, specSlot, slotState);
}

function checkSlotDeployEligibility(
  state: MatchState,
  actor: PlayerActor,
  slotState: SlotDeployment,
  card: ServiceCard,
): LogDraft | null {
  if (slotState.owner === actor) {
    return {
      severity: 'system',
      headline: 'Slot Already Owned by You',
      detail: 'Select a Security & Governance Shield card to harden this node against capture.',
      pointsDelta: 0,
    };
  }

  const cost = quoteServiceCost(state, actor, card, slotState);
  if (cost === null) {
    return {
      severity: 'system',
      headline: 'Node Hardened by Security Shield',
      detail: 'Defense-in-depth blocks takeover of shielded nodes. Target an open or unshielded slot.',
      pointsDelta: 0,
    };
  }

  const energy = readSide(state, actor).energy;
  if (energy < cost) {
    return {
      severity: 'system',
      headline: `Insufficient Deploy Energy (Need ${cost}, Have ${energy})`,
      detail: 'Play a Provisioning tool card (Cloud Console, gcloud, Terraform) or End Turn to recharge.',
      pointsDelta: 0,
    };
  }

  return null;
}

function applyMistakePenalty(
  state: MatchState,
  actor: PlayerActor,
  specSlot: ArchitectureSlot,
  card: ServiceCard,
): MatchState {
  const side = readSide(state, actor);
  const reason = specSlot.antiPatternHints[card.id] ?? specSlot.defaultAntiPatternReason;
  const penalized = writeSide(state, actor, {
    energy: Math.max(0, side.energy - 1),
    mistakes: side.mistakes + 1,
  });

  return logAction(penalized, actor, {
    severity: 'mistake',
    headline: `Anti-Pattern on ${specSlot.title}: ${card.title} (-1 Energy)`,
    detail: reason,
    pointsDelta: 0,
  });
}

function commitValidServiceDeploy(
  input: ServiceDeployInput,
  specSlot: ArchitectureSlot,
  slotState: SlotDeployment,
): MatchState {
  const { state, blueprint, actor, handItem, card } = input;
  const isCapture = slotState.owner === opponentOf(actor);
  const energySpent = quoteServiceCost(state, actor, card, slotState) ?? card.energyCost;
  const synergies = countConnectedOwnedNeighbors(blueprint, state.slots, specSlot.id, actor);
  const incidentBonus = incidentDeployBonus(state, blueprint, specSlot.id);
  const pointsEarned =
    card.basePoints + synergies * FLOW_SYNERGY_BONUS + (isCapture ? CAPTURE_SWING_BONUS : 0) + incidentBonus;

  const side = readSide(state, actor);
  let next = consumeHandInstance(state, actor, handItem.instanceId);
  next = writeSide(next, actor, { energy: side.energy - energySpent, score: side.score + pointsEarned });
  if (isCapture) {
    next = adjustScore(next, opponentOf(actor), -CAPTURE_VICTIM_LOSS);
  }
  next = {
    ...next,
    slots: {
      ...next.slots,
      [specSlot.id]: {
        slotId: specSlot.id,
        owner: actor,
        serviceCardId: card.id,
        shieldCardId: null,
        shieldMatchedRecommendation: false,
      },
    },
  };

  const notes = [
    synergies > 0 ? `+${synergies * FLOW_SYNERGY_BONUS} Flow Synergy` : '',
    incidentBonus > 0 ? `+${incidentBonus} Incident Bonus` : '',
  ].filter((n) => n !== '');
  next = logAction(next, actor, {
    severity: isCapture ? 'capture' : 'deploy',
    headline: `${isCapture ? 'Captured' : 'Deployed'} ${specSlot.title} with ${card.title}${notes.length > 0 ? ` (${notes.join(', ')})` : ''}`,
    detail: specSlot.architecturalRationale,
    pointsDelta: pointsEarned,
  });

  return finalizeIfComplete(next, blueprint);
}
