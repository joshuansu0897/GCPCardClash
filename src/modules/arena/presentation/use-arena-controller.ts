/**
 * Stateful Arena Workbench controller hook orchestrating Catalog, Battle, and Progression.
 * Plays the Rival's turn out one action at a time and announces Cloud Incidents.
 */

import { useEffect, useRef, useState } from 'react';

import {
  type BossProfile,
  type HandCardInstance,
  type IncidentCard,
  type MatchState,
  type RivalPersona,
  getIncidentCard,
  performMatchAction,
  resolveBossForTrack,
  resolveRivalForTrack,
  resolveEndTurnSequence,
  startScenarioMatch,
} from '../../battle';
import {
  type ArchitectureBlueprint,
  type ArchitectureSlot,
  type CatalogCard,
  type CatalogRepository,
  type CurriculumOverview,
  loadCurriculumOverview,
} from '../../catalog';
import {
  type CampaignProgress,
  type ProgressRepository,
  calculateTotalStars,
  isBossUnlocked,
  recordScenarioOutcome,
  rememberSelectedBlueprint,
} from '../../progression';

/** What the player chose to play: a standard battle, the blueprint's boss, or guided study. */
export type PlayMode = 'battle' | 'boss' | 'study';

export interface ArenaControllerState {
  readonly curriculum: CurriculumOverview;
  readonly progress: CampaignProgress;
  readonly totalStars: number;
  readonly activeBlueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly playMode: PlayMode;
  /** The track's opponent for this match (its everyday Rival, or its boss). */
  readonly rival: RivalPersona;
  readonly boss: BossProfile | null;
  readonly bossUnlocked: boolean;
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

export function resolvePlayMode(state: MatchState): PlayMode {
  if (state.mode === 'study') {
    return 'study';
  }
  return state.rivalProfile === 'boss' ? 'boss' : 'battle';
}

type SessionState = ReturnType<typeof useArenaSessionState>;

function useArenaSessionState(
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
  const [catalogOpen, setCatalogOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [debriefDismissed, setDebriefDismissed] = useState<boolean>(false);
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
    catalogOpen,
    setCatalogOpen,
    rulesOpen,
    setRulesOpen,
    debriefDismissed,
    setDebriefDismissed,
    rivalActing,
    setRivalActing,
    announcedIncidentId,
    setAnnouncedIncidentId,
    timers,
  };
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
    catalogRepository,
    progressRepository,
    selectedHandItem,
    selectedCard,
    rivalStepDelayMs,
    nextSeed,
  );
  const playMode = resolvePlayMode(s.matchState);

