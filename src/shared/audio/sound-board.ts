/**
 * Game sound effects (CC0 Kenney audio in `public/audio`). One shared board plays named cues
 * through the Web Audio API, remembers the player's mute choice, and stays silent wherever
 * audio is unavailable (tests, old browsers, before the first user gesture).
 */

import { useSyncExternalStore } from 'react';

export type SoundName =
  | 'card-select'
  | 'card-toss'
  | 'card-land'
  | 'build-pop'
  | 'capture'
  | 'shield'
  | 'energy'
  | 'incident'
  | 'mistake'
  | 'end-turn'
  | 'victory'
  | 'defeat';

const SOUND_VOLUME: Readonly<Record<SoundName, number>> = {
  'card-select': 0.5,
  'card-toss': 0.6,
  'card-land': 0.8,
  'build-pop': 0.55,
  capture: 0.55,
  shield: 0.5,
  energy: 0.45,
  incident: 0.8,
  mistake: 0.5,
  'end-turn': 0.5,
  victory: 0.7,
  defeat: 0.7,
};

const MUTE_KEY = 'gcp-card-clash:muted';

/** The browser pieces the board needs, injectable so tests never touch real audio. */
export interface SoundBoardDeps {
  readonly createContext: () => AudioContext | null;
  readonly fetchBytes: (url: string) => Promise<ArrayBuffer>;
  readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  readonly baseUrl: string;
}

export interface SoundBoard {
  readonly play: (name: SoundName) => void;
  readonly isMuted: () => boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export function createSoundBoard(deps: SoundBoardDeps): SoundBoard {
  let context: AudioContext | null = null;
  let muted = deps.storage?.getItem(MUTE_KEY) === '1';
  const buffers = new Map<SoundName, Promise<AudioBuffer | null>>();
  const listeners = new Set<() => void>();

  // Decode each file once, on first use
  const load = (ctx: AudioContext, name: SoundName): Promise<AudioBuffer | null> => {
    const cached = buffers.get(name);
    if (cached !== undefined) {
      return cached;
    }
    const pending = deps
      .fetchBytes(`${deps.baseUrl}audio/${name}.ogg`)
      .then((bytes) => ctx.decodeAudioData(bytes))
      .catch(() => null);
    buffers.set(name, pending);
    return pending;
  };

  const play = (name: SoundName): void => {
    context ??= deps.createContext();
    if (muted || context === null) {
      return;
    }
    const ctx = context;
    // WHY: browsers start audio suspended until a user gesture; every cue follows one
    void ctx.resume().catch(() => undefined);
    void load(ctx, name).then((buffer) => startBuffer(ctx, buffer, SOUND_VOLUME[name]));
  };

  const setMuted = (next: boolean): void => {
    muted = next;
    deps.storage?.setItem(MUTE_KEY, next ? '1' : '0');
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { play, isMuted: () => muted, setMuted, subscribe };
}

function startBuffer(ctx: AudioContext, buffer: AudioBuffer | null, volume: number): void {
  if (buffer === null) {
    return;
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain).connect(ctx.destination);
  source.start();
}

function browserDeps(): SoundBoardDeps {
  return {
    createContext: () => (typeof AudioContext === 'function' ? new AudioContext() : null),
    fetchBytes: (url) => fetch(url).then((response) => response.arrayBuffer()),
    storage: readStorage(),
    baseUrl: import.meta.env.BASE_URL,
  };
}

function readStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export const soundBoard: SoundBoard = createSoundBoard(browserDeps());

/** The player's mute choice, kept in sync across every component that shows it. */
export function useSoundMuted(): readonly [boolean, (muted: boolean) => void] {
  const muted = useSyncExternalStore(soundBoard.subscribe, soundBoard.isMuted, soundBoard.isMuted);
  return [muted, soundBoard.setMuted];
}
