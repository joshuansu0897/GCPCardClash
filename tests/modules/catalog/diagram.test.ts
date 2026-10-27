import { describe, expect, it } from 'vitest';

import {
  type ArchitectureBlueprint,
  type CellBounds,
  type GridPoint,
  cellInBounds,
  createStaticCatalogRepository,
  resolveBlueprintDiagram,
  routeDiagramLanes,
} from '../../../src/modules/catalog';

const repository = createStaticCatalogRepository();
const OPTIONS = { laneGap: 0.2, nodeHalf: { x: 0.35, y: 0.3 } };

function overlaps(a: CellBounds, b: CellBounds): boolean {
  return a.from.col <= b.to.col && b.from.col <= a.to.col && a.from.row <= b.to.row && b.from.row <= a.to.row;
}

function arc101(): ArchitectureBlueprint {
  const blueprint = repository.getBlueprintById('arc-101-regional-web');
  if (blueprint === undefined) {
    throw new Error('Expected ARC-101');
  }
  return blueprint;
}

describe('Blueprint diagrams', () => {
  it('keeps zone boxes apart and actors outside the cloud boundary on every blueprint', () => {
    for (const blueprint of repository.listBlueprints()) {
      const diagram = resolveBlueprintDiagram(blueprint);
      diagram.zones.forEach((a, i) => {
        diagram.zones.slice(i + 1).forEach((b) => expect(overlaps(a.bounds, b.bounds)).toBe(false));
      });
      for (const node of diagram.nodes.filter((n) => !n.insideCloud)) {
        expect(cellInBounds(node.cell, diagram.cloud)).toBe(false);
      }
    }
  });

  it('lays every blueprint out as a real topology: outside actors, 6+ pads, and request/response pairs', () => {
    for (const blueprint of repository.listBlueprints()) {
      const diagram = resolveBlueprintDiagram(blueprint);

      expect(diagram.nodes.filter((n) => n.kind === 'slot').length, blueprint.code).toBeGreaterThanOrEqual(6);
      expect(diagram.nodes.some((n) => n.kind !== 'slot' && !n.insideCloud), blueprint.code).toBe(true);
      expect(diagram.edges.some((e) => e.returnLabel !== undefined), blueprint.code).toBe(true);
      expect(diagram.cols, blueprint.code).toBeGreaterThanOrEqual(5);
    }
  });

  it('never routes a lane through a node it does not connect', () => {
    for (const blueprint of repository.listBlueprints()) {
      const diagram = resolveBlueprintDiagram(blueprint);
      for (const lane of routeDiagramLanes(diagram, OPTIONS)) {
        const others = diagram.nodes.filter((n) => n.id !== lane.fromNodeId && n.id !== lane.toNodeId);
        const hit = others.find((node) => samplePolyline(lane.points).some((p) => insideNode(p, node.cell)));
        expect(hit?.id, `${blueprint.code} ${lane.id}`).toBeUndefined();
      }
    }
  });
});

function samplePolyline(points: readonly GridPoint[]): GridPoint[] {
  return points.slice(1).flatMap((to, index) => {
    const from = points[index] ?? to;
    return Array.from({ length: 21 }, (_, step) => ({
      x: from.x + ((to.x - from.x) * step) / 20,
      y: from.y + ((to.y - from.y) * step) / 20,
    }));
  });
}

function insideNode(point: GridPoint, cell: { readonly col: number; readonly row: number }): boolean {
  return Math.abs(point.x - cell.col) < OPTIONS.nodeHalf.x && Math.abs(point.y - cell.row) < OPTIONS.nodeHalf.y;
}

describe('Diagram lane routing', () => {
  const diagram = resolveBlueprintDiagram(arc101());
  const lanes = routeDiagramLanes(diagram, OPTIONS);
  const lane = (id: string) => {
    const found = lanes.find((l) => l.id === id);
    if (found === undefined) {
      throw new Error(`Missing lane ${id}`);
    }
    return found;
  };
  const ys = (points: readonly GridPoint[]): number[] => points.map((p) => p.y);

  it('splits a paired edge into opposite lanes, request above and response below', () => {
    const request = lane('e1:request');
    const response = lane('e1:response');

    expect(request.fromNodeId).toBe('shoppers');
    expect(response.fromNodeId).toBe('ingress-lb');
    expect(response.label).toBe('HTML + JSON');
    expect(new Set(ys(request.points))).toEqual(new Set([2 - OPTIONS.laneGap / 2]));
    expect(new Set(ys(response.points))).toEqual(new Set([2 + OPTIONS.laneGap / 2]));
    expect(request.labelNormal.y).toBeLessThan(0);
  });

  it('stops lanes at node borders instead of node centres', () => {
    const request = lane('e1:request');

    expect(request.points[0]?.x).toBeCloseTo(1 + OPTIONS.nodeHalf.x, 5);
    expect(request.points[request.points.length - 1]?.x).toBeCloseTo(2 - OPTIONS.nodeHalf.x, 5);
  });

  it('bends a diagonal flow once through a free corner, entering the target from below', () => {
    const branch = lane('e8:request');

    expect(branch.points).toHaveLength(3);
    expect(branch.points[1]).toEqual({ x: 5, y: 3 });
    expect(branch.points[2]?.x).toBeCloseTo(5, 5);
    expect(branch.points[2]?.y).toBeCloseTo(2 + OPTIONS.nodeHalf.y, 5);
  });

  it('skips an L whose leg would run through another node', () => {
    const blueprint = arc101();
    // receipt-worker (4,3) -> edge-cache (2,1): the horizontal-first leg would cross order-events (3,3)
    const detour: ArchitectureBlueprint = {
      ...blueprint,
      edges: [...blueprint.edges, { id: 'x1', fromNodeId: 'receipt-worker', toNodeId: 'edge-cache', protocolLabel: 'X' }],
    };
    const branch = routeDiagramLanes(resolveBlueprintDiagram(detour), OPTIONS).find((l) => l.id === 'x1:request');

    expect(branch?.points).toHaveLength(3);
    expect(branch?.points[1]).toEqual({ x: 4, y: 1 });
  });

  it('falls back to a Z turning half a cell past the source when both corners hold nodes', () => {
    const blueprint = arc101();
    const blocked: ArchitectureBlueprint = {
      ...blueprint,
      contextNodes: [
        ...(blueprint.contextNodes ?? []),
        { id: 'corner-a', kind: 'service', label: 'A', cell: { col: 5, row: 3 }, insideCloud: true },
        { id: 'corner-b', kind: 'service', label: 'B', cell: { col: 4, row: 2 }, insideCloud: true },
      ],
    };
    const branch = routeDiagramLanes(resolveBlueprintDiagram(blocked), OPTIONS).find((l) => l.id === 'e8:request');

    expect(branch?.points).toHaveLength(4);
    expect(branch?.points[1]?.x).toBeCloseTo(4.5, 5);
    expect(branch?.points[2]?.x).toBeCloseTo(4.5, 5);
  });

  it('draws one-way flows as a single centred lane', () => {
    expect(lanes.filter((l) => l.edgeId === 'e6')).toHaveLength(1);
    expect(lane('e6:request').points.every((p) => p.x === 3)).toBe(true);
  });
});
