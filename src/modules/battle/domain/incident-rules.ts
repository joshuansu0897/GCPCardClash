/**
 * Cloud Incident event deck. Incidents strike both architects symmetrically at the start of a
 * turn on a fixed cadence (every 3 turns, every 2 in a boss battle) and either apply an instant
 * effect or bend the rules for the rest of that turn. Draws are seeded and fully deterministic.
 */

import type { ArchitectureBlueprint, SubsystemInk } from '../../catalog';
import { adjustScore, readSide, writeSide } from './architect-side';
import { createSeededRandom } from './deck-rules';
import type { MatchState, SlotDeployment } from './match-types';
import { appendLog } from './turn-log';

export const STANDARD_INCIDENT_CADENCE = 3;
export const BOSS_INCIDENT_CADENCE = 2;

export type IncidentTone = 'boon' | 'hazard' | 'twist';

export type IncidentEffect =
  | { readonly kind: 'energy'; readonly delta: number }
  | {
      readonly kind: 'node-score';
      readonly filter: 'unshielded' | 'optimal-shield';
      readonly zoneInk?: SubsystemInk;
      readonly points: number;
    }
  | { readonly kind: 'strip-suboptimal-shields' }
  | { readonly kind: 'outage'; readonly zoneInk?: SubsystemInk; readonly penalty: number };

export interface RoundModifiers {
  readonly captureCostDelta?: number;
  readonly shieldCostOverride?: number;
  readonly deployBonus?: { readonly zoneInk: SubsystemInk; readonly points: number };
}

export interface IncidentCard {
  readonly id: string;
  readonly title: string;
  readonly tone: IncidentTone;
  readonly flavor: string;
  readonly rule: string;
  readonly lesson: string;
  readonly effects: readonly IncidentEffect[];
  readonly modifiers?: RoundModifiers;
  /** Signature incidents only appear in their boss's battles. */
  readonly bossOnly?: boolean;
}

