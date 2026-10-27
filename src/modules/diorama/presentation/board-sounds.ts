/**
 * Sound cues for board events, timed to the VFX timeline: the toss whooshes as the card leaves,
 * thuds when it lands, and the building pops up right after.
 */

import { useEffect, useRef } from 'react';

import { type SoundName, soundBoard } from '../../../shared/audio/sound-board';
import type { BoardEvent } from '../domain/board-events';
import { nowSec } from './motion';
import { type ActiveEffect, TOSS_DURATION_SEC } from './vfx-layer';

export interface SoundCue {
  readonly sound: SoundName;
  /** Seconds after the effect starts. */
  readonly atSec: number;
}

const POP_AFTER_LANDING_SEC = 0.12;

export function soundCuesFor(event: BoardEvent): readonly SoundCue[] {
  switch (event.type) {
    case 'card-deployed':
      return [
        { sound: 'card-toss', atSec: 0 },
        { sound: 'card-land', atSec: TOSS_DURATION_SEC },
        { sound: 'build-pop', atSec: TOSS_DURATION_SEC + POP_AFTER_LANDING_SEC },
      ];
    case 'slot-captured':
      return [
        { sound: 'capture', atSec: 0 },
        { sound: 'card-land', atSec: TOSS_DURATION_SEC },
      ];
    case 'shield-locked':
      return [{ sound: 'shield', atSec: 0 }];
    case 'incident-struck':
      return [{ sound: 'incident', atSec: 0 }];
    case 'energy-gained':
      return [{ sound: 'energy', atSec: 0 }];
    case 'mistake':
      return [{ sound: 'mistake', atSec: 0 }];
    case 'match-completed':
      return [{ sound: event.winner === 'player' ? 'victory' : 'defeat', atSec: 0.4 }];
    case 'board-reset':
    case 'turn-advanced':
      return [];
  }
}

/** Plays each new effect's cues once, at their offsets from the effect's start time. */
export function useBoardSounds(effects: readonly ActiveEffect[]): void {
  const scheduled = useRef<Set<string>>(new Set());

  // WHY: timers are deliberately not cleared on re-render; a cue already scheduled must still play
  useEffect(() => {
    for (const { event, startsAt } of effects) {
      if (scheduled.current.has(event.id)) {
        continue;
      }
      scheduled.current.add(event.id);
      for (const cue of soundCuesFor(event)) {
        const delayMs = Math.max(0, (startsAt + cue.atSec - nowSec()) * 1000);
        window.setTimeout(() => soundBoard.play(cue.sound), delayMs);
      }
    }
  }, [effects]);
}
