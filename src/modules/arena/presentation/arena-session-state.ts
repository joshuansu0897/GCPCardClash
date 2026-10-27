/**
 * React state backing the Arena controller: the curriculum, campaign progress, the live match,
 * the player's selection, the open overlays, and the Rival-turn timers.
 */

import { useEffect, useRef, useState } from 'react';

import { type MatchState, startScenarioMatch } from '../../battle';
import {
  type ArchitectureBlueprint,
  type CatalogRepository,
  loadCurriculumOverview,
} from '../../catalog';
import type { CampaignProgress, ProgressRepository } from '../../progression';

export type SessionState = ReturnType<typeof useArenaSessionState>;

export function useArenaSessionState(
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
  nextSeed: () => number,
) {
  const curriculum = loadCurriculumOverview(catalogRepository);
  const allCards = catalogRepository.listCards();
  const [progress, setProgress] = useState<CampaignProgress>(() => progressRepository.loadProgress());
  const initialBp = resolveInitialBlueprint(curriculum.blueprints, progress.lastBlueprintId);

  const [activeBlueprint, setActiveBlueprint] = useState<ArchitectureBlueprint>(initialBp);
  const [matchState, setMatchState] = useState<MatchState>(() =>
    startScenarioMatch({ blueprint: initialBp, allCards, mode: 'battle', seed: nextSeed() }),
  );
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(initialBp.slots[0]?.id ?? null);
  const [rivalActing, setRivalActing] = useState<boolean>(false);
  const [announcedIncidentId, setAnnouncedIncidentId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  return {
    curriculum,
    allCards,
    progress,
    setProgress,
    activeBlueprint,
    setActiveBlueprint,
    matchState,
    setMatchState,
    selectedInstanceId,
    setSelectedInstanceId,
    inspectedSlotId,
    setInspectedSlotId,
    rivalActing,
    setRivalActing,
    announcedIncidentId,
    setAnnouncedIncidentId,
    timers,
    ...useOverlayState(),
  };
}

function useOverlayState() {
  const [catalogOpen, setCatalogOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [debriefDismissed, setDebriefDismissed] = useState<boolean>(false);

  return { catalogOpen, setCatalogOpen, rulesOpen, setRulesOpen, debriefDismissed, setDebriefDismissed };
}

function resolveInitialBlueprint(
  blueprints: readonly ArchitectureBlueprint[],
  lastId: string | null,
): ArchitectureBlueprint {
  const matched = lastId !== null ? blueprints.find((b) => b.id === lastId) : undefined;
  const fallback = blueprints[0];
  if (matched !== undefined) {
    return matched;
  }
  if (fallback === undefined) {
    throw new Error('Catalog must define at least one ArchitectureBlueprint');
  }
  return fallback;
}
