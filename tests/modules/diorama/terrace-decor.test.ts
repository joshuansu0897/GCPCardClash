import { describe, expect, it } from 'vitest';

import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { computeIslandLayout } from '../../../src/modules/diorama';
import { computeTerraceDecor } from '../../../src/modules/diorama/domain/terrace-decor';

function firstLayout(): ReturnType<typeof computeIslandLayout> {
  const blueprint = createStaticCatalogRepository().listBlueprints()[0];
  if (blueprint === undefined) {
    throw new Error('Expected a blueprint');
  }
  return computeIslandLayout(blueprint);
}

describe('Terrace decor', () => {
  it('keeps props off pads, actors and flow lanes, and on the island', () => {
    const layout = firstLayout();
    const decor = computeTerraceDecor(layout);
    const nodes = [...layout.pads.map((p) => p.position), ...layout.contexts.map((c) => c.position)];

    expect(decor.length).toBeGreaterThan(0);
    for (const item of decor) {
      const [x, , z] = item.position;
      expect(nodes.every((n) => Math.hypot(n[0] - x, n[2] - z) > 1.2)).toBe(true);
      expect(Math.abs(x)).toBeLessThan(layout.islandSize[0] / 2);
      expect(Math.abs(z)).toBeLessThan(layout.islandSize[1] / 2);
    }
  });

  it('gives props on a zone terrace that zone ink, and props on open grass none', () => {
    const decor = computeTerraceDecor(firstLayout());

    expect(decor.some((item) => item.ink === null && item.kind === 'tree')).toBe(true);
    expect(decor.filter((item) => item.ink === null).every((item) => item.kind === 'tree')).toBe(true);
  });

  it('gives the same blueprint the same decor every time', () => {
    const layout = firstLayout();

    expect(computeTerraceDecor(layout)).toEqual(computeTerraceDecor(layout));
  });
});
