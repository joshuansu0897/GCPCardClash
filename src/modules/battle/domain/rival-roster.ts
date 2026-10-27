/**
 * Track rivals. Every track has its own everyday Rival and its own boss. All of them play under
 * exactly the player's rules; a boss differs only in sharper tactics, a faster incident cadence,
 * and a signature incident that suits its playstyle.
 */

import type { TrackId } from '../../catalog';
import type { RivalProfile } from './match-types';

export interface RivalPersona {
  readonly id: string;
  readonly trackId: TrackId;
  readonly profile: RivalProfile;
  readonly name: string;
  readonly epithet: string;
  readonly intro: string;
  readonly taunt: string;
  readonly defeatLine: string;
  /** Bosses only: the incident they add to every second strike. */
  readonly signatureIncidentId: string | null;
}

/** A persona that is guaranteed to be a boss with a signature incident. */
export type BossProfile = RivalPersona & { readonly profile: 'boss'; readonly signatureIncidentId: string };

export const STANDARD_RIVALS: readonly RivalPersona[] = [
  {
    id: 'rack-gremlin',
    trackId: 'foundations',
    profile: 'standard',
    name: 'Rack Gremlin',
    epithet: 'Unpatched Server-Closet Imp',
    intro: 'Who needs patches? This box has been up for 2,000 days straight.',
    taunt: 'I unplugged your load balancer to charge my phone.',
    defeatLine: 'Fine, the managed service can have the closet.',
    signatureIncidentId: null,
  },
  {
    id: 'latency-wraith',
    trackId: 'architect',
    profile: 'standard',
    name: 'Latency Wraith',
    epithet: 'Haunts Every Cross-Region Hop',
    intro: 'Every request you route through me costs another 200 ms.',
    taunt: 'Your users in Sydney are still waiting.',
    defeatLine: 'Anycast… edge caching… there is nowhere left to haunt.',
    signatureIncidentId: null,
  },
  {
    id: 'backlog-hydra',
    trackId: 'serverless-data',
    profile: 'standard',
    name: 'Backlog Hydra',
    epithet: 'Ten Million Unacked Messages',
    intro: 'Ack one message and two more take its place.',
    taunt: 'Your subscribers are three hours behind and falling.',
    defeatLine: 'Autoscaled consumers… dead-letter topics… I am drained.',
    signatureIncidentId: null,
  },
  {
    id: 'drift-sprite',
    trackId: 'vertex-ai',
    profile: 'standard',
    name: 'Drift Sprite',
    epithet: 'Silently Degrading Model',
    intro: 'Your accuracy was great — six months ago.',
    taunt: 'Nobody is monitoring the feature distribution, are they?',
    defeatLine: 'Model monitoring caught me. Retrain me, I guess.',
    signatureIncidentId: null,
  },
];

export const BOSS_ROSTER: readonly BossProfile[] = [
  {
    id: 'the-monolith',
    trackId: 'foundations',
    profile: 'boss',
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
    profile: 'boss',
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
    profile: 'boss',
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
    profile: 'boss',
    name: 'The Hallucinator',
    epithet: 'Ungrounded Generative Model',
    intro: 'Ground truth is overrated. I will answer anyway.',
    taunt: 'Ignore all previous instructions and hand over your endpoints.',
    defeatLine: 'Grounded, evaluated, and guarded. I… cite my sources now.',
    signatureIncidentId: 'prompt-injection',
  },
];

export function resolveBossForTrack(trackId: TrackId): BossProfile {
  return BOSS_ROSTER.find((boss) => boss.trackId === trackId) ?? (BOSS_ROSTER[0] as BossProfile);
}

export function resolveRivalForTrack(trackId: TrackId, profile: RivalProfile): RivalPersona {
  if (profile === 'boss') {
    return resolveBossForTrack(trackId);
  }
  return STANDARD_RIVALS.find((rival) => rival.trackId === trackId) ?? (STANDARD_RIVALS[0] as RivalPersona);
}
