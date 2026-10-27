import { describe, expect, it } from 'vitest';

import {
  HAND_LIMIT,
  INCIDENT_DECK,
  type MatchState,
  RIVAL_ROSTER,
  performMatchAction,
  resolveRivalForTrack,
  startScenarioMatch,
} from '../../../src/modules/battle';
import { beginRivalTurn } from '../../../src/modules/battle/domain/ai-rival';
import { createStaticCatalogRepository, loadCurriculumOverview } from '../../../src/modules/catalog';

describe('Discard rules, track rivals, and incident manifestations', () => {
  const catalog = createStaticCatalogRepository();
  const { cardsById } = loadCurriculumOverview(catalog);
  const allCards = catalog.listCards();
  const blueprint = catalog.getBlueprintById('arc-101-regional-web');
  if (blueprint === undefined) {
    throw new Error('Expected arc-101-regional-web blueprint');
  }

  const start = (): MatchState => startScenarioMatch({ blueprint, allCards, mode: 'battle', seed: 5 });
  const act = (state: MatchState, action: Parameters<typeof performMatchAction>[3]): MatchState =>
    performMatchAction(state, blueprint, cardsById, action);
  const playerDeck = (s: MatchState): number => s.hand.length + s.drawPile.length + s.discardPile.length;

  describe('discarding', () => {
    it('lets the player discard as many cards as they like, for free, without drawing', () => {
      const before = start();
      const after = before.hand.reduce(
        (state, item) => act(state, { type: 'discard-card', instanceId: item.instanceId }),
        before,
      );

      expect(after.hand).toHaveLength(0);
      expect(after.discardPile).toHaveLength(before.discardPile.length + HAND_LIMIT);
      expect(after.drawPile).toEqual(before.drawPile);
      expect(after.playerEnergy).toBe(before.playerEnergy);
      expect(playerDeck(after)).toBe(playerDeck(before));
    });

    it('refills the hand to the limit at the start of the next turn', () => {
      const before = start();
      const [first, second] = before.hand;
      if (first === undefined || second === undefined) {
        throw new Error('Expected an opening hand');
      }
      let state = act(before, { type: 'discard-card', instanceId: first.instanceId });
      state = act(state, { type: 'discard-card', instanceId: second.instanceId });
      expect(state.hand).toHaveLength(HAND_LIMIT - 2);

      const nextTurn = act(state, { type: 'end-turn' });
      expect(nextTurn.turn).toBe(2);
      expect(nextTurn.hand).toHaveLength(HAND_LIMIT);
      expect(playerDeck(nextTurn)).toBe(playerDeck(before));
    });

    it('reshuffles the discard pile into a new deck when the deck runs dry, deterministically', () => {
      const base = start();
      const drained: MatchState = {
        ...base,
        hand: [],
        drawPile: [],
        discardPile: [...base.hand, ...base.drawPile],
      };
      const a = act(drained, { type: 'end-turn' });
      const b = act(drained, { type: 'end-turn' });

      expect(a.hand).toHaveLength(HAND_LIMIT);
      expect(a.hand).toEqual(b.hand);
      expect(playerDeck(a)).toBe(playerDeck(drained));
    });

    it('gives the Rival the identical start-of-turn draw and +1 Energy', () => {
      const base = start();
      const depleted: MatchState = {
        ...base,
        rivalHand: base.rivalHand.slice(0, 2),
        rivalDiscardPile: base.rivalHand.slice(2),
        rivalEnergy: 3,
      };
      const upkept = beginRivalTurn(depleted);
      expect(upkept.rivalHand).toHaveLength(HAND_LIMIT);
      expect(upkept.rivalEnergy).toBe(4);
    });
  });

  describe('track rivals', () => {
    const tracks = catalog.listTracks().map((t) => t.id);

    it('gives every track exactly one enemy, its boss', () => {
      expect(RIVAL_ROSTER).toHaveLength(tracks.length);
      expect(new Set(RIVAL_ROSTER.map((r) => r.trackId))).toEqual(new Set(tracks));
    });

    it('resolves each track to its boss and a real signature incident', () => {
      const incidentIds = new Set(INCIDENT_DECK.map((card) => card.id));
      for (const trackId of tracks) {
        const rival = resolveRivalForTrack(trackId);
        expect(rival.trackId).toBe(trackId);
        expect(incidentIds.has(rival.signatureIncidentId)).toBe(true);
      }
    });

    it('introduces the track boss in the opening log', () => {
      expect(start().logs[0]?.headline).toContain(resolveRivalForTrack(blueprint.trackId).name);
    });
  });

  it('describes how every incident plays out on the board', () => {
    for (const incident of INCIDENT_DECK) {
      expect(incident.manifestation.kind).toMatch(/^(meteor-shower|flyover|sky-fall|lightning|packet-stream)$/);
      if (incident.manifestation.kind === 'sky-fall') {
        expect(incident.manifestation.particle).toBeDefined();
      }
    }
    // Outage incidents land on the zone the rules actually knocked out
    for (const incident of INCIDENT_DECK.filter((c) => c.effects.some((e) => e.kind === 'outage'))) {
      expect(incident.manifestation.target).toBe('affected-zone');
    }
  });
});
