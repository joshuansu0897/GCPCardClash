import { describe, expect, it } from 'vitest';

import {
  createStaticCatalogRepository,
  loadCurriculumOverview,
} from '../../../src/modules/catalog';

describe('Catalog bounded context', () => {
  const repository = createStaticCatalogRepository();

  it('exposes all 4 certification tracks with 2 reference blueprints per track', () => {
    const overview = loadCurriculumOverview(repository);

    expect(overview.tracks).toHaveLength(4);
    expect(overview.blueprints).toHaveLength(8);

    for (const track of overview.tracks) {
      const trackBlueprints = repository.listBlueprints(track.id);
      expect(trackBlueprints).toHaveLength(2);
    }
  });

  it('provides energy, service, and shield cards with complete educational study notes', () => {
    const cards = repository.listCards();
    const energyCards = cards.filter((c) => c.kind === 'energy');
    const serviceCards = cards.filter((c) => c.kind === 'service');
    const shieldCards = cards.filter((c) => c.kind === 'shield');

    expect(energyCards.length).toBeGreaterThanOrEqual(4);
    expect(serviceCards.length).toBeGreaterThanOrEqual(20);
    expect(shieldCards).toHaveLength(5);

    for (const card of cards) {
      expect(card.shortCode.length).toBeGreaterThanOrEqual(2);
      expect(card.whenToUse.length).toBeGreaterThan(15);
      expect(card.avoidWhen.length).toBeGreaterThan(15);
      expect(card.examTip.length).toBeGreaterThan(15);
    }
  });

  it('maintains 100% referential and grid coordinate integrity across all blueprints', () => {
    const blueprints = repository.listBlueprints();

    for (const bp of blueprints) {
      const zoneById = new Map(bp.zones.map((z) => [z.id, z]));
      const slotIds = new Set<string>();
      const occupiedCells = new Set<string>();

      for (const slot of bp.slots) {
        const zone = zoneById.get(slot.zoneId);
        expect(zone).toBeDefined();

        const coordKey = `${zone?.column}-${slot.row}`;
        expect(occupiedCells.has(coordKey)).toBe(false);
        occupiedCells.add(coordKey);
        slotIds.add(slot.id);

        for (const serviceId of slot.acceptedServiceIds) {
          const card = repository.getCardById(serviceId);
          expect(card?.kind).toBe('service');
        }
      }

      for (const distractorId of bp.distractorServiceIds) {
        const card = repository.getCardById(distractorId);
        expect(card?.kind).toBe('service');
      }

      for (const edge of bp.edges) {
        expect(slotIds.has(edge.fromSlotId)).toBe(true);
        expect(slotIds.has(edge.toSlotId)).toBe(true);
      }
    }
  });
});