export const INCIDENT_DECK: readonly IncidentCard[] = [
  {
    id: 'traffic-surge',
    title: 'Viral Traffic Surge',
    tone: 'boon',
    flavor: 'A launch post hits the front page and requests spike 40x.',
    rule: 'This turn, deploying into an Edge zone scores +30 bonus points.',
    lesson: 'Edge caching and global load balancing absorb spikes before they reach your backends.',
    effects: [],
    modifiers: { deployBonus: { zoneInk: 'edge', points: 30 } },
  },
  {
    id: 'zero-day',
    title: 'Zero-Day Disclosure',
    tone: 'hazard',
    flavor: 'A critical CVE drops in a widely used base image.',
    rule: 'This turn, capturing an unshielded node costs 1 less Energy.',
    lesson: 'Unhardened workloads are the first to fall when a new exploit is published.',
    effects: [],
    modifiers: { captureCostDelta: -1 },
  },
  {
    id: 'budget-freeze',
    title: 'Quarter-End Budget Freeze',
    tone: 'hazard',
    flavor: 'Finance pauses all new spend until the books close.',
    rule: 'Both architects lose 1 Energy.',
    lesson: 'Committed-use discounts and scale-to-zero services keep you shipping when budgets tighten.',
    effects: [{ kind: 'energy', delta: -1 }],
  },
  {
    id: 'free-tier-credits',
    title: 'Startup Credits Approved',
    tone: 'boon',
    flavor: 'Your program application came through.',
    rule: 'Both architects gain 1 Energy.',
    lesson: 'Credits buy time, not architecture — spend them on durable, well-shaped foundations.',
    effects: [{ kind: 'energy', delta: 1 }],
  },
  {
    id: 'compliance-audit',
    title: 'Surprise Compliance Audit',
    tone: 'twist',
    flavor: 'The auditors arrive a week early.',
    rule: 'Each node with its optimal control earns its owner +20. Each unshielded node costs its owner 10.',
    lesson: 'Choosing the recommended control for each tier is what auditors actually check.',
    effects: [
      { kind: 'node-score', filter: 'optimal-shield', points: 20 },
      { kind: 'node-score', filter: 'unshielded', points: -10 },
    ],
  },
  {
    id: 'hot-patch-window',
    title: 'Emergency Patch Window',
    tone: 'boon',
    flavor: 'Change control waives approvals for security fixes today.',
    rule: 'This turn, attaching a Security Shield costs 0 Energy.',
    lesson: 'Automated policy rollout (Org Policy, IaC) makes hardening cheap — do it early.',
    effects: [],
    modifiers: { shieldCostOverride: 0 },
  },
  {
    id: 'regional-outage',
    title: 'Zonal Outage',
    tone: 'hazard',
    flavor: 'A zone goes dark after a power event.',
    rule: 'One random zone loses its unshielded nodes; they return to OPEN and each owner loses 30.',
    lesson: 'Regional, multi-zone services and hardened nodes ride out single-zone failures.',
    effects: [{ kind: 'outage', penalty: 30 }],
  },
  {
    id: 'change-freeze',
    title: 'Mainframe Change Freeze',
    tone: 'hazard',
    bossOnly: true,
    flavor: 'The Monolith declares a freeze: nothing moves without a 6-week CAB review.',
    rule: 'This turn, capturing a node costs 1 more Energy.',
    lesson: 'Heavy change control slows remediation as much as it slows attackers.',
    effects: [],
    modifiers: { captureCostDelta: 1 },
  },
  {
    id: 'privilege-escalation',
    title: 'Privilege Escalation',
    tone: 'hazard',
    bossOnly: true,
    flavor: 'Shadow Admin finds an owner-role key in a public repo.',
    rule: 'Every shield that is NOT the recommended control is stripped from its node.',
    lesson: 'The wrong control gives a false sense of safety — match the control to the threat.',
    effects: [{ kind: 'strip-suboptimal-shields' }],
  },
  {
    id: 'schema-drift',
    title: 'Schema Drift',
    tone: 'hazard',
    bossOnly: true,
    flavor: 'The Data Swamp silently renames half the columns overnight.',
    rule: 'Unshielded nodes in Data zones cost their owner 25.',
    lesson: 'Governed datasets (Dataplex, VPC-SC perimeters) keep pipelines trustworthy.',
    effects: [{ kind: 'node-score', filter: 'unshielded', zoneInk: 'data', points: -25 }],
  },
  {
    id: 'prompt-injection',
    title: 'Prompt Injection Wave',
    tone: 'hazard',
    bossOnly: true,
    flavor: 'The Hallucinator floods every endpoint with jailbreak payloads.',
    rule: 'Unshielded nodes in AI zones go offline (return to OPEN) and each owner loses 30.',
    lesson: 'Model Armor, IAP, and VPC-SC belong in front of every generative endpoint.',
    effects: [{ kind: 'outage', zoneInk: 'ai', penalty: 30 }],
  },
];

const INCIDENTS_BY_ID: Readonly<Record<string, IncidentCard>> = Object.fromEntries(
  INCIDENT_DECK.map((card) => [card.id, card]),
);

export function getIncidentCard(incidentId: string): IncidentCard | undefined {
  return INCIDENTS_BY_ID[incidentId];
}

export function getActiveModifiers(state: MatchState): RoundModifiers {
  const card = state.incident !== null ? getIncidentCard(state.incident.incidentId) : undefined;
  return card?.modifiers ?? {};
}

export function incidentCadence(state: MatchState): number {
  return state.rivalProfile === 'boss' ? BOSS_INCIDENT_CADENCE : STANDARD_INCIDENT_CADENCE;
}

/**
 * Picks the incident for `turn`, or `null` when no incident is due.
 * Boss battles alternate between the boss's signature incident and the general deck.
 */
export function drawIncidentForTurn(
  state: MatchState,
  turn: number,
  signatureIncidentId: string | null,
): IncidentCard | null {
  const cadence = incidentCadence(state);
  if (state.mode === 'study' || turn < cadence || turn % cadence !== 0) {
    return null;
  }
  const strike = turn / cadence;
  if (signatureIncidentId !== null && strike % 2 === 0) {
    return getIncidentCard(signatureIncidentId) ?? null;
  }
  const general = INCIDENT_DECK.filter((card) => card.bossOnly !== true);
  const rand = createSeededRandom(state.seed * 31 + turn * 7919);
  return general[Math.floor(rand() * general.length)] ?? null;
}

