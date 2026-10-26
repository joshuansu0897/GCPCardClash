/**
 * In-memory fake driven port for deterministic hermetic unit and integration tests.
 */

import type { ProgressRepository } from '../../application/ports/progress-repository';
import { type CampaignProgress, createEmptyProgress } from '../../domain/progress';

export class InMemoryProgressRepository implements ProgressRepository {
  private snapshot: CampaignProgress;

  constructor(initial?: CampaignProgress) {
    this.snapshot = initial ?? createEmptyProgress();
  }

  loadProgress(): CampaignProgress {
    return this.snapshot;
  }

  saveProgress(progress: CampaignProgress): void {
    this.snapshot = progress;
  }

  resetProgress(): CampaignProgress {
    this.snapshot = createEmptyProgress();
    return this.snapshot;
  }
}
