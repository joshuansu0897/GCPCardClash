/**
 * Application use cases for updating campaign stars and tracking active scenario selection.
 */

import {
  type CampaignProgress,
  type ScenarioUpdateInput,
  mergeScenarioCompletion,
} from '../../domain/progress';
import type { ProgressRepository } from '../ports/progress-repository';

export function recordScenarioOutcome(
  repository: ProgressRepository,
  update: ScenarioUpdateInput,
): CampaignProgress {
  // Load current progress, merge best stars/score, and persist
  const current = repository.loadProgress();
  const updated = mergeScenarioCompletion(current, update);
  repository.saveProgress(updated);
  return updated;
}

export function rememberSelectedBlueprint(
  repository: ProgressRepository,
  blueprintId: string,
): CampaignProgress {
  const current = repository.loadProgress();
  const updated: CampaignProgress = { ...current, lastBlueprintId: blueprintId };
  repository.saveProgress(updated);
  return updated;
}
