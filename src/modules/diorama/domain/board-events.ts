/**
 * Pure state diffing that turns two consecutive `MatchState` snapshots into animation cues.
 * The renderer only reacts to these cues; it never re-derives game rules.
 */

import type { MatchState, PlayerActor } from '../../battle';

export type BoardEvent =
  | { readonly id: string; readonly type: 'board-reset' }
  | {
      readonly id: string;
      readonly type: 'card-deployed';
      readonly slotId: string;
      readonly owner: PlayerActor;
      readonly cardId: string;
    }
  | {
      readonly id: string;
      readonly type: 'slot-captured';
      readonly slotId: string;
      readonly owner: PlayerActor;
      readonly previousOwner: PlayerActor;
      readonly cardId: string;
    }
  | {
      readonly id: string;
      readonly type: 'shield-locked';
      readonly slotId: string;
      readonly owner: PlayerActor;
      readonly matchedRecommendation: boolean;
    }
  | { readonly id: string; readonly type: 'energy-gained'; readonly amount: number }
  | { readonly id: string; readonly type: 'mistake'; readonly count: number }
  | { readonly id: string; readonly type: 'turn-advanced'; readonly turn: number }
  | { readonly id: string; readonly type: 'match-completed'; readonly winner: 'player' | 'rival' | 'tie' };

export type BoardEventType = BoardEvent['type'];

export function diffBoardEvents(previous: MatchState | null, next: MatchState): readonly BoardEvent[] {
  const stamp = `${next.blueprintId}:${next.turn}:${next.logs.length}`;

  if (previous === null || isNewMatch(previous, next)) {
    return [{ id: `${stamp}:reset`, type: 'board-reset' }];
  }

  const events: BoardEvent[] = [];

  for (const [slotId, after] of Object.entries(next.slots)) {
    const before = previous.slots[slotId];
    if (after.owner !== null && after.serviceCardId !== null && after.serviceCardId !== before?.serviceCardId) {
      const previousOwner = before?.owner ?? null;
      events.push(
        previousOwner !== null && previousOwner !== after.owner
          ? {
              id: `${stamp}:capture:${slotId}`,
              type: 'slot-captured',
              slotId,
              owner: after.owner,
              previousOwner,
              cardId: after.serviceCardId,
            }
          : {
              id: `${stamp}:deploy:${slotId}`,
              type: 'card-deployed',
              slotId,
              owner: after.owner,
              cardId: after.serviceCardId,
            },
      );
    }
    if (after.owner !== null && after.shieldCardId !== null && before?.shieldCardId == null) {
      events.push({
        id: `${stamp}:shield:${slotId}`,
        type: 'shield-locked',
        slotId,
        owner: after.owner,
        matchedRecommendation: after.shieldMatchedRecommendation,
      });
    }
  }

  if (next.turn === previous.turn && next.playerEnergy > previous.playerEnergy) {
    events.push({ id: `${stamp}:energy`, type: 'energy-gained', amount: next.playerEnergy - previous.playerEnergy });
  }
  if (next.playerMistakes > previous.playerMistakes) {
    events.push({ id: `${stamp}:mistake`, type: 'mistake', count: next.playerMistakes - previous.playerMistakes });
  }
  if (next.turn > previous.turn) {
    events.push({ id: `${stamp}:turn`, type: 'turn-advanced', turn: next.turn });
  }
  if (previous.status !== 'completed' && next.status === 'completed' && next.outcome !== null) {
    events.push({ id: `${stamp}:complete`, type: 'match-completed', winner: next.outcome.winner });
  }

  return events;
}

function isNewMatch(previous: MatchState, next: MatchState): boolean {
  return (
    previous.blueprintId !== next.blueprintId ||
    previous.mode !== next.mode ||
    next.turn < previous.turn ||
    next.logs.length < previous.logs.length
  );
}
