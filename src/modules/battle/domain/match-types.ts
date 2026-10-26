/**
 * Pure domain state and value types for the `battle` bounded context.
 * Zero UI, React, or storage dependencies.
 */

export type PlayerActor = 'player' | 'rival';

export type ArenaMode = 'battle' | 'study';

export type TurnLogSeverity =
  | 'deploy'
  | 'shield'
  | 'capture'
  | 'energy'
  | 'mistake'
  | 'rival'
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
  readonly stars: 0 | 1 | 2 | 3;
  readonly summary: string;
  readonly shieldedPlayerNodes: number;
}

export interface MatchState {
  readonly blueprintId: string;
  readonly mode: ArenaMode;
  readonly turn: number;
  readonly maxEnergy: number;
  readonly playerEnergy: number;
  readonly rivalEnergy: number;
  readonly discardsRemaining: number;
  readonly playerScore: number;
  readonly rivalScore: number;
  readonly playerMistakes: number;
  readonly hand: readonly HandCardInstance[];
  readonly drawPile: readonly HandCardInstance[];
  readonly discardPile: readonly HandCardInstance[];
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
