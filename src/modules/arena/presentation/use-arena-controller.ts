/**
 * Stateful Arena Workbench controller hook orchestrating Catalog, Battle, and Progression.
 */

import { useState } from 'react';

import {
  type ArenaMode,
  type HandCardInstance,
  type MatchState,
  performMatchAction,
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
  recordScenarioOutcome,
  rememberSelectedBlueprint,
} from '../../progression';

export interface ArenaControllerState {
  readonly curriculum: CurriculumOverview;
  readonly progress: CampaignProgress;
  readonly totalStars: number;
  readonly activeBlueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
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
  readonly launchScenario: (blueprintId: string, mode: ArenaMode, seed?: number) => void;
  readonly handleCardClick: (instance: HandCardInstance, card: CatalogCard) => void;
  readonly handleInspectSlot: (slotId: string) => void;
  readonly handleTargetSlot: (slotId: string) => void;
  readonly handleDiscardCard: (instanceId: string) => void;
  readonly handleEndTurn: () => void;
}

type SessionState = ReturnType<typeof useArenaSessionState>;

function useArenaSessionState(
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
) {
  const curriculum = loadCurriculumOverview(catalogRepository);
  const allCards = catalogRepository.listCards();
  const [progress, setProgress] = useState<CampaignProgress>(() => progressRepository.loadProgress());
  const initialBp = resolveInitialBlueprint(curriculum.blueprints, progress.lastBlueprintId);

  const [activeBlueprint, setActiveBlueprint] = useState<ArchitectureBlueprint>(initialBp);
  const [matchState, setMatchState] = useState<MatchState>(() =>
    startScenarioMatch({ blueprint: initialBp, allCards, mode: 'battle' }),
  );
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(initialBp.slots[0]?.id ?? null);
  const [catalogOpen, setCatalogOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [debriefDismissed, setDebriefDismissed] = useState<boolean>(false);

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
  };
}

export function useArenaController(
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
): ArenaControllerState {
  const s = useArenaSessionState(catalogRepository, progressRepository);
  const selectedHandItem = s.matchState.hand.find((h) => h.instanceId === s.selectedInstanceId);
  const selectedCard = selectedHandItem ? s.curriculum.cardsById[selectedHandItem.cardId] : undefined;
  const actions = createControllerActions(s, catalogRepository, progressRepository, selectedHandItem, selectedCard);

  return {
    curriculum: s.curriculum,
    progress: s.progress,
    totalStars: calculateTotalStars(s.progress),
    activeBlueprint: s.activeBlueprint,
    matchState: s.matchState,
    selectedInstanceId: s.selectedInstanceId,
    selectedCard,
    inspectedSlotId: s.inspectedSlotId,
    inspectedSlot: s.activeBlueprint.slots.find((slot) => slot.id === s.inspectedSlotId),
    catalogOpen: s.catalogOpen,
    rulesOpen: s.rulesOpen,
    debriefOpen: s.matchState.status === 'completed' && !s.debriefDismissed,
    setCatalogOpen: s.setCatalogOpen,
    setRulesOpen: s.setRulesOpen,
    dismissDebrief: () => s.setDebriefDismissed(true),
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
      }));
    }
  };
}

function createControllerActions(
  s: SessionState,
  catalogRepository: CatalogRepository,
  progressRepository: ProgressRepository,
  selectedHandItem: HandCardInstance | undefined,
  selectedCard: CatalogCard | undefined,
) {
  const commitState = makeCommitter(s, progressRepository);
  const launchScenario = (blueprintId: string, mode: ArenaMode, seed = 202610): void => {
    const target = catalogRepository.getBlueprintById(blueprintId) ?? s.activeBlueprint;
    s.setActiveBlueprint(target);
    s.setSelectedInstanceId(null);
    s.setInspectedSlotId(target.slots[0]?.id ?? null);
    s.setDebriefDismissed(false);
    s.setCatalogOpen(false);
    s.setProgress(rememberSelectedBlueprint(progressRepository, target.id));
    s.setMatchState(startScenarioMatch({ blueprint: target, allCards: s.allCards, mode, seed }));
  };

  return {
    launchScenario,
    handleCardClick: (instance: HandCardInstance, card: CatalogCard) =>
      onCardAction(s, instance, card, commitState),
    handleInspectSlot: (slotId: string) => {
      s.setSelectedInstanceId(null);
      s.setInspectedSlotId(slotId);
    },
    handleTargetSlot: (slotId: string) =>
      onTargetSlotAction(s, slotId, selectedHandItem, selectedCard, commitState),
    handleDiscardCard: (instanceId: string) => {
      s.setSelectedInstanceId(null);
      commitState(
        performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, { type: 'discard-card', instanceId }),
        s.activeBlueprint,
      );
    },
    handleEndTurn: () => {
      s.setSelectedInstanceId(null);
      commitState(
        performMatchAction(s.matchState, s.activeBlueprint, s.curriculum.cardsById, { type: 'end-turn' }),
        s.activeBlueprint,
      );
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
