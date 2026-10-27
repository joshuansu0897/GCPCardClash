/**
 * Pure domain reference architecture blueprint models for GCP Card Clash.
 * Models perimeter zones, topology slots, context actors, directional protocol flows laid out on a
 * diagram grid, and study metadata.
 */

import type { ShieldCapability, SubsystemInk } from './card';

export type TrackId = 'foundations' | 'architect' | 'serverless-data' | 'vertex-ai';

export type DifficultyLevel = 'Associate' | 'Professional' | 'Specialist';

export interface TrackInfo {
  readonly id: TrackId;
  readonly code: string;
  readonly title: string;
  readonly certificationFocus: string;
  readonly summary: string;
}

/** A position on a blueprint's diagram grid: columns run left (callers) to right (data), rows top to bottom. */
export interface GridCell {
  readonly col: number;
  readonly row: number;
}

export interface PerimeterZone {
  readonly id: string;
  readonly label: string;
  readonly ink: SubsystemInk;
}

export interface ArchitectureSlot {
  readonly id: string;
  readonly zoneId: string;
  readonly cell: GridCell;
  readonly title: string;
  readonly requirementClue: string;
  readonly acceptedServiceIds: readonly string[];
  readonly recommendedShield: ShieldCapability;
  readonly antiPatternHints: Readonly<Record<string, string>>;
  readonly defaultAntiPatternReason: string;
  readonly architecturalRationale: string;
}

export type ContextNodeKind = 'users' | 'browser' | 'devices' | 'on-prem' | 'partner' | 'service';

/** A fixed, non-playable diagram node: an actor outside the cloud, or a pre-provisioned piece of context. */
export interface ContextNode {
  readonly id: string;
  readonly kind: ContextNodeKind;
  readonly label: string;
  readonly cell: GridCell;
  readonly insideCloud: boolean;
}

/** A flow between two nodes (slots or context nodes); `returnLabel` draws the paired response arrow. */
export interface FlowEdge {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly protocolLabel: string;
  readonly returnLabel?: string;
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
  readonly contextNodes?: readonly ContextNode[];
  readonly edges: readonly FlowEdge[];
  readonly distractorServiceIds: readonly string[];
  readonly solutionSummary: string;
}
