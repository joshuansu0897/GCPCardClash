/**
 * Resolves a blueprint into a renderer-neutral architecture diagram: every node (playable slots
 * and fixed context actors) on a grid cell, each zone's bounding box, and the cloud boundary.
 * Both the 2D board and the 3D island draw from this, so they always show the same topology.
 */

import type { ArchitectureBlueprint, ContextNodeKind, FlowEdge, GridCell, PerimeterZone } from './blueprint';

export type DiagramNodeKind = 'slot' | ContextNodeKind;

export interface DiagramNode {
  readonly id: string;
  readonly kind: DiagramNodeKind;
  readonly label: string;
  readonly cell: GridCell;
  /** Zone the node belongs to; context nodes belong to none. */
  readonly zoneId: string | null;
  readonly insideCloud: boolean;
}

/** Inclusive grid bounds. */
export interface CellBounds {
  readonly from: GridCell;
  readonly to: GridCell;
}

export interface DiagramZone {
  readonly zone: PerimeterZone;
  readonly bounds: CellBounds;
}

export interface BlueprintDiagram {
  readonly nodes: readonly DiagramNode[];
  readonly nodesById: Readonly<Record<string, DiagramNode>>;
  readonly edges: readonly FlowEdge[];
  readonly zones: readonly DiagramZone[];
  /** Box around every node inside the cloud; actors outside it are users, devices and partners. */
  readonly cloud: CellBounds;
  readonly cols: number;
  readonly rows: number;
}

export function resolveBlueprintDiagram(blueprint: ArchitectureBlueprint): BlueprintDiagram {
  // Place every node on its grid cell
  const slotNodes: DiagramNode[] = blueprint.slots.map((slot) => ({
    id: slot.id,
    kind: 'slot',
    label: slot.title,
    cell: slot.cell,
    zoneId: slot.zoneId,
    insideCloud: true,
  }));
  const contextNodes: DiagramNode[] = (blueprint.contextNodes ?? []).map((node) => ({ ...node, zoneId: null }));
  const nodes = [...slotNodes, ...contextNodes];

  // Box the zones and the cloud around their nodes
  const zones = blueprint.zones.flatMap((zone) => {
    const bounds = boundsOf(slotNodes.filter((node) => node.zoneId === zone.id).map((node) => node.cell));
    return bounds === null ? [] : [{ zone, bounds }];
  });
  const all = boundsOf(nodes.map((node) => node.cell)) ?? { from: { col: 1, row: 1 }, to: { col: 1, row: 1 } };
  const cloud = boundsOf(nodes.filter((node) => node.insideCloud).map((node) => node.cell)) ?? all;

  return {
    nodes,
    nodesById: Object.fromEntries(nodes.map((node) => [node.id, node])),
    edges: blueprint.edges,
    zones,
    cloud,
    cols: all.to.col,
    rows: all.to.row,
  };
}

export function boundsOf(cells: readonly GridCell[]): CellBounds | null {
  if (cells.length === 0) {
    return null;
  }
  const cols = cells.map((cell) => cell.col);
  const rows = cells.map((cell) => cell.row);
  return {
    from: { col: Math.min(...cols), row: Math.min(...rows) },
    to: { col: Math.max(...cols), row: Math.max(...rows) },
  };
}

export function cellInBounds(cell: GridCell, bounds: CellBounds): boolean {
  return (
    cell.col >= bounds.from.col && cell.col <= bounds.to.col && cell.row >= bounds.from.row && cell.row <= bounds.to.row
  );
}
