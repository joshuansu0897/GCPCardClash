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
  it('places every prop inside its own terrace footprint', () => {
    const layout = firstLayout();
    const decor = computeTerraceDecor(layout);

    expect(decor.length).toBeGreaterThan(0);
    for (const item of decor) {
      const terrace = layout.terraces.find((t) => item.id.startsWith(`${t.zoneId}:`));
      if (terrace === undefined) {
        throw new Error(`No terrace for ${item.id}`);
      }
      const [cx, , cz] = terrace.center;
      const [w, d] = terrace.size;
      expect(Math.abs(item.position[0] - cx)).toBeLessThanOrEqual(w / 2);
      expect(Math.abs(item.position[2] - cz)).toBeLessThanOrEqual(d / 2);
    }
  });

  it('gives the same blueprint the same decor every time', () => {
    const layout = firstLayout();

    expect(computeTerraceDecor(layout)).toEqual(computeTerraceDecor(layout));
  });
});
