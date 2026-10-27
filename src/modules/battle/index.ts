/**
 * Public facade for the `battle` bounded context (`ARCH-BOUNDARY`).
 */

export type {
  ActiveIncident,
  ArenaMode,
  HandCardInstance,
  MatchOutcome,
  MatchState,
  PlayerActor,
  RivalProfile,
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
  CAPTURE_VICTIM_LOSS,
  FLOW_SYNERGY_BONUS,
  RECOMMENDED_SHIELD_BONUS,
  countConnectedOwnedNeighbors,
  countShieldedPlayerNodes,
} from './domain/scoring';

export { quoteServiceCost, quoteShieldCost } from './domain/cost-rules';

export type { IncidentCard, IncidentTone, RoundModifiers } from './domain/incident-rules';
export {
  BOSS_INCIDENT_CADENCE,
  INCIDENT_DECK,
  STANDARD_INCIDENT_CADENCE,
  getIncidentCard,
} from './domain/incident-rules';

export type { BossProfile } from './domain/boss-roster';
export { BOSS_ROSTER, resolveBossForTrack } from './domain/boss-roster';

export type { StartMatchOptions } from './application/usecases/play-match';
export {
  performMatchAction,
  resolveEndTurnSequence,
  startScenarioMatch,
} from './application/usecases/play-match';