  return {
    curriculum: s.curriculum,
    progress: s.progress,
    totalStars: calculateTotalStars(s.progress),
    activeBlueprint: s.activeBlueprint,
    matchState: s.matchState,
    playMode,
    rival: resolveRivalForTrack(s.activeBlueprint.trackId, s.matchState.rivalProfile),
    boss: playMode === 'boss' ? resolveBossForTrack(s.activeBlueprint.trackId) : null,
    bossUnlocked: isBossUnlocked(s.progress, s.activeBlueprint.id),
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

function makeCommitter(s: SessionState, progressRepository: ProgressRepository) {
  return (nextState: MatchState, blueprint: ArchitectureBlueprint): void => {
    s.setMatchState(nextState);
    if (nextState.status === 'completed' && nextState.outcome !== null && nextState.mode === 'battle') {
      s.setProgress(recordScenarioOutcome(progressRepository, {
        blueprintId: blueprint.id,
        stars: nextState.outcome.stars,
        playerScore: nextState.playerScore,
        bossDefeated: nextState.outcome.bossDefeated,
      }));
    }
    if (nextState.incident !== null && nextState.incident.turn === nextState.turn && nextState.status === 'active') {
      s.setAnnouncedIncidentId(nextState.incident.incidentId);
    }
  };
}

function createControllerActions(
  s: SessionState,
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
  selectedHandItem: HandCardInstance | undefined,
  selectedCard: CatalogCard | undefined,
  rivalStepDelayMs: number,
  nextSeed: () => number,
) {
  const commitState = makeCommitter(s, progressRepository);
  const clearTimers = (): void => {
    s.timers.current.forEach((id) => window.clearTimeout(id));
    s.timers.current = [];
  };

  const launchScenario = (blueprintId: string, mode: PlayMode, seed = nextSeed()): void => {
    const target = catalogRepository.getBlueprintById(blueprintId) ?? s.activeBlueprint;
    clearTimers();
    s.setRivalActing(false);
    s.setAnnouncedIncidentId(null);
    s.setActiveBlueprint(target);
    s.setSelectedInstanceId(null);
    s.setInspectedSlotId(target.slots[0]?.id ?? null);
    s.setDebriefDismissed(false);
    s.setCatalogOpen(false);
    s.setProgress(rememberSelectedBlueprint(progressRepository, target.id));
    s.setMatchState(
      startScenarioMatch({
        blueprint: target,
        allCards: s.allCards,
        mode: mode === 'study' ? 'study' : 'battle',
        rivalProfile: mode === 'boss' ? 'boss' : 'standard',
        seed,
      }),
    );
  };

  const runEndTurn = (): void => {
    s.setSelectedInstanceId(null);
    s.setAnnouncedIncidentId(null);
    const steps = resolveEndTurnSequence(s.matchState, s.activeBlueprint, s.curriculum.cardsById);
    const last = steps[steps.length - 1];
    if (last === undefined) {
      return;
    }
    if (rivalStepDelayMs <= 0 || s.matchState.mode === 'study') {
      commitState(last, s.activeBlueprint);
      return;
    }

    // Play the Rival's turn out one action at a time, like a real opponent
    clearTimers();
    s.setRivalActing(true);
    const blueprint = s.activeBlueprint;
    steps.forEach((step, index) => {
      const id = window.setTimeout(() => {
        commitState(step, blueprint);
        if (index === steps.length - 1) {
          s.setRivalActing(false);
        }
      }, (index + 1) * rivalStepDelayMs);
      s.timers.current.push(id);
    });
  };

  return {
    launchScenario,
    handleCardClick: (instance: HandCardInstance, card: CatalogCard) => {
      if (!s.rivalActing) {
        onCardAction(s, instance, card, commitState);
      }
    },
    handleInspectSlot: (slotId: string) => {
      s.setSelectedInstanceId(null);
      s.setInspectedSlotId(slotId);
    },
    handleTargetSlot: (slotId: string) => {
      if (!s.rivalActing) {
        onTargetSlotAction(s, slotId, selectedHandItem, selectedCard, commitState);
      }
    },
    handleDiscardCard: (instanceId: string) => {
      if (s.rivalActing) {
        return;
      }
      s.setSelectedInstanceId(null);
      commitState(
        performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, { type: 'discard-card', instanceId }),
        s.activeBlueprint,
      );
    },
    handleEndTurn: () => {
      if (!s.rivalActing) {
        runEndTurn();
      }
    },
  };
}

function onCardAction(
  s: SessionState,
  instance: HandCardInstance,
  card: CatalogCard,
  commitState: (next: MatchState, bp: ArchitectureBlueprint) => void,
): void {
  if (card.kind === 'energy') {
    s.setSelectedInstanceId(null);
    commitState(
      performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, {
        type: 'play-energy',
        instanceId: instance.instanceId,
      }),
      s.activeBlueprint,
    );
    return;
  }
  s.setSelectedInstanceId((prev) => (prev === instance.instanceId ? null : instance.instanceId));
}

function onTargetSlotAction(
  s: SessionState,
  slotId: string,
  selectedHandItem: HandCardInstance | undefined,
  selectedCard: CatalogCard | undefined,
  commitState: (next: MatchState, bp: ArchitectureBlueprint) => void,
): void {
  s.setInspectedSlotId(slotId);
  if (selectedHandItem === undefined || selectedCard === undefined) {
    return;
  }

  const actionType = selectedCard.kind === 'shield' ? 'apply-shield' : 'deploy-service';
  const next = performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, {
    type: actionType,
    instanceId: selectedHandItem.instanceId,
    slotId,
  });
  s.setSelectedInstanceId(null);
  commitState(next, s.activeBlueprint);
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
