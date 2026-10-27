/**
 * Public facade for the `progression` bounded context (`ARCH-BOUNDARY`).
 */

export type {
  ArchitectRank,
  CampaignProgress,
  ScenarioMasteryRecord,
  ScenarioUpdateInput,
  StarCount,
} from './domain/progress';

export {
  calculateTotalStars,
  countBossesDefeated,
  createEmptyProgress,
  isBossUnlocked,
  deriveArchitectRank,
  mergeScenarioCompletion,
} from './domain/progress';

export type { ProgressRepository } from './application/ports/progress-repository';
export {
  recordScenarioOutcome,
  rememberSelectedBlueprint,
} from './application/usecases/record-match-result';
export { InMemoryProgressRepository } from './adapters/outbound/in-memory-progress-repository';
export {
  BrowserProgressRepository,
  createBrowserProgressRepository,
} from './adapters/outbound/browser-progress-repository';
