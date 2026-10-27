/**
 * Pure placement of decorative props that give each zone terrace its own district character:
 * server racks in compute zones, storage tanks in data zones, antennas on the edge, security
 * bollards in shield zones, crystals in AI zones, with trees in between. Props sit in the side
 * margins beside the pads and between pad rows, where neither pads nor flow roads pass.
 */

import type { SubsystemInk } from '../../catalog';
import { type IslandLayout, PAD_SIZE, type Vec3 } from './board-layout';

export type DecorKind = 'tree' | 'rack' | 'tank' | 'antenna' | 'bollard' | 'crystal';

export interface DecorPlacement {
  readonly id: string;
  readonly kind: DecorKind;
  readonly ink: SubsystemInk;
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

/** Distance (world units) props keep from the terrace's side edge. */
const EDGE_INSET = 0.38;

export function computeTerraceDecor(layout: IslandLayout): readonly DecorPlacement[] {
  const decor: DecorPlacement[] = [];

  for (const terrace of layout.terraces) {
    const [cx, top, cz] = terrace.center;
    const [w, d] = terrace.size;
    const sideX = Math.max(PAD_SIZE / 2 + 0.2, w / 2 - EDGE_INSET);
    const rowZs = layout.pads
      .filter((pad) => pad.zoneId === terrace.zoneId)
      .map((pad) => pad.position[2])
      .sort((a, b) => a - b);

    // WHY: between-row slots stay clear of the flow roads, which run at pad-row depth
    const slots = gapMidpoints([cz - d / 2, ...dedupe(rowZs), cz + d / 2]);
    slots.forEach((z, slotIndex) => {
      for (const side of [-1, 1] as const) {
        const index = slotIndex * 2 + (side + 1) / 2;
        const seed = hashString(`${terrace.zoneId}:${index}`);
        decor.push({
          id: `${terrace.zoneId}:${index}`,
          kind: (slotIndex + (side + 1) / 2) % 2 === 0 ? INK_DECOR[terrace.ink] : 'tree',
          ink: terrace.ink,
          position: [cx + side * sideX, top, z],
          scale: 1.2 + seed * 0.3,
          rotationY: seed * Math.PI * 2,
        });
      }
    });
  }
  return decor;
}

function gapMidpoints(edges: readonly number[]): number[] {
  return edges.slice(1).map((z, index) => ((edges[index] ?? z) + z) / 2);
}

function dedupe(values: readonly number[]): number[] {
  return values.filter((value, index) => index === 0 || Math.abs(value - (values[index - 1] ?? value)) > 0.01);
}

/** Deterministic value in [0, 1) so the same blueprint always looks the same. */
function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
