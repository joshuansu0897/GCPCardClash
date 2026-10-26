import { beforeEach, describe, expect, it } from 'vitest';

import {
  BrowserProgressRepository,
  InMemoryProgressRepository,
  calculateTotalStars,
  deriveArchitectRank,
  recordScenarioOutcome,
  rememberSelectedBlueprint,
} from '../../../src/modules/progression';

describe('Progression bounded context', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('retains highest stars and best score across replays using InMemoryProgressRepository', () => {
    const repo = new InMemoryProgressRepository();

    recordScenarioOutcome(repo, {
      blueprintId: 'arc-101-regional-web',
      stars: 2,
      playerScore: 410,
    });
    const second = recordScenarioOutcome(repo, {
      blueprintId: 'arc-101-regional-web',
      stars: 1,
      playerScore: 320,
    });

    const record = second.records['arc-101-regional-web'];
    expect(record?.bestStars).toBe(2);
    expect(record?.bestScore).toBe(410);
    expect(record?.completedCount).toBe(2);
  });

  it('advances Cloud Architect rank thresholds accurately as total stars accumulate', () => {
    const repo = new InMemoryProgressRepository();

    expect(deriveArchitectRank(0)).toBe('Cloud Explorer');
    expect(deriveArchitectRank(4)).toBe('Associate Cloud Engineer');
    expect(deriveArchitectRank(10)).toBe('Professional Cloud Architect');
    expect(deriveArchitectRank(18)).toBe('Principal Cloud Fellow');

    recordScenarioOutcome(repo, { blueprintId: 'b1', stars: 3, playerScore: 500 });
    const updated = recordScenarioOutcome(repo, { blueprintId: 'b2', stars: 2, playerScore: 390 });
    expect(calculateTotalStars(updated)).toBe(5);
    expect(deriveArchitectRank(calculateTotalStars(updated))).toBe('Associate Cloud Engineer');
  });

  it('persists and safely narrows corrupted payloads in BrowserProgressRepository', () => {
    const browserRepo = new BrowserProgressRepository();

    rememberSelectedBlueprint(browserRepo, 'arc-201-global-fintech');
    recordScenarioOutcome(browserRepo, {
      blueprintId: 'arc-201-global-fintech',
      stars: 3,
      playerScore: 620,
    });

    const reloaded = browserRepo.loadProgress();
    expect(reloaded.lastBlueprintId).toBe('arc-201-global-fintech');
    expect(reloaded.records['arc-201-global-fintech']?.bestStars).toBe(3);

    window.localStorage.setItem('gcp_card_clash_progress_v1', '{broken-json');
    const fallback = browserRepo.loadProgress();
    expect(fallback.lastBlueprintId).toBeNull();
    expect(calculateTotalStars(fallback)).toBe(0);
  });
});
