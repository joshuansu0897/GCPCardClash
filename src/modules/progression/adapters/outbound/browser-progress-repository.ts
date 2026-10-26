/**
 * Driven browser `localStorage` adapter with strict `unknown` schema narrowing.
 */

import type { ProgressRepository } from '../../application/ports/progress-repository';
import {
  type CampaignProgress,
  type ScenarioMasteryRecord,
  type StarCount,
  createEmptyProgress,
} from '../../domain/progress';

const STORAGE_KEY = 'gcp_card_clash_progress_v1';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidStars(value: unknown): value is StarCount {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function parseMasteryEntry(blueprintId: string, raw: unknown): ScenarioMasteryRecord | null {
  if (!isObjectRecord(raw)) {
    return null;
  }
  const stars = raw['bestStars'];
  const bestScore = raw['bestScore'];
  const completedCount = raw['completedCount'];

  if (!isValidStars(stars) || typeof bestScore !== 'number' || typeof completedCount !== 'number') {
    return null;
  }

  return { blueprintId, bestStars: stars, bestScore, completedCount };
}

function parseCampaignProgress(rawJson: string | null): CampaignProgress {
  if (rawJson === null) {
    return createEmptyProgress();
  }

  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!isObjectRecord(parsed)) {
      return createEmptyProgress();
    }

    const lastId = typeof parsed['lastBlueprintId'] === 'string' ? parsed['lastBlueprintId'] : null;
    const rawRecords = parsed['records'];
    if (!isObjectRecord(rawRecords)) {
      return { lastBlueprintId: lastId, records: {} };
    }

    const records: Record<string, ScenarioMasteryRecord> = {};
    for (const [key, entryValue] of Object.entries(rawRecords)) {
      const clean = parseMasteryEntry(key, entryValue);
      if (clean !== null) {
        records[key] = clean;
      }
    }
    return { lastBlueprintId: lastId, records };
  } catch {
    return createEmptyProgress();
  }
}

export class BrowserProgressRepository implements ProgressRepository {
  loadProgress(): CampaignProgress {
    try {
      return parseCampaignProgress(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return createEmptyProgress();
    }
  }

  saveProgress(progress: CampaignProgress): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // WHY: Private browsing or disabled storage should degrade gracefully in-session.
    }
  }

  resetProgress(): CampaignProgress {
    const empty = createEmptyProgress();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // WHY: Ignore storage removal errors in restricted browser sandboxes.
    }
    return empty;
  }
}

export function createBrowserProgressRepository(): ProgressRepository {
  return new BrowserProgressRepository();
}
