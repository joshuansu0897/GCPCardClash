/**
 * Symmetric read/write access to one architect's resources. Every rule function works on an
 * `ArchitectSide`, which is what guarantees the Rival plays under exactly the player's limits.
 */

import type { HandCardInstance, MatchState, PlayerActor } from './match-types';

export interface ArchitectSide {
  readonly energy: number;
  readonly score: number;
  readonly mistakes: number;
  readonly hand: readonly HandCardInstance[];
  readonly drawPile: readonly HandCardInstance[];
  readonly discardPile: readonly HandCardInstance[];
  readonly discardsRemaining: number;
}

export function opponentOf(actor: PlayerActor): PlayerActor {
  return actor === 'player' ? 'rival' : 'player';
}

export function readSide(state: MatchState, actor: PlayerActor): ArchitectSide {
  if (actor === 'player') {
    return {
      energy: state.playerEnergy,
      score: state.playerScore,
      mistakes: state.playerMistakes,
      hand: state.hand,
      drawPile: state.drawPile,
      discardPile: state.discardPile,
      discardsRemaining: state.discardsRemaining,
    };
  }
  return {
    energy: state.rivalEnergy,
    score: state.rivalScore,
    mistakes: state.rivalMistakes,
    hand: state.rivalHand,
    drawPile: state.rivalDrawPile,
    discardPile: state.rivalDiscardPile,
    discardsRemaining: state.rivalDiscardsRemaining,
  };
}

export function writeSide(state: MatchState, actor: PlayerActor, patch: Partial<ArchitectSide>): MatchState {
  const merged = { ...readSide(state, actor), ...patch };
  if (actor === 'player') {
    return {
      ...state,
      playerEnergy: merged.energy,
      playerScore: merged.score,
      playerMistakes: merged.mistakes,
      hand: merged.hand,
      drawPile: merged.drawPile,
      discardPile: merged.discardPile,
      discardsRemaining: merged.discardsRemaining,
    };
  }
  return {
    ...state,
    rivalEnergy: merged.energy,
    rivalScore: merged.score,
    rivalMistakes: merged.mistakes,
    rivalHand: merged.hand,
    rivalDrawPile: merged.drawPile,
    rivalDiscardPile: merged.discardPile,
    rivalDiscardsRemaining: merged.discardsRemaining,
  };
}

/** Adds `delta` to an architect's score, never dropping below zero. */
export function adjustScore(state: MatchState, actor: PlayerActor, delta: number): MatchState {
  return writeSide(state, actor, { score: Math.max(0, readSide(state, actor).score + delta) });
}
