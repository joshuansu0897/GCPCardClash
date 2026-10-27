import { describe, expect, it } from 'vitest';

import {
  HAND_LIMIT,
  type MatchState,
  type SlotDeployment,
  getIncidentCard,
  performMatchAction,
  quoteServiceCost,
  quoteShieldCost,
  resolveBossForTrack,
  resolveEndTurnSequence,
  startScenarioMatch,
} from '../../../src/modules/battle';
import { drawIncidentForTurn, strikeIncident } from '../../../src/modules/battle/domain/incident-rules';
import { evaluateMatchOutcome } from '../../../src/modules/battle/domain/scoring';
import { createStaticCatalogRepository, loadCurriculumOverview } from '../../../src/modules/catalog';

describe('Fair Rival, bosses, and Cloud Incidents', () => {
  const catalog = createStaticCatalogRepository();
  const { cardsById } = loadCurriculumOverview(catalog);
  const allCards = catalog.listCards();
  const blueprint = catalog.getBlueprintById('arc-101-regional-web');
  if (blueprint === undefined) {
    throw new Error('Expected arc-101-regional-web blueprint');
  }
  const [slotA, slotB] = blueprint.slots;
  if (slotA === undefined || slotB === undefined) {
    throw new Error('Expected two slots');
  }

  const start = (profile: 'standard' | 'boss' = 'standard', seed = 11): MatchState =>
    startScenarioMatch({ blueprint, allCards, mode: 'battle', rivalProfile: profile, seed });

  const endTurn = (state: MatchState): MatchState =>
    performMatchAction(state, blueprint, cardsById, { type: 'end-turn' });

  const deckSize = (s: MatchState): number => s.rivalHand.length + s.rivalDrawPile.length + s.rivalDiscardPile.length;

  function withSlot(state: MatchState, slotId: string, patch: Partial<SlotDeployment>): MatchState {
    const current = state.slots[slotId];
    if (current === undefined) {
      throw new Error(`Unknown slot ${slotId}`);
    }
    return { ...state, slots: { ...state.slots, [slotId]: { ...current, ...patch } } };
  }

  describe('symmetric Rival deck', () => {
    it('deals the Rival its own hidden hand of the same size from an independently shuffled deck', () => {
      const state = start();
      expect(state.rivalHand).toHaveLength(HAND_LIMIT);
      expect(deckSize(state)).toBe(state.hand.length + state.drawPile.length + state.discardPile.length);
      const playerIds = new Set(state.hand.map((h) => h.instanceId));
      expect(state.rivalHand.some((h) => playerIds.has(h.instanceId))).toBe(false);
    });

    it('only lets the Rival deploy services it actually held, keeping its deck intact', () => {
      const before = start();
      const after = endTurn(before);
      const rivalCards = new Set([...before.rivalHand, ...before.rivalDrawPile].map((h) => h.cardId));

      for (const slot of Object.values(after.slots)) {
        if (slot.owner === 'rival' && slot.serviceCardId !== null) {
          expect(rivalCards.has(slot.serviceCardId)).toBe(true);
        }
      }
      expect(after.rivalHand.length).toBeLessThanOrEqual(HAND_LIMIT);
      expect(deckSize(after)).toBe(deckSize(before));
      expect(after.rivalEnergy).toBeLessThanOrEqual(after.maxEnergy);
    });

    it('cannot deploy anything when its hand holds no usable service', () => {
      const shieldOnly = allCards.find((c) => c.kind === 'shield');
      if (shieldOnly === undefined) {
        throw new Error('Expected a shield card');
      }
      const state: MatchState = {
        ...start(),
        rivalHand: [{ instanceId: 'r-only', cardId: shieldOnly.id }],
        rivalDrawPile: [],
        rivalDiscardPile: [],
      };
      const after = endTurn(state);
      expect(Object.values(after.slots).some((s) => s.owner === 'rival')).toBe(false);
    });

    it('returns one state per Rival action and settles on the next turn', () => {
      const steps = resolveEndTurnSequence(start('boss'), blueprint, cardsById);
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps[steps.length - 1]?.turn).toBe(2);
      expect(steps.slice(0, -1).every((s) => s.turn === 1)).toBe(true);
    });
  });

  describe('incident cadence', () => {
    it('strikes on Turn 3 in a standard battle and Turn 2 in a boss battle', () => {
      const standard = endTurn(start('standard'));
      expect(standard.incident).toBeNull();
      expect(endTurn(standard).incident?.turn).toBe(3);

      expect(endTurn(start('boss')).incident?.turn).toBe(2);
    });

    it('plays the boss signature incident on every second strike', () => {
      const signature = resolveBossForTrack(blueprint.trackId).signatureIncidentId;
      const boss = start('boss');
      expect(drawIncidentForTurn(boss, 2, signature)?.id).not.toBe(signature);
      expect(drawIncidentForTurn(boss, 3, signature)).toBeNull();
      expect(drawIncidentForTurn(boss, 4, signature)?.id).toBe(signature);
      expect(drawIncidentForTurn(boss, 8, signature)?.id).toBe(signature);
    });

    it('lets an outmatched passive player lose to a boss within a few turns', () => {
      let state = start('boss');
      for (let i = 0; i < 6 && state.status === 'active'; i += 1) {
        state = endTurn(state);
      }
      expect(state.status).toBe('completed');
      expect(state.outcome?.winner).toBe('rival');
    });

    it('never strikes in Guided Study', () => {
      let state = startScenarioMatch({ blueprint, allCards, mode: 'study', seed: 3 });
      for (let i = 0; i < 4; i += 1) {
        state = endTurn(state);
      }
      expect(state.incident).toBeNull();
    });
  });

  describe('incident effects', () => {
    const svc = cardsById[slotA.acceptedServiceIds[0] ?? ''];
    const shield = Object.values(cardsById).find((c) => c.kind === 'shield');
    if (svc?.kind !== 'service' || shield?.kind !== 'shield') {
      throw new Error('Expected a service and a shield');
    }
    const strike = (state: MatchState, id: string): MatchState => {
      const card = getIncidentCard(id);
      if (card === undefined) {
        throw new Error(`Unknown incident ${id}`);
      }
      return strikeIncident(state, blueprint, card);
    };

    it('Zero-Day and Change Freeze move capture costs for both architects', () => {
      const contested = withSlot(start(), slotA.id, { owner: 'rival', serviceCardId: svc.id });
      expect(quoteServiceCost(contested, 'player', svc, contested.slots[slotA.id])).toBe(svc.energyCost + 1);
      const zeroDay = strike(contested, 'zero-day');
      expect(quoteServiceCost(zeroDay, 'player', svc, zeroDay.slots[slotA.id])).toBe(svc.energyCost);
      const freeze = strike(contested, 'change-freeze');
      expect(quoteServiceCost(freeze, 'player', svc, freeze.slots[slotA.id])).toBe(svc.energyCost + 2);
    });

    it('Emergency Patch Window makes shields free', () => {
      expect(quoteShieldCost(strike(start(), 'hot-patch-window'), shield)).toBe(0);
    });

    it('Budget Freeze and Startup Credits change both energy pools within limits', () => {
      const base = { ...start(), playerEnergy: 3, rivalEnergy: 0 };
      const frozen = strike(base, 'budget-freeze');
      expect([frozen.playerEnergy, frozen.rivalEnergy]).toEqual([2, 0]);
      const credited = strike({ ...base, playerEnergy: 6 }, 'free-tier-credits');
      expect([credited.playerEnergy, credited.rivalEnergy]).toEqual([6, 1]);
    });

    it('Privilege Escalation strips only non-recommended shields', () => {
      let state = withSlot(start(), slotA.id, { owner: 'player', serviceCardId: svc.id, shieldCardId: shield.id, shieldMatchedRecommendation: false });
      state = withSlot(state, slotB.id, { owner: 'rival', serviceCardId: svc.id, shieldCardId: shield.id, shieldMatchedRecommendation: true });
      const hit = strike(state, 'privilege-escalation');
      expect(hit.slots[slotA.id]?.shieldCardId).toBeNull();
      expect(hit.slots[slotB.id]?.shieldCardId).toBe(shield.id);
    });

    it('Zonal Outage reopens unshielded nodes in one zone and charges their owners', () => {
      let state = start();
      for (const slot of blueprint.slots) {
        state = withSlot(state, slot.id, { owner: 'player', serviceCardId: svc.id });
      }
      state = { ...state, playerScore: 500 };
      const hit = strike(state, 'regional-outage');
      const zoneId = hit.incident?.affectedZoneId;
      const zoneSlots = blueprint.slots.filter((s) => s.zoneId === zoneId);
      expect(zoneSlots.length).toBeGreaterThan(0);
      expect(zoneSlots.every((s) => hit.slots[s.id]?.owner === null)).toBe(true);
      expect(hit.playerScore).toBe(500 - 30 * zoneSlots.length);
    });

    it('logs the incident with its rule and lesson', () => {
      const hit = strike(start(), 'compliance-audit');
      expect(hit.logs[0]?.severity).toBe('incident');
      expect(hit.logs[0]?.headline).toContain('Surprise Compliance Audit');
    });
  });

  it('marks a player victory over a boss as a boss defeat', () => {
    const won = { ...start('boss'), playerScore: 400, rivalScore: 100 };
    expect(evaluateMatchOutcome(won).bossDefeated).toBe(true);
    expect(evaluateMatchOutcome({ ...won, rivalProfile: 'standard' }).bossDefeated).toBe(false);
  });
});
