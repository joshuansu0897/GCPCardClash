import { describe, expect, it } from 'vitest';

import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { type Vec3, computeBoardFrame, computeCameraFit, computeIslandLayout } from '../../../src/modules/diorama';

const DIRECTION: Vec3 = [0, 0.819, 0.573];
const SQUARE: readonly Vec3[] = [
  [-6, 0, -4],
  [6, 0, -4],
  [-6, 0, 4],
  [6, 0, 4],
];
const BASE = { points: SQUARE, focus: [0, 0, 0] as Vec3, direction: DIRECTION, fovDeg: 36, viewport: { width: 1400, height: 900 } };

describe('Diorama camera fit', () => {
  it('keeps a left-right symmetric board horizontally centred when nothing covers it', () => {
    const fit = computeCameraFit({ ...BASE, insets: undefined });

    expect(fit.distance).toBeGreaterThan(0);
    expect(fit.offset[0]).toBeCloseTo(0, 5);
  });

  it('centres the board in the area the HUD leaves free', () => {
    const fit = computeCameraFit({ ...BASE, insets: { top: 100, right: 0, bottom: 200, left: 300 } });

    // Free area spans x 300..1400, centred at 850; the viewport centre is 700
    expect(fit.offset[0]).toBeCloseTo(-150, 5);
  });

  it('pulls the camera back so the board still fits a smaller free area', () => {
    const open = computeCameraFit({ ...BASE, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
    const covered = computeCameraFit({ ...BASE, insets: { top: 120, right: 24, bottom: 260, left: 280 } });

    expect(covered.distance).toBeGreaterThan(open.distance);
  });

  it('frames the enemy beside the island, scaled up for a boss', () => {
    const blueprint = createStaticCatalogRepository().listBlueprints()[0];
    if (blueprint === undefined) {
      throw new Error('Expected a blueprint');
    }
    const layout = computeIslandLayout(blueprint);
    const anchor: Vec3 = [-layout.islandSize[0] / 2 - 2, 1.8, 0];

    const minX = (points: readonly Vec3[]): number => Math.min(...points.map((p) => p[0]));
    const island = computeBoardFrame(layout, null);
    const standard = computeBoardFrame(layout, { anchor, scale: 1 });
    const boss = computeBoardFrame(layout, { anchor, scale: 1.55 });

    expect(minX(island.points)).toBeCloseTo(-layout.islandSize[0] / 2, 5);
    expect(minX(standard.points)).toBeLessThan(minX(island.points));
    expect(minX(boss.points)).toBeLessThan(minX(standard.points));
  });

  it('keeps the island centred and pulls back to make room for the enemy', () => {
    const enemy: readonly Vec3[] = [[-9, 0, 0], [-9, 3, 0]];
    const islandOnly = computeCameraFit({ ...BASE, insets: undefined });
    const withEnemy = computeCameraFit({ ...BASE, points: [...SQUARE, ...enemy], centrePoints: SQUARE, insets: undefined });

    expect(withEnemy.offset[0]).toBeCloseTo(0, 5);
    expect(withEnemy.distance).toBeGreaterThan(islandOnly.distance);
  });
});
