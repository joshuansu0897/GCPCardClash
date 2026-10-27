/**
 * Orthogonal connector routing for blueprint diagrams, in grid units (x = column, y = row).
 * An unaligned edge bends once through a free corner cell (or, when both corners hold nodes, twice
 * in the gap past the source column), the way hand-drawn reference diagrams do. A request with a
 * `returnLabel` becomes two parallel lanes travelling in opposite directions.
 */

import type { BlueprintDiagram } from './diagram';
import type { FlowEdge, GridCell } from './blueprint';

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export type LaneDirection = 'request' | 'response';

export interface DiagramLane {
  readonly id: string;
  readonly edgeId: string;
  readonly direction: LaneDirection;
  readonly label: string;
  /** Endpoints in the direction of travel. */
  readonly fromNodeId: string;
  readonly toNodeId: string;
  /** Polyline from the source node's border to the target node's border. */
  readonly points: readonly GridPoint[];
  readonly labelAt: GridPoint;
  /** Unit vector pointing away from the lane's partner, for placing the label beside the line. */
  readonly labelNormal: GridPoint;
}

export interface LaneOptions {
  /** Distance between a request lane and its response lane. */
  readonly laneGap: number;
  /** Half the drawn node size per axis: lanes stop at the node's border instead of its centre. */
  readonly nodeHalf: GridPoint;
}

export function routeDiagramLanes(diagram: BlueprintDiagram, options: LaneOptions): DiagramLane[] {
  const occupied = new Set(diagram.nodes.map((node) => cellKey(node.cell)));
  return diagram.edges.flatMap((edge) => {
    const from = diagram.nodesById[edge.fromNodeId];
    const to = diagram.nodesById[edge.toNodeId];
    if (from === undefined || to === undefined) {
      return [];
    }
    const path = centerPath(from.cell, to.cell, occupied);
    if (edge.returnLabel === undefined) {
      return [buildLane(edge, 'request', path, 0, options)];
    }
    const offset = options.laneGap / 2;
    return [buildLane(edge, 'request', path, offset, options), buildLane(edge, 'response', [...path].reverse(), offset, options)];
  });
}

function buildLane(
  edge: FlowEdge,
  direction: LaneDirection,
  path: readonly GridPoint[],
  offset: number,
  options: LaneOptions,
): DiagramLane {
  const points = trimEnds(offsetPolyline(path, offset), options.nodeHalf);
  const longest = longestSegment(points);
  const isRequest = direction === 'request';
  return {
    id: `${edge.id}:${direction}`,
    edgeId: edge.id,
    direction,
    label: isRequest ? edge.protocolLabel : (edge.returnLabel ?? ''),
    fromNodeId: isRequest ? edge.fromNodeId : edge.toNodeId,
    toNodeId: isRequest ? edge.toNodeId : edge.fromNodeId,
    points,
    labelAt: longest.mid,
    labelNormal: longest.normal,
  };
}

/**
 * Centre-to-centre route: straight when aligned; otherwise an L whose legs cross no other node, so
 * the lane enters the target from a side its row-mates do not use; a Z past the source as a fallback.
 */
function centerPath(a: GridCell, b: GridCell, occupied: ReadonlySet<string>): GridPoint[] {
  const start = { x: a.col, y: a.row };
  const end = { x: b.col, y: b.row };
  if (a.row === b.row || a.col === b.col) {
    return [start, end];
  }

  // Prefer an L-shaped route, horizontal leg first
  const corners: readonly GridCell[] = [
    { col: b.col, row: a.row },
    { col: a.col, row: b.row },
  ];
  const corner = corners.find((c) => routeCells([a, c, b]).every((cell) => !occupied.has(cellKey(cell))));
  if (corner !== undefined) {
    return [start, { x: corner.col, y: corner.row }, end];
  }

  const turnX = a.col + Math.sign(b.col - a.col) * 0.5;
  return [start, { x: turnX, y: a.row }, { x: turnX, y: b.row }, end];
}

/** Cells an axis-aligned route passes through, excluding its two ends. */
function routeCells(route: readonly GridCell[]): GridCell[] {
  const cells: GridCell[] = [];
  route.slice(1).forEach((to, index) => {
    const from = route[index] ?? to;
    const steps = Math.abs(to.col - from.col) + Math.abs(to.row - from.row);
    for (let step = 1; step <= steps; step += 1) {
      cells.push({ col: from.col + Math.sign(to.col - from.col) * step, row: from.row + Math.sign(to.row - from.row) * step });
    }
  });
  return cells.slice(0, -1);
}

function cellKey(cell: GridCell): string {
  return `${cell.col},${cell.row}`;
}

/** Shifts an orthogonal polyline sideways (to the left of travel) by `offset`, keeping its corners square. */
function offsetPolyline(points: readonly GridPoint[], offset: number): GridPoint[] {
  const normals = points.slice(1).map((point, index) => leftNormal(points[index] ?? point, point));
  return points.map((point, index) => {
    const before = normals[index - 1] ?? { x: 0, y: 0 };
    const after = normals[index] ?? { x: 0, y: 0 };
    // WHY: at a square corner the two perpendicular offsets simply add
    return { x: point.x + (before.x + after.x) * offset, y: point.y + (before.y + after.y) * offset };
  });
}

function trimEnds(points: readonly GridPoint[], half: GridPoint): GridPoint[] {
  const trimmed = [...points];
  const first = trimmed[0];
  const second = trimmed[1];
  const last = trimmed[trimmed.length - 1];
  const beforeLast = trimmed[trimmed.length - 2];
  if (first === undefined || second === undefined || last === undefined || beforeLast === undefined) {
    return trimmed;
  }
  trimmed[0] = moveToward(first, second, half);
  trimmed[trimmed.length - 1] = moveToward(last, beforeLast, half);
  return trimmed;
}

function longestSegment(points: readonly GridPoint[]): { readonly mid: GridPoint; readonly normal: GridPoint } {
  let best = { length: -1, mid: points[0] ?? { x: 0, y: 0 }, normal: { x: 0, y: -1 } };
  points.slice(1).forEach((point, index) => {
    const prev = points[index] ?? point;
    const length = Math.hypot(point.x - prev.x, point.y - prev.y);
    if (length > best.length) {
      best = { length, mid: { x: (prev.x + point.x) / 2, y: (prev.y + point.y) / 2 }, normal: leftNormal(prev, point) };
    }
  });
  return { mid: best.mid, normal: best.normal };
}

function leftNormal(a: GridPoint, b: GridPoint): GridPoint {
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.y - a.y) / length, y: -(b.x - a.x) / length };
}

/** Moves `from` toward `to` by the node's half-size along that (axis-aligned) direction. */
function moveToward(from: GridPoint, to: GridPoint, half: GridPoint): GridPoint {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const distance = (Math.abs(to.x - from.x) * half.x + Math.abs(to.y - from.y) * half.y) / length;
  // WHY: a Z-route's first leg is only half a cell long, so never trim past most of a segment
  const step = Math.min(distance, length * 0.8) / length;
  return { x: from.x + (to.x - from.x) * step, y: from.y + (to.y - from.y) * step };
}
