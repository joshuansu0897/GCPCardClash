/**
 * Pure domain reference architecture blueprint models for GCP Card Clash.
 * Models perimeter zones, topology slots, directional protocol flows, and study metadata.
 */

import type { ShieldCapability, SubsystemInk } from './card';

export type TrackId = 'foundations' | 'architect' | 'serverless-data' | 'vertex-ai';

export type DifficultyLevel = 'Associate' | 'Professional' | 'Specialist';

export type ZoneColumn = 1 | 2 | 3;

export type SlotRow = 1 | 2 | 3;

export interface TrackInfo {
  readonly id: TrackId;
  readonly code: string;
  readonly title: string;
  readonly certificationFocus: string;
  readonly summary: string;
}

export interface PerimeterZone {
  readonly id: string;
  readonly label: string;
  readonly ink: SubsystemInk;
  readonly column: ZoneColumn;
}

export interface ArchitectureSlot {
  readonly id: string;
  readonly zoneId: string;
  readonly row: SlotRow;
  readonly title: string;
  readonly requirementClue: string;
  readonly acceptedServiceIds: readonly string[];
  readonly recommendedShield: ShieldCapability;
  readonly antiPatternHints: Readonly<Record<string, string>>;
  readonly defaultAntiPatternReason: string;
  readonly architecturalRationale: string;
}

export interface FlowEdge {
  readonly id: string;
  readonly fromSlotId: string;
  readonly toSlotId: string;
  readonly protocolLabel: string;
}

export interface ArchitectureBlueprint {
  readonly id: string;
  readonly code: string;
  readonly trackId: TrackId;
  readonly title: string;
  readonly difficulty: DifficultyLevel;
  readonly workloadBrief: string;
  readonly targetSla: string;
  readonly costFocus: string;
  readonly zones: readonly PerimeterZone[];
  readonly slots: readonly ArchitectureSlot[];
  readonly edges: readonly FlowEdge[];
  readonly distractorServiceIds: readonly string[];
  readonly solutionSummary: string;
}
