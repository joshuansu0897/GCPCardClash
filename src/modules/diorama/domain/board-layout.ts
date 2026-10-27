/**
 * Pure 3D layout math for the `diorama` bounded context.
 * Projects blueprint zone columns and slot rows onto a floating island in world space.
 * Zero React, Three.js, or DOM dependencies.
 */

import type { ArchitectureBlueprint, CatalogCard, SubsystemInk } from '../../catalog';

export type Vec3 = readonly [number, number, number];

export const ZONE_SPACING = 4.4;
export const ROW_SPACING = 3;
export const TERRACE_STEP = 0.22;
export const PAD_SIZE = 2.3;
export const ISLAND_MARGIN = 1.6;
export const ROAD_ARC_HEIGHT = 0.9;

export interface PadPlacement {
  readonly slotId: string;
  readonly zoneId: string;
  readonly ink: SubsystemInk;
  readonly position: Vec3;
}

export interface TerracePlacement {
  readonly zoneId: string;
  readonly label: string;
  readonly ink: SubsystemInk;
  readonly center: Vec3;
  readonly size: readonly [width: number, depth: number];
}

export interface RoadPlacement {
  readonly edgeId: string;
  readonly fromSlotId: string;
  readonly toSlotId: string;
  readonly protocolLabel: string;
  /** Quadratic Bézier control points: start, raised midpoint, end. */
  readonly controlPoints: readonly [Vec3, Vec3, Vec3];
}

export interface IslandLayout {
  readonly pads: readonly PadPlacement[];
  readonly padsBySlotId: Readonly<Record<string, PadPlacement>>;
  readonly terraces: readonly TerracePlacement[];
  readonly roads: readonly RoadPlacement[];
  readonly islandSize: readonly [width: number, depth: number];
}

export function computeIslandLayout(blueprint: ArchitectureBlueprint): IslandLayout {
  const columns = blueprint.zones.length > 0 ? Math.max(...blueprint.zones.map((z) => z.column)) : 1;
  const maxRow = blueprint.slots.length > 0 ? Math.max(...blueprint.slots.map((s) => s.row)) : 1;
  const zonesById = new Map(blueprint.zones.map((z) => [z.id, z]));

  const columnToX = (column: number): number => (column - (columns + 1) / 2) * ZONE_SPACING;
  const rowToZ = (row: number): number => (row - (maxRow + 1) / 2) * ROW_SPACING;
  const columnToY = (column: number): number => (column - 1) * TERRACE_STEP;

  const pads: PadPlacement[] = [];
  for (const slot of blueprint.slots) {
    const zone = zonesById.get(slot.zoneId);
    if (zone === undefined) {
      continue;
    }
    pads.push({
      slotId: slot.id,
      zoneId: zone.id,
      ink: zone.ink,
      position: [columnToX(zone.column), columnToY(zone.column), rowToZ(slot.row)],
    });
  }
  const padsBySlotId = Object.fromEntries(pads.map((p) => [p.slotId, p]));

  const terraceDepth = maxRow * ROW_SPACING;
  const terraces: TerracePlacement[] = [...blueprint.zones]
    .sort((a, b) => a.column - b.column)
    .map((zone) => ({
      zoneId: zone.id,
      label: zone.label,
      ink: zone.ink,
      center: [columnToX(zone.column), columnToY(zone.column), 0],
      size: [ZONE_SPACING - 0.35, terraceDepth],
    }));

  const roads = layoutRoads(blueprint, padsBySlotId);

  return {
    pads,
    padsBySlotId,
    terraces,
    roads,
    islandSize: [columns * ZONE_SPACING + ISLAND_MARGIN, terraceDepth + ISLAND_MARGIN],
  };
}

function layoutRoads(
  blueprint: ArchitectureBlueprint,
  padsBySlotId: Readonly<Record<string, PadPlacement>>,
): RoadPlacement[] {
  const roads: RoadPlacement[] = [];
  for (const edge of blueprint.edges) {
    const from = padsBySlotId[edge.fromSlotId];
    const to = padsBySlotId[edge.toSlotId];
    if (from === undefined || to === undefined) {
      continue;
    }
    roads.push({
      edgeId: edge.id,
      fromSlotId: edge.fromSlotId,
      toSlotId: edge.toSlotId,
      protocolLabel: edge.protocolLabel,
      controlPoints: [from.position, arcMidpoint(from.position, to.position), to.position],
    });
  }
  return roads;
}

function arcMidpoint(a: Vec3, b: Vec3): Vec3 {
  const span = Math.hypot(b[0] - a[0], b[2] - a[2]);
  return [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + ROAD_ARC_HEIGHT + span * 0.06, (a[2] + b[2]) / 2];
}

export type BuildingArchetype = 'rack' | 'vault' | 'silo' | 'tower' | 'crystal' | 'bastion';

export function resolveBuildingArchetype(card: CatalogCard): BuildingArchetype {
  switch (card.category) {
    case 'Compute':
      return 'rack';
    case 'Databases & Storage':
      return 'vault';
    case 'Messaging & Analytics':
      return 'silo';
    case 'Networking & Edge':
      return 'tower';
    case 'Vertex AI':
      return 'crystal';
    case 'Security & Governance':
    case 'Provisioning':
      return 'bastion';
  }
}

export const INK_HEX: Readonly<Record<SubsystemInk, string>> = {
  compute: '#1A56DB',
  data: '#0E7490',
  edge: '#B45309',
  shield: '#B91C1C',
  ai: '#15803D',
};
