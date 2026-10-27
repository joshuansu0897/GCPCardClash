/**
 * Pure domain state and value types for the `battle` bounded context.
 * Zero UI, React, or storage dependencies.
 */

export type PlayerActor = 'player' | 'rival';

export type ArenaMode = 'battle' | 'study';

/** How sharply the track's enemy plays: `gentle` on Associate blueprints, `sharp` on harder ones. */
export type RivalTier = 'gentle' | 'sharp';

export type TurnLogSeverity =
  | 'deploy'
  | 'shield'
  | 'capture'
  | 'energy'
  | 'mistake'
  | 'rival'
  | 'incident'
  | 'system';

export interface HandCardInstance {
  readonly instanceId: string;
  readonly cardId: string;
}

export interface SlotDeployment {
  readonly slotId: string;
  readonly owner: PlayerActor | null;
  readonly serviceCardId: string | null;
  readonly shieldCardId: string | null;
  readonly shieldMatchedRecommendation: boolean;
}

export interface TurnLogEntry {
  readonly id: string;
  readonly turn: number;
  readonly actor: PlayerActor | 'system';
  readonly severity: TurnLogSeverity;
  readonly headline: string;
  readonly detail: string;
  readonly pointsDelta: number;
}

export interface MatchOutcome {
  readonly winner: 'player' | 'rival' | 'tie';
  readonly bossDefeated: boolean;
  readonly stars: 0 | 1 | 2 | 3;
  readonly summary: string;
  readonly shieldedPlayerNodes: number;
}

export interface ActiveIncident {
  readonly incidentId: string;
  /** Turn the incident struck; it stays active for both architects until the next turn begins. */
  readonly turn: number;
  /** Zone knocked out by an outage incident, when the incident picked one. */
  readonly affectedZoneId: string | null;
}

export interface MatchState {
  readonly blueprintId: string;
  readonly mode: ArenaMode;
  readonly rivalTier: RivalTier;
  readonly seed: number;
  readonly turn: number;
  readonly maxEnergy: number;
  readonly playerEnergy: number;
  readonly rivalEnergy: number;
  readonly playerScore: number;
  readonly rivalScore: number;
  readonly playerMistakes: number;
  readonly rivalMistakes: number;
  readonly hand: readonly HandCardInstance[];
  readonly drawPile: readonly HandCardInstance[];
  readonly discardPile: readonly HandCardInstance[];
  /** The Rival plays from its own deck under the exact same hand, energy, and draw rules. */
  readonly rivalHand: readonly HandCardInstance[];
  readonly rivalDrawPile: readonly HandCardInstance[];
  readonly rivalDiscardPile: readonly HandCardInstance[];
  readonly incident: ActiveIncident | null;
  readonly slots: Readonly<Record<string, SlotDeployment>>;
  readonly logs: readonly TurnLogEntry[];
  readonly status: 'active' | 'completed';
  readonly outcome: MatchOutcome | null;
}

export type TurnAction =
  | { readonly type: 'play-energy'; readonly instanceId: string }
  | { readonly type: 'deploy-service'; readonly instanceId: string; readonly slotId: string }
  | { readonly type: 'apply-shield'; readonly instanceId: string; readonly slotId: string }
  | { readonly type: 'discard-card'; readonly instanceId: string }
  | { readonly type: 'end-turn' };
