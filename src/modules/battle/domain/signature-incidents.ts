/**
 * Each track boss's signature incident. They only strike as that boss's signature move, every
 * second incident of a match against it, and never come up in the general incident draw.
 */

import type { IncidentCard } from './incident-rules';

export const SIGNATURE_INCIDENTS: readonly IncidentCard[] = [
  {
    id: 'change-freeze',
    manifestation: { kind: 'sky-fall', palette: 'ice', target: 'island', particle: 'shard' },
    title: 'Mainframe Change Freeze',
    tone: 'hazard',
    signatureOnly: true,
    flavor: 'The Monolith declares a freeze: nothing moves without a 6-week CAB review.',
    rule: 'This turn, capturing a node costs 1 more Energy.',
    lesson: 'Heavy change control slows remediation as much as it slows attackers.',
    effects: [],
    modifiers: { captureCostDelta: 1 },
  },
  {
    id: 'privilege-escalation',
    manifestation: { kind: 'flyover', palette: 'shadow', target: 'island' },
    title: 'Privilege Escalation',
    tone: 'hazard',
    signatureOnly: true,
    flavor: 'Shadow Admin finds an owner-role key in a public repo.',
    rule: 'Every shield that is NOT the recommended control is stripped from its node.',
    lesson: 'The wrong control gives a false sense of safety — match the control to the threat.',
    effects: [{ kind: 'strip-suboptimal-shields' }],
  },
  {
    id: 'schema-drift',
    manifestation: { kind: 'sky-fall', palette: 'toxic', target: 'data', particle: 'goo' },
    title: 'Schema Drift',
    tone: 'hazard',
    signatureOnly: true,
    flavor: 'The Data Swamp silently renames half the columns overnight.',
    rule: 'Unshielded nodes in Data zones cost their owner 25.',
    lesson: 'Governed datasets (Dataplex, VPC-SC perimeters) keep pipelines trustworthy.',
    effects: [{ kind: 'node-score', filter: 'unshielded', zoneInk: 'data', points: -25 }],
  },
  {
    id: 'prompt-injection',
    manifestation: { kind: 'lightning', palette: 'glitch', target: 'affected-zone' },
    title: 'Prompt Injection Wave',
    tone: 'hazard',
    signatureOnly: true,
    flavor: 'The Hallucinator floods every endpoint with jailbreak payloads.',
    rule: 'Unshielded nodes in AI zones go offline (return to OPEN) and each owner loses 30.',
    lesson: 'Model Armor, IAP, and VPC-SC belong in front of every generative endpoint.',
    effects: [{ kind: 'outage', zoneInk: 'ai', penalty: 30 }],
  },
  {
    id: 'config-drift',
    manifestation: { kind: 'meteor-shower', palette: 'ice', target: 'affected-zone' },
    title: 'Config Drift',
    tone: 'hazard',
    signatureOnly: true,
    flavor: 'The YAML Golem hand-edits live manifests and every pod restarts at once.',
    rule: 'Unshielded nodes in one Compute zone crash-loop (return to OPEN) and each owner loses 25.',
    lesson: 'GitOps releases, signed images and least-privilege IAM keep production reproducible.',
    effects: [{ kind: 'outage', zoneInk: 'compute', penalty: 25 }],
  },
];
