import { describe, expect, it } from 'vitest';

import {
  FLOW_SYNERGY_BONUS,
  HAND_LIMIT,
  performMatchAction,
  startScenarioMatch,
} from '../../../src/modules/battle';
import {
  createStaticCatalogRepository,
  loadCurriculumOverview,
} from '../../../src/modules/catalog';

describe('Battle bounded context', () => {
  const catalog = createStaticCatalogRepository();
  const overview = loadCurriculumOverview(catalog);
  const storefrontBlueprint = catalog.getBlueprintById('arc-101-regional-web');

  if (storefrontBlueprint === undefined) {
    throw new Error('Expected arc-101-regional-web blueprint');
  }

  it('deals a balanced 6-card opening hand with provisioning energy and valid service cards', () => {
    const state = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'battle',
      seed: 42,
    });

    expect(state.hand).toHaveLength(HAND_LIMIT);
    expect(state.playerEnergy).toBe(2);

    const kinds = state.hand.map((h) => overview.cardsById[h.cardId]?.kind);
    expect(kinds).toContain('energy');
    expect(kinds).toContain('service');
  });

  it('awards connected +40 flow synergy and +60 optimal security shield points', () => {
    let state = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'study',
      seed: 99,
    });

    state = {
      ...state,
      playerEnergy: 6,
      hand: [
        { instanceId: 'i-alb', cardId: 'global-ext-alb' },
        { instanceId: 'i-cdn', cardId: 'cloud-cdn' },
        { instanceId: 'i-armor', cardId: 'shield-armor' },
      ],
    };

    state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 'i-alb',
      slotId: 'ingress-lb',
    });
    expect(state.playerScore).toBe(90);

    state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 'i-cdn',
      slotId: 'edge-cache',
    });
    expect(state.playerScore).toBe(90 + 75 + FLOW_SYNERGY_BONUS);

    state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
      type: 'apply-shield',
      instanceId: 'i-armor',
      slotId: 'ingress-lb',
    });
    expect(state.playerScore).toBe(90 + 75 + FLOW_SYNERGY_BONUS + 60);
    expect(state.slots['ingress-lb']?.shieldCardId).toBe('shield-armor');
  });

  it('penalizes anti-pattern placements with -1 energy and specific diagnostic notes', () => {
    const initial = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'battle',
      seed: 7,
    });

    const state = {
      ...initial,
      playerEnergy: 4,
      hand: [{ instanceId: 'i-bq', cardId: 'bigquery-dw' }],
    };

    const next = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 'i-bq',
      slotId: 'orders-db',
    });

    expect(next.playerMistakes).toBe(1);
    expect(next.playerEnergy).toBe(3);
    expect(next.logs[0]?.severity).toBe('mistake');
    expect(next.logs[0]?.detail).toContain('OLAP');
  });

  it('captures unshielded rival slots for cost + 1 energy', () => {
    const base = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'battle',
      seed: 12,
    });

    const afterRival = performMatchAction(base, storefrontBlueprint, overview.cardsById, {
      type: 'end-turn',
    });
    const rivalOwned = Object.values(afterRival.slots).find((s) => s.owner === 'rival');
    expect(rivalOwned).toBeDefined();
    if (rivalOwned === undefined) {
      return;
    }

    const spec = storefrontBlueprint.slots.find((s) => s.id === rivalOwned.slotId);
    const validCardId = spec?.acceptedServiceIds[0] ?? 'global-ext-alb';
    const ready = {
      ...afterRival,
      playerEnergy: 5,
      hand: [{ instanceId: 'cap-1', cardId: validCardId }],
      slots: { ...afterRival.slots, [rivalOwned.slotId]: { ...rivalOwned, shieldCardId: null } },
    };

    const captured = performMatchAction(ready, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 'cap-1',
      slotId: rivalOwned.slotId,
    });
    expect(captured.slots[rivalOwned.slotId]?.owner).toBe('player');
  });

  it('blocks takeover of security-shielded rival slots without deducting energy', () => {
    const base = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'battle',
      seed: 15,
    });

    const shieldedState = {
      ...base,
      playerEnergy: 5,
      hand: [{ instanceId: 'cap-blocked', cardId: 'global-ext-alb' }],
      slots: {
        ...base.slots,
        'ingress-lb': {
          slotId: 'ingress-lb',
          owner: 'rival' as const,
          serviceCardId: 'global-ext-alb',
          shieldCardId: 'shield-armor',
          shieldMatchedRecommendation: true,
        },
      },
    };

    const blocked = performMatchAction(shieldedState, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 'cap-blocked',
      slotId: 'ingress-lb',
    });
    expect(blocked.slots['ingress-lb']?.owner).toBe('rival');
    expect(blocked.playerEnergy).toBe(5);
  });

  it('awards 3-Star Cloud Architect Mastery on full shielded topology completion', () => {
    let state = startScenarioMatch({
      blueprint: storefrontBlueprint,
      allCards: catalog.listCards(),
      mode: 'battle',
      seed: 101,
    });

    const deployPairs: readonly [string, string][] = [
      ['global-ext-alb', 'ingress-lb'],
      ['cloud-cdn', 'edge-cache'],
      ['cloud-run', 'web-runtime'],
      ['cloud-sql-ha', 'orders-db'],
      ['pubsub-bus', 'order-events'],
      ['cloud-run-functions', 'receipt-worker'],
    ];
    for (const [cardId, slotId] of deployPairs) {
      state = { ...state, playerEnergy: 6, hand: [{ instanceId: `id-${slotId}`, cardId }] };
      state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
        type: 'deploy-service',
        instanceId: `id-${slotId}`,
        slotId,
      });
    }

    state = {
      ...state,
      playerEnergy: 6,
      hand: [
        { instanceId: 'sh1', cardId: 'shield-armor' },
        { instanceId: 'sh2', cardId: 'shield-iam' },
        { instanceId: 's5', cardId: 'cloud-storage' },
      ],
    };
    for (const [instanceId, slotId] of [['sh1', 'ingress-lb'], ['sh2', 'web-runtime']] as const) {
      state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
        type: 'apply-shield',
        instanceId,
        slotId,
      });
    }
    state = performMatchAction(state, storefrontBlueprint, overview.cardsById, {
      type: 'deploy-service',
      instanceId: 's5',
      slotId: 'media-origin',
    });

    expect(state.status).toBe('completed');
    expect(state.outcome?.stars).toBe(3);
  });
});
