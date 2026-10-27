/**
 * Pure placement of decorative props that give each zone its own district character: server
 * racks in compute zones, storage tanks in data zones, antennas on the edge, security bollards
 * in shield zones, crystals in AI zones, and trees on open grass. Props fill the diagram cells
 * that no node uses and no flow lane crosses, so they never hide part of the architecture.
 */

import type { SubsystemInk } from '../../catalog';
import { type IslandLayout, type Vec3, gridToWorld } from './board-layout';

export type DecorKind = 'tree' | 'rack' | 'tank' | 'antenna' | 'bollard' | 'crystal';

export interface DecorPlacement {
  readonly id: string;
  readonly kind: DecorKind;
  /** Ink of the zone terrace the prop stands on; `null` on open grass. */
  readonly ink: SubsystemInk | null;
  readonly position: Vec3;
  /** Small per-prop variation so rows of props do not look stamped. */
  readonly scale: number;
  readonly rotationY: number;
}

const INK_DECOR: Readonly<Record<SubsystemInk, DecorKind>> = {
  compute: 'rack',
  data: 'tank',
  edge: 'antenna',
  shield: 'bollard',
  ai: 'crystal',
};

/** Two props per free cell, offset from its centre. */
const PROP_SPOTS: readonly (readonly [number, number])[] = [
  [-0.6, -0.4],
  [0.55, 0.45],
];
/** A free cell must keep its centre this far from any flow lane. */
const LANE_CLEARANCE = 0.8;

export function computeTerraceDecor(layout: IslandLayout): readonly DecorPlacement[] {
  const decor: DecorPlacement[] = [];
  for (const [x, z] of freeCellCentres(layout)) {
    const terrace = layout.terraces.find(
      (t) => Math.abs(x - t.center[0]) <= t.size[0] / 2 && Math.abs(z - t.center[2]) <= t.size[1] / 2,
    );
    PROP_SPOTS.forEach(([dx, dz], index) => {
      const id = `${x.toFixed(1)}:${z.toFixed(1)}:${index}`;
      const seed = hashString(id);
      decor.push({
        id,
        kind: terrace !== undefined && index === 0 ? INK_DECOR[terrace.ink] : 'tree',
        ink: terrace?.ink ?? null,
        position: [x + dx, terrace?.center[1] ?? 0, z + dz],
        scale: 1.2 + seed * 0.3,
        rotationY: seed * Math.PI * 2,
      });
    });
  }
  return decor;
}

function freeCellCentres(layout: IslandLayout): (readonly [number, number])[] {
  const { cols, rows } = layout.grid;
  const occupied = [...layout.pads.map((p) => p.position), ...layout.contexts.map((c) => c.position)];
  const segments = layout.roads.flatMap((road) => road.points.slice(1).map((end, i) => [road.points[i] ?? end, end] as const));
  const centres: (readonly [number, number])[] = [];

  for (let col = 1; col <= cols; col += 1) {
    for (let row = 1; row <= rows; row += 1) {
      const [x, z] = gridToWorld(layout.grid, col, row);
      const isOccupied = occupied.some((p) => Math.abs(p[0] - x) < 0.1 && Math.abs(p[2] - z) < 0.1);
      const isCrossed = segments.some(([a, b]) => distanceToSegment(x, z, a, b) < LANE_CLEARANCE);
      if (!isOccupied && !isCrossed) {
        centres.push([x, z]);
      }
    }
  }
  return centres;
}

/** Distance on the ground plane from (x, z) to the segment a–b. */
function distanceToSegment(x: number, z: number, a: Vec3, b: Vec3): number {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const lengthSq = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[2]) * dz) / lengthSq));
  return Math.hypot(x - (a[0] + dx * t), z - (a[2] + dz * t));
}

/** Deterministic value in [0, 1) so the same blueprint always looks the same. */
function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
