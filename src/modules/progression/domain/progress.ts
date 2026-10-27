/**
 * Pure domain campaign mastery and Cloud Architect rank progression models.
 */

export type StarCount = 0 | 1 | 2 | 3;

export type ArchitectRank =
  | 'Cloud Explorer'
  | 'Associate Cloud Engineer'
  | 'Professional Cloud Architect'
  | 'Principal Cloud Fellow';

export interface ScenarioMasteryRecord {
  readonly blueprintId: string;
  readonly bestStars: StarCount;
  readonly bestScore: number;
  readonly completedCount: number;
  readonly bossDefeated: boolean;
}

export interface CampaignProgress {
  readonly lastBlueprintId: string | null;
  readonly records: Readonly<Record<string, ScenarioMasteryRecord>>;
}

export interface ScenarioUpdateInput {
  readonly blueprintId: string;
  readonly stars: StarCount;
  readonly playerScore: number;
  readonly bossDefeated?: boolean;
}

export function createEmptyProgress(): CampaignProgress {
  return {
    lastBlueprintId: null,
    records: {},
  };
}

export function mergeScenarioCompletion(
  current: CampaignProgress,
  update: ScenarioUpdateInput,
): CampaignProgress {
  const previous = current.records[update.blueprintId];
  const prevStars = previous?.bestStars ?? 0;
  const bestStars = (update.stars > prevStars ? update.stars : prevStars) as StarCount;
  const bestScore = Math.max(previous?.bestScore ?? 0, update.playerScore);
  const completedCount = (previous?.completedCount ?? 0) + 1;

  return {
    lastBlueprintId: update.blueprintId,
    records: {
      ...current.records,
      [update.blueprintId]: {
        blueprintId: update.blueprintId,
        bestStars,
        bestScore,
        completedCount,
        bossDefeated: (previous?.bossDefeated ?? false) || update.bossDefeated === true,
      },
    },
  };
}

export function calculateTotalStars(progress: CampaignProgress): number {
  let total = 0;
  for (const rec of Object.values(progress.records)) {
    total += rec.bestStars;
  }
  return total;
}

export function deriveArchitectRank(totalStars: number): ArchitectRank {
  if (totalStars >= 18) {
    return 'Principal Cloud Fellow';
  }
  if (totalStars >= 10) {
    return 'Professional Cloud Architect';
  }
  if (totalStars >= 4) {
    return 'Associate Cloud Engineer';
  }
  return 'Cloud Explorer';
}

export function countBossesDefeated(progress: CampaignProgress): number {
  return Object.values(progress.records).filter((rec) => rec.bossDefeated).length;
}