/** Applies an incident's instant effects to both architects and records it as the active incident. */
export function strikeIncident(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  card: IncidentCard,
): MatchState {
  let affectedZoneId: string | null = null;
  let working = state;

  for (const effect of card.effects) {
    if (effect.kind === 'outage') {
      const zone = pickOutageZone(state, blueprint, effect.zoneInk);
      affectedZoneId = zone?.id ?? null;
      working = zone !== undefined ? applyOutage(working, blueprint, zone.id, effect.penalty) : working;
    } else {
      working = applyInstantEffect(working, blueprint, effect);
    }
  }

  const zoneNote = affectedZoneId !== null
    ? ` Affected zone: ${blueprint.zones.find((z) => z.id === affectedZoneId)?.label ?? affectedZoneId}.`
    : '';

  return {
    ...working,
    incident: { incidentId: card.id, turn: state.turn, affectedZoneId },
    logs: appendLog(working.logs, state.turn, 'system', {
      severity: 'incident',
      headline: `INCIDENT — ${card.title}`,
      detail: `${card.rule}${zoneNote} ${card.lesson}`,
      pointsDelta: 0,
    }),
  };
}

function applyInstantEffect(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  effect: Exclude<IncidentEffect, { readonly kind: 'outage' }>,
): MatchState {
  switch (effect.kind) {
    case 'energy':
      return (['player', 'rival'] as const).reduce(
        (acc, actor) =>
          writeSide(acc, actor, {
            energy: Math.min(acc.maxEnergy, Math.max(0, readSide(acc, actor).energy + effect.delta)),
          }),
        state,
      );
    case 'node-score':
      return applyNodeScore(state, blueprint, effect.filter, effect.zoneInk, effect.points);
    case 'strip-suboptimal-shields': {
      const slots: Record<string, SlotDeployment> = { ...state.slots };
      for (const [slotId, slot] of Object.entries(state.slots)) {
        if (slot.shieldCardId !== null && !slot.shieldMatchedRecommendation) {
          slots[slotId] = { ...slot, shieldCardId: null };
        }
      }
      return { ...state, slots };
    }
  }
}

function applyNodeScore(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  filter: 'unshielded' | 'optimal-shield',
  zoneInk: SubsystemInk | undefined,
  points: number,
): MatchState {
  let working = state;
  for (const slot of blueprint.slots) {
    const deployed = state.slots[slot.id];
    if (deployed?.owner == null || deployed.serviceCardId === null) {
      continue;
    }
    if (zoneInk !== undefined && blueprint.zones.find((z) => z.id === slot.zoneId)?.ink !== zoneInk) {
      continue;
    }
    const matches = filter === 'unshielded'
      ? deployed.shieldCardId === null
      : deployed.shieldCardId !== null && deployed.shieldMatchedRecommendation;
    if (matches) {
      working = adjustScore(working, deployed.owner, points);
    }
  }
  return working;
}

function pickOutageZone(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  zoneInk: SubsystemInk | undefined,
) {
  const candidates = blueprint.zones.filter((z) => zoneInk === undefined || z.ink === zoneInk);
  if (candidates.length === 0) {
    return undefined;
  }
  const rand = createSeededRandom(state.seed * 17 + state.turn * 104729);
  return candidates[Math.floor(rand() * candidates.length)];
}

function applyOutage(
  state: MatchState,
  blueprint: ArchitectureBlueprint,
  zoneId: string,
  penalty: number,
): MatchState {
  let working = state;
  const slots: Record<string, SlotDeployment> = { ...state.slots };
  for (const slot of blueprint.slots.filter((s) => s.zoneId === zoneId)) {
    const deployed = state.slots[slot.id];
    if (deployed?.owner == null || deployed.shieldCardId !== null) {
      continue;
    }
    working = adjustScore(working, deployed.owner, -penalty);
    slots[slot.id] = { ...deployed, owner: null, serviceCardId: null, shieldMatchedRecommendation: false };
  }
  return { ...working, slots };
}

