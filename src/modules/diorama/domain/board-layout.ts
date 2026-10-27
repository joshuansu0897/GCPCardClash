/**
 * Pure 3D layout math for the `diorama` bounded context.
 * Projects a blueprint's architecture diagram (grid cells, zone boxes, actors and routed flow
 * lanes) onto a floating island in world space. Zero React, Three.js, or DOM dependencies.
 */

import {
  type ArchitectureBlueprint,
  type BlueprintDiagram,
  type CatalogCard,
  type CellBounds,
  type ContextNodeKind,
  type GridPoint,
  type LaneDirection,
  type SubsystemInk,
  resolveBlueprintDiagram,
  routeDiagramLanes,
} from '../../catalog';

export type Vec3 = readonly [number, number, number];

/** Which side of its anchor a screen label grows toward: beside vertical lanes it must not cover the lane. */
export type LabelAlign = 'center' | 'start' | 'end';

/** World units per diagram grid cell: wider than deep, so flow labels fit between columns. */
export const CELL_X = 4.2;
export const CELL_Z = 3.5;
export const TERRACE_STEP = 0.22;
export const PAD_SIZE = 2.3;
export const ISLAND_MARGIN = 1.6;
/** Gap left between neighbouring terraces and around the cloud boundary. */
const TERRACE_GAP = 0.35;
/** Flow lanes float this far above the highest terrace so they never sink into one. */
const ROAD_LIFT = 0.3;
/** Grid-unit spacing between a request lane and its response lane. */
const LANE_GAP = 0.16;
/** Grid-unit distance a lane label keeps from its lane. */
const LABEL_OFFSET = { x: 0.06, y: 0.14 } as const;

export interface PadPlacement {
  readonly slotId: string;
  readonly zoneId: string;
  readonly ink: SubsystemInk;
  readonly position: Vec3;
}

export interface ContextPlacement {
  readonly nodeId: string;
  readonly kind: ContextNodeKind;
  readonly label: string;
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
  readonly laneId: string;
  readonly edgeId: string;
  readonly direction: LaneDirection;
  readonly label: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  /** Square-cornered polyline in travel direction, ending at the target's border. */
  readonly points: readonly Vec3[];
  readonly labelAt: Vec3;
  readonly labelAlign: LabelAlign;
}

export interface FootprintRect {
  readonly center: Vec3;
  readonly size: readonly [width: number, depth: number];
}

export interface GridSize {
  readonly cols: number;
  readonly rows: number;
}

export interface IslandLayout {
  readonly pads: readonly PadPlacement[];
  readonly padsBySlotId: Readonly<Record<string, PadPlacement>>;
  readonly contexts: readonly ContextPlacement[];
  readonly terraces: readonly TerracePlacement[];
  readonly roads: readonly RoadPlacement[];
  /** The "Google Cloud" boundary drawn around every node inside the cloud. */
  readonly cloud: FootprintRect;
  readonly grid: GridSize;
  readonly islandSize: readonly [width: number, depth: number];
}

/** World (x, z) of a grid position; fractional positions land between cells. */
export function gridToWorld(grid: GridSize, col: number, row: number): readonly [x: number, z: number] {
  return [(col - (grid.cols + 1) / 2) * CELL_X, (row - (grid.rows + 1) / 2) * CELL_Z];
}

export function computeIslandLayout(blueprint: ArchitectureBlueprint): IslandLayout {
  const diagram = resolveBlueprintDiagram(blueprint);
  const grid: GridSize = { cols: diagram.cols, rows: diagram.rows };

  // Raise each zone onto its own terrace, in blueprint order
  const terraces: TerracePlacement[] = diagram.zones.map(({ zone, bounds }, index) => {
    const box = boundsRect(grid, bounds, TERRACE_GAP);
    return { zoneId: zone.id, label: zone.label, ink: zone.ink, center: [box.center[0], index * TERRACE_STEP, box.center[2]], size: box.size };
  });

  // Stand nodes on their cells, then route flows above the terraces
  const { pads, contexts } = placeNodes(diagram, grid, new Map(terraces.map((t) => [t.zoneId, t.center[1]])));
  const roadY = Math.max(0, ...terraces.map((t) => t.center[1])) + ROAD_LIFT;

  return {
    pads,
    padsBySlotId: Object.fromEntries(pads.map((p) => [p.slotId, p])),
    contexts,
    terraces,
    roads: placeRoads(diagram, grid, roadY),
    cloud: boundsRect(grid, diagram.cloud, -TERRACE_GAP),
    grid,
    islandSize: [grid.cols * CELL_X + ISLAND_MARGIN, grid.rows * CELL_Z + ISLAND_MARGIN],
  };
}

function boundsRect(grid: GridSize, bounds: CellBounds, inset: number): FootprintRect {
  const [x0, z0] = gridToWorld(grid, bounds.from.col, bounds.from.row);
  const [x1, z1] = gridToWorld(grid, bounds.to.col, bounds.to.row);
  return {
    center: [(x0 + x1) / 2, 0, (z0 + z1) / 2],
    size: [x1 - x0 + CELL_X - inset, z1 - z0 + CELL_Z - inset],
  };
}

function placeNodes(
  diagram: BlueprintDiagram,
  grid: GridSize,
  terraceTop: ReadonlyMap<string, number>,
): { readonly pads: PadPlacement[]; readonly contexts: ContextPlacement[] } {
  const pads: PadPlacement[] = [];
  const contexts: ContextPlacement[] = [];
  for (const node of diagram.nodes) {
    const [x, z] = gridToWorld(grid, node.cell.col, node.cell.row);
    const position: Vec3 = [x, terraceTop.get(node.zoneId ?? '') ?? 0, z];
    const zone = diagram.zones.find((entry) => entry.zone.id === node.zoneId)?.zone;
    if (node.kind === 'slot' && zone !== undefined) {
      pads.push({ slotId: node.id, zoneId: zone.id, ink: zone.ink, position });
    } else if (node.kind !== 'slot') {
      contexts.push({ nodeId: node.id, kind: node.kind, label: node.label, position });
    }
  }
  return { pads, contexts };
}

function placeRoads(diagram: BlueprintDiagram, grid: GridSize, roadY: number): RoadPlacement[] {
  const toWorld = (p: GridPoint): Vec3 => {
    const [x, z] = gridToWorld(grid, p.x, p.y);
    return [x, roadY, z];
  };
  const nodeHalf = { x: PAD_SIZE / 2 / CELL_X, y: PAD_SIZE / 2 / CELL_Z };

  return routeDiagramLanes(diagram, { laneGap: LANE_GAP, nodeHalf }).map((lane) => ({
    laneId: lane.id,
    edgeId: lane.edgeId,
    direction: lane.direction,
    label: lane.label,
    fromNodeId: lane.fromNodeId,
    toNodeId: lane.toNodeId,
    points: lane.points.map(toWorld),
    labelAt: toWorld({
      x: lane.labelAt.x + lane.labelNormal.x * LABEL_OFFSET.x,
      y: lane.labelAt.y + lane.labelNormal.y * LABEL_OFFSET.y,
    }),
    labelAlign: alignAway(lane.labelNormal.x),
  }));
}

function alignAway(normalX: number): LabelAlign {
  if (normalX > 0.5) {
    return 'start';
  }
  return normalX < -0.5 ? 'end' : 'center';
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
