/**
 * Stateful Arena Workbench controller hook orchestrating Catalog, Battle, and Progression.
 * Plays the Rival's turn out one action at a time and announces Cloud Incidents.
 */

import {
  type HandCardInstance,
  type IncidentCard,
  type MatchState,
  type RivalPersona,
  getIncidentCard,
  resolveRivalForTrack,
} from '../../battle';
import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  CatalogCard,
  CatalogRepository,
  CurriculumOverview,
} from '../../catalog';
import {
  type CampaignProgress,
  type ProgressRepository,
  calculateTotalStars,
} from '../../progression';
import { createControllerActions } from './arena-actions';
import { useArenaSessionState } from './arena-session-state';

/** What the player chose to play: a battle against the track's enemy, or guided study. */
export type PlayMode = 'battle' | 'study';

export interface ArenaControllerState {
  readonly curriculum: CurriculumOverview;
  readonly progress: CampaignProgress;
  readonly totalStars: number;
  readonly activeBlueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly playMode: PlayMode;
  /** The track's one enemy, its boss. */
  readonly rival: RivalPersona;
  readonly rivalActing: boolean;
  readonly announcedIncident: IncidentCard | null;
  readonly selectedInstanceId: string | null;
  readonly selectedCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly inspectedSlot: ArchitectureSlot | undefined;
  readonly catalogOpen: boolean;
  readonly rulesOpen: boolean;
  readonly debriefOpen: boolean;
  readonly setCatalogOpen: (open: boolean) => void;
  readonly setRulesOpen: (open: boolean) => void;
  readonly dismissDebrief: () => void;
  readonly dismissIncident: () => void;
  readonly launchScenario: (blueprintId: string, mode: PlayMode, seed?: number) => void;
  readonly handleCardClick: (instance: HandCardInstance, card: CatalogCard) => void;
  readonly handleInspectSlot: (slotId: string) => void;
  readonly handleTargetSlot: (slotId: string) => void;
  readonly handleDiscardCard: (instanceId: string) => void;
  readonly handleEndTurn: () => void;
}


export function useArenaController(
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
  rivalStepDelayMs: number,
  nextSeed: () => number,
): ArenaControllerState {
  const s = useArenaSessionState(catalogRepository, progressRepository, nextSeed);
  const selectedHandItem = s.matchState.hand.find((h) => h.instanceId === s.selectedInstanceId);
  const selectedCard = selectedHandItem ? s.curriculum.cardsById[selectedHandItem.cardId] : undefined;
  const actions = createControllerActions(
    s,
    { catalogRepository, progressRepository, rivalStepDelayMs, nextSeed },
    { item: selectedHandItem, card: selectedCard },
  );

  return {
    curriculum: s.curriculum,
    progress: s.progress,
    totalStars: calculateTotalStars(s.progress),
    activeBlueprint: s.activeBlueprint,
    matchState: s.matchState,
    playMode: s.matchState.mode,
    rival: resolveRivalForTrack(s.activeBlueprint.trackId),
    rivalActing: s.rivalActing,
    announcedIncident: s.announcedIncidentId !== null ? (getIncidentCard(s.announcedIncidentId) ?? null) : null,
    selectedInstanceId: s.selectedInstanceId,
    selectedCard,
    inspectedSlotId: s.inspectedSlotId,
    inspectedSlot: s.activeBlueprint.slots.find((slot) => slot.id === s.inspectedSlotId),
    catalogOpen: s.catalogOpen,
    rulesOpen: s.rulesOpen,
    debriefOpen: s.matchState.status === 'completed' && !s.debriefDismissed && !s.rivalActing,
    setCatalogOpen: s.setCatalogOpen,
    setRulesOpen: s.setRulesOpen,
    dismissDebrief: () => s.setDebriefDismissed(true),
    dismissIncident: () => s.setAnnouncedIncidentId(null),
    ...actions,
  };
}
