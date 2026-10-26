/**
 * Public facade for the `battle` bounded context (`ARCH-BOUNDARY`).
 */

export type {
  ArenaMode,
  HandCardInstance,
  MatchOutcome,
  MatchState,
  PlayerActor,
  SlotDeployment,
  TurnAction,
  TurnLogEntry,
  TurnLogSeverity,
} from './domain/match-types';

export {
  DISCARDS_PER_TURN,
  HAND_LIMIT,
  MAX_TURN_ENERGY,
} from './domain/deck-rules';

export {
  BASE_SHIELD_POINTS,
  FLOW_SYNERGY_BONUS,
  RECOMMENDED_SHIELD_BONUS,
  countConnectedOwnedNeighbors,
  countShieldedPlayerNodes,
} from './domain/scoring';

export type { StartMatchOptions } from './application/usecases/play-match';
export { performMatchAction, startScenarioMatch } from './application/usecases/play-match';
