/**
 * Driven port interface for loading and persisting learner campaign mastery.
 */

import type { CampaignProgress } from '../../domain/progress';

export interface ProgressRepository {
  loadProgress(): CampaignProgress;
  saveProgress(progress: CampaignProgress): void;
  resetProgress(): CampaignProgress;
}
