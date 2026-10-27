import { describe, expect, it } from 'vitest';

import { soundCuesFor } from '../../../src/modules/diorama/presentation/board-sounds';
import {
  ACTOR_MODELS,
  BUILDING_MODEL,
  DECOR_MODELS,
  type KitModelName,
} from '../../../src/modules/diorama/presentation/kit-models';
import { TOSS_DURATION_SEC } from '../../../src/modules/diorama/presentation/vfx-layer';

// WHY: the project ships no Node typings, so Vite's glob import lists the public files instead
const PUBLIC_FILES = new Set(Object.keys(import.meta.glob('/public/{models,audio}/*')).map((key) => key.replace('/public/', '')));
const CREDITS = Object.values(import.meta.glob<string>('/public/models/CREDITS.md', { query: '?raw', import: 'default', eager: true }))[0] ?? '';

describe('Kit models', () => {
  it('ships an optimized model file for every building, actor and decor prop the board can show', () => {
    const names: KitModelName[] = [
      ...Object.values(BUILDING_MODEL),
      ...Object.values(ACTOR_MODELS).flat(),
      ...Object.values(DECOR_MODELS).flat(),
    ];

    for (const name of new Set(names)) {
      expect(PUBLIC_FILES.has(`models/${name}.glb`), name).toBe(true);
    }
  });

  it('credits every shipped kit model', () => {
    for (const file of [...PUBLIC_FILES].filter((path) => path.endsWith('.glb'))) {
      expect(CREDITS, file).toContain(file.replace('models/', ''));
    }
  });
});

describe('Board sound cues', () => {
  it('whooshes on the toss, thuds when the card lands, then pops the building', () => {
    const cues = soundCuesFor({ id: 'e1', type: 'card-deployed', slotId: 's', owner: 'player', cardId: 'c' });

    expect(cues.map((c) => c.sound)).toEqual(['card-toss', 'card-land', 'build-pop']);
    expect(cues[1]?.atSec).toBe(TOSS_DURATION_SEC);
  });

  it('ends a match with the jingle for its winner and keeps quiet on bookkeeping events', () => {
    expect(soundCuesFor({ id: 'w', type: 'match-completed', winner: 'player' })[0]?.sound).toBe('victory');
    expect(soundCuesFor({ id: 'l', type: 'match-completed', winner: 'rival' })[0]?.sound).toBe('defeat');
    expect(soundCuesFor({ id: 't', type: 'turn-advanced', turn: 2 })).toEqual([]);
  });

  it('has a sound file for every cue it can play', () => {
    for (const sound of ['card-select', 'card-toss', 'card-land', 'build-pop', 'capture', 'shield', 'energy', 'incident', 'mistake', 'end-turn', 'victory', 'defeat']) {
      expect(PUBLIC_FILES.has(`audio/${sound}.ogg`), sound).toBe(true);
    }
  });
});
