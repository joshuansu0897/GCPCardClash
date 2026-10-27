import { describe, expect, it } from 'vitest';

import { type MatchState, type SlotDeployment, startScenarioMatch } from '../../../src/modules/battle';
import { createStaticCatalogRepository, loadCurriculumOverview } from '../../../src/modules/catalog';
import {
  computeIslandLayout,
  describeAffordance,
  detectWebGLSupport,
  diffBoardEvents,
  resolveBuildingArchetype,
  resolvePadAffordance,
  resolveTrackTheme,
} from '../../../src/modules/diorama';

describe('Diorama bounded context', () => {
  const catalog = createStaticCatalogRepository();
  const overview = loadCurriculumOverview(catalog);
  const blueprint = catalog.getBlueprintById('arc-101-regional-web');
  if (blueprint === undefined) {
    throw new Error('Expected arc-101-regional-web blueprint');
  }
  const [slotA, slotB] = blueprint.slots;
  if (slotA === undefined || slotB === undefined) {
    throw new Error('Expected at least two slots');
  }
  const baseState = startScenarioMatch({ blueprint, allCards: catalog.listCards(), mode: 'battle', seed: 7 });

  function withSlot(state: MatchState, slotId: string, patch: Partial<SlotDeployment>): MatchState {
    const current = state.slots[slotId];
    if (current === undefined) {
      throw new Error(`Unknown slot ${slotId}`);
    }
    return { ...state, slots: { ...state.slots, [slotId]: { ...current, ...patch } } };
  }

  describe('computeIslandLayout', () => {
    const layout = computeIslandLayout(blueprint);

    it('places one pad per slot, one terrace per zone, and every context actor', () => {
      expect(layout.pads).toHaveLength(blueprint.slots.length);
      expect(layout.terraces).toHaveLength(blueprint.zones.length);
      expect(layout.contexts.map((c) => c.nodeId)).toEqual((blueprint.contextNodes ?? []).map((n) => n.id));
    });

    it('stands each pad on its own zone terrace, and later zones on higher terraces', () => {
      const ys = layout.terraces.map((t) => t.center[1]);
      expect([...ys].sort((a, b) => a - b)).toEqual(ys);
      for (const pad of layout.pads) {
        const terrace = layout.terraces.find((t) => t.zoneId === pad.zoneId);
        expect(pad.position[1]).toBe(terrace?.center[1]);
        expect(Math.abs(pad.position[0] - (terrace?.center[0] ?? 0))).toBeLessThan((terrace?.size[0] ?? 0) / 2);
      }
    });

    it('keeps every pad and actor on the island, inside or outside the cloud as authored', () => {
      const [width, depth] = layout.islandSize;
      for (const position of [...layout.pads.map((p) => p.position), ...layout.contexts.map((c) => c.position)]) {
        expect(Math.abs(position[0])).toBeLessThan(width / 2);
        expect(Math.abs(position[2])).toBeLessThan(depth / 2);
      }
      const shoppers = layout.contexts.find((c) => c.nodeId === 'shoppers');
      expect(shoppers?.position[0]).toBeLessThan(layout.cloud.center[0] - layout.cloud.size[0] / 2);
    });

    it('routes a lane per one-way flow and two per request/response pair, above every terrace', () => {
      const pairs = blueprint.edges.filter((e) => e.returnLabel !== undefined).length;
      expect(layout.roads).toHaveLength(blueprint.edges.length + pairs);
      const highestTerrace = Math.max(...layout.terraces.map((t) => t.center[1]));
      for (const road of layout.roads) {
        expect(road.points.length).toBeGreaterThanOrEqual(2);
        expect(road.points.every((p) => p[1] > highestTerrace)).toBe(true);
      }
    });
  });

  describe('diffBoardEvents', () => {
    it('emits a single board-reset on first render or when a new match starts', () => {
      expect(diffBoardEvents(null, baseState).map((e) => e.type)).toEqual(['board-reset']);
      const study: MatchState = { ...baseState, mode: 'study' };
      expect(diffBoardEvents(baseState, study).map((e) => e.type)).toEqual(['board-reset']);
    });

    it('emits card-deployed for a newly occupied slot', () => {
      const next = withSlot(baseState, slotA.id, { owner: 'player', serviceCardId: 'global-ext-alb' });
      expect(diffBoardEvents(baseState, next)).toEqual([
        expect.objectContaining({ type: 'card-deployed', slotId: slotA.id, owner: 'player', cardId: 'global-ext-alb' }),
      ]);
    });

    it('emits slot-captured when ownership flips, and shield-locked when a shield appears', () => {
      const rivalHeld = withSlot(baseState, slotA.id, { owner: 'rival', serviceCardId: 'cloud-cdn' });
      const captured = withSlot(rivalHeld, slotA.id, { owner: 'player', serviceCardId: 'global-ext-alb' });
      expect(diffBoardEvents(rivalHeld, captured)).toEqual([
        expect.objectContaining({ type: 'slot-captured', owner: 'player', previousOwner: 'rival' }),
      ]);

      const shielded = withSlot(captured, slotA.id, { shieldCardId: 'shield-armor', shieldMatchedRecommendation: true });
      expect(diffBoardEvents(captured, shielded)).toEqual([
        expect.objectContaining({ type: 'shield-locked', slotId: slotA.id, matchedRecommendation: true }),
      ]);
    });

    it('reports same-turn energy gains, new mistakes, and turn advances', () => {
      const funded: MatchState = { ...baseState, playerEnergy: baseState.playerEnergy + 2, playerMistakes: 1 };
      expect(diffBoardEvents(baseState, funded).map((e) => e.type)).toEqual(['energy-gained', 'mistake']);
      const nextTurn: MatchState = { ...baseState, turn: 2, logs: [...baseState.logs, ...baseState.logs] };
      expect(diffBoardEvents(baseState, nextTurn).map((e) => e.type)).toEqual(['turn-advanced']);
    });

    it('emits incident-struck once per strike, naming the pads it knocked out', () => {
      const held = withSlot(baseState, slotA.id, { owner: 'rival', serviceCardId: 'cloud-cdn' });
      const struck: MatchState = {
        ...withSlot(held, slotA.id, { owner: null, serviceCardId: null }),
        incident: { incidentId: 'regional-outage', turn: 1, affectedZoneId: slotA.zoneId },
      };
      expect(diffBoardEvents(held, struck)).toEqual([
        expect.objectContaining({
          type: 'incident-struck',
          incidentId: 'regional-outage',
          affectedZoneId: slotA.zoneId,
          struckSlotIds: [slotA.id],
        }),
      ]);
      const later: MatchState = { ...struck, playerScore: struck.playerScore + 10 };
      expect(diffBoardEvents(struck, later).some((e) => e.type === 'incident-struck')).toBe(false);
    });

    it('generates unique event ids within a single diff', () => {
      let next = withSlot(baseState, slotA.id, { owner: 'player', serviceCardId: 'global-ext-alb' });
      next = withSlot(next, slotB.id, { owner: 'rival', serviceCardId: 'cloud-cdn' });
      const ids = diffBoardEvents(baseState, next).map((e) => e.id);
      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('resolvePadAffordance', () => {
    const service = overview.cardsById['global-ext-alb'];
    const shield = overview.cardsById['shield-armor'];
    if (service?.kind !== 'service' || shield?.kind !== 'shield') {
      throw new Error('Expected global-ext-alb service and shield-armor shield cards');
    }
    const funded: MatchState = { ...baseState, playerEnergy: 6 };
    const mine = withSlot(funded, slotA.id, { owner: 'player', serviceCardId: 'global-ext-alb' });
    const theirs = withSlot(funded, slotA.id, { owner: 'rival', serviceCardId: 'cloud-cdn' });

    it('offers deploy on open pads and capture (+1E) on unshielded rival pads', () => {
      expect(resolvePadAffordance(funded, slotA.id, service)).toEqual({ kind: 'deploy', cost: service.energyCost });
      expect(resolvePadAffordance(theirs, slotA.id, service)).toEqual({ kind: 'capture', cost: service.energyCost + 1 });
      const shielded = withSlot(theirs, slotA.id, { shieldCardId: 'shield-armor' });
      expect(resolvePadAffordance(shielded, slotA.id, service).kind).toBe('none');
      expect(resolvePadAffordance(mine, slotA.id, service).kind).toBe('none');
    });

    it('offers harden only on pads the player owns and has not shielded', () => {
      expect(resolvePadAffordance(mine, slotA.id, shield).kind).toBe('harden');
      expect(resolvePadAffordance(theirs, slotA.id, shield).kind).toBe('none');
      expect(resolvePadAffordance(funded, slotA.id, shield).kind).toBe('none');
    });

    it('flags unaffordable targets with the required cost', () => {
      const affordance = resolvePadAffordance({ ...theirs, playerEnergy: 0 }, slotA.id, service);
      expect(affordance).toEqual({ kind: 'unaffordable', cost: service.energyCost + 1 });
      expect(describeAffordance(affordance)).toBe(`Need ${service.energyCost + 1}E`);
    });

    it('reflects incident cost changes such as the Zero-Day capture discount', () => {
      const zeroDay: MatchState = { ...theirs, incident: { incidentId: 'zero-day', turn: 1, affectedZoneId: null } };
      expect(resolvePadAffordance(zeroDay, slotA.id, service)).toEqual({ kind: 'capture', cost: service.energyCost });
    });
  });

  it('gives every track its own world and enemy form', () => {
    const themes = catalog.listTracks().map((track) => resolveTrackTheme(track.id));
    expect(new Set(themes.map((t) => t.enemyForm)).size).toBe(themes.length);
    expect(new Set(themes.map((t) => t.name)).size).toBe(themes.length);
  });

  it('maps every catalog card onto a building archetype', () => {
    for (const card of catalog.listCards()) {
      expect(resolveBuildingArchetype(card)).toMatch(/^(rack|vault|silo|tower|crystal|bastion)$/);
    }
  });

  it('reports no WebGL support under jsdom so the 2D sheet stays the fallback', () => {
    expect(detectWebGLSupport()).toBe(false);
  });
});
