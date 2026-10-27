import { describe, expect, it } from 'vitest';

import {
  createStaticCatalogRepository,
  loadCurriculumOverview,
  resolveBlueprintDiagram,
} from '../../../src/modules/catalog';

describe('Catalog bounded context', () => {
  const repository = createStaticCatalogRepository();

  it('exposes 5 certification tracks and 19 uniquely coded reference blueprints', () => {
    const overview = loadCurriculumOverview(repository);

    expect(overview.tracks).toHaveLength(5);
    expect(overview.blueprints).toHaveLength(19);
    expect(new Set(overview.blueprints.map((bp) => bp.id)).size).toBe(19);
    expect(new Set(overview.blueprints.map((bp) => bp.code)).size).toBe(19);
  });

  it('gives every track a full Associate, Professional and Specialist ladder', () => {
    for (const track of repository.listTracks()) {
      const levels = new Set(repository.listBlueprints(track.id).map((bp) => bp.difficulty));
      expect([...levels].sort(), track.code).toEqual(['Associate', 'Professional', 'Specialist']);
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
      const zoneIds = new Set(bp.zones.map((z) => z.id));
      const diagram = resolveBlueprintDiagram(bp);
      const occupiedCells = new Set<string>();

      for (const node of diagram.nodes) {
        const coordKey = `${node.cell.col}-${node.cell.row}`;
        expect(occupiedCells.has(coordKey)).toBe(false);
        occupiedCells.add(coordKey);
      }

      for (const slot of bp.slots) {
        expect(zoneIds.has(slot.zoneId)).toBe(true);

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
        expect(diagram.nodesById[edge.fromNodeId]).toBeDefined();
        expect(diagram.nodesById[edge.toNodeId]).toBeDefined();
      }
    }
  });
});
