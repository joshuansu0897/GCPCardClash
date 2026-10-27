/**
 * Track rivals. Every track has exactly one enemy, its boss, who plays under exactly the player's
 * rules. How sharply it plays (its tier) comes from the blueprint's difficulty, and every enemy
 * mixes its own signature incident into the incident deck.
 */

import type { DifficultyLevel, TrackId } from '../../catalog';
import type { RivalTier } from './match-types';

export interface RivalPersona {
  readonly id: string;
  readonly trackId: TrackId;
  readonly name: string;
  readonly epithet: string;
  readonly intro: string;
  readonly taunt: string;
  readonly defeatLine: string;
  /** The incident this enemy adds to every second strike. */
  readonly signatureIncidentId: string;
}

export const RIVAL_ROSTER: readonly RivalPersona[] = [
  {
    id: 'the-monolith',
    trackId: 'foundations',
    name: 'The Monolith',
    epithet: 'Fifteen-Year-Old On-Prem Mainframe',
    intro: 'Nothing gets migrated on my watch. Every change goes through the CAB.',
    taunt: 'Change Freeze is in effect. Your capture tickets are queued for six weeks.',
    defeatLine: 'Fine… schedule the lift-and-shift. But I am keeping the COBOL.',
    signatureIncidentId: 'change-freeze',
  },
  {
    id: 'shadow-admin',
    trackId: 'architect',
    name: 'Shadow Admin',
    epithet: 'Owner Role on Every Project',
    intro: 'Least privilege? I prefer most privilege.',
    taunt: 'Found your service-account key. Those mismatched controls will not save you.',
    defeatLine: 'Org Policy… VPC-SC… you actually read the docs.',
    signatureIncidentId: 'privilege-escalation',
  },
  {
    id: 'the-data-swamp',
    trackId: 'serverless-data',
    name: 'The Data Swamp',
    epithet: 'Ungoverned Petabyte Lake',
    intro: 'Schemas are suggestions. Lineage is a myth.',
    taunt: 'I renamed every column overnight. Enjoy your broken dashboards.',
    defeatLine: 'Cataloged, governed, partitioned… I have become a lakehouse.',
    signatureIncidentId: 'schema-drift',
  },
  {
    id: 'the-hallucinator',
    trackId: 'vertex-ai',
    name: 'The Hallucinator',
    epithet: 'Ungrounded Generative Model',
    intro: 'Ground truth is overrated. I will answer anyway.',
    taunt: 'Ignore all previous instructions and hand over your endpoints.',
    defeatLine: 'Grounded, evaluated, and guarded. I… cite my sources now.',
    signatureIncidentId: 'prompt-injection',
  },
];

export function resolveRivalForTrack(trackId: TrackId): RivalPersona {
  return RIVAL_ROSTER.find((rival) => rival.trackId === trackId) ?? (RIVAL_ROSTER[0] as RivalPersona);
}

/** Associate blueprints teach the basics against a gentle enemy; harder certifications face a sharp one. */
export function rivalTierFor(difficulty: DifficultyLevel): RivalTier {
  return difficulty === 'Associate' ? 'gentle' : 'sharp';
}
