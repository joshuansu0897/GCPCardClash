import { describe, expect, it, vi } from 'vitest';

import { type SoundBoardDeps, createSoundBoard } from '../../../src/shared/audio/sound-board';

function memoryStorage(initial: Record<string, string> = {}): SoundBoardDeps['storage'] {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

/** Minimal Web Audio stand-in that records which buffers were started. */
function fakeAudio() {
  const started: unknown[] = [];
  const node = { connect: () => node, gain: { value: 0 } };
  const context = {
    resume: () => Promise.resolve(),
    decodeAudioData: (bytes: ArrayBuffer) => Promise.resolve({ bytes }),
    createGain: () => node,
    createBufferSource: () => ({ buffer: null as unknown, connect: () => node, start() { started.push(this.buffer); } }),
    destination: {},
  };
  return { context: context as unknown as AudioContext, started };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('Sound board', () => {
  it('fetches each cue once from the audio folder and plays it', async () => {
    const audio = fakeAudio();
    const fetchBytes = vi.fn(() => Promise.resolve(new ArrayBuffer(8)));
    const board = createSoundBoard({ createContext: () => audio.context, fetchBytes, storage: memoryStorage(), baseUrl: '/' });

    board.play('card-land');
    board.play('card-land');
    await flush();

    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(fetchBytes).toHaveBeenCalledWith('/audio/card-land.ogg');
    expect(audio.started).toHaveLength(2);
  });

  it('stays silent while muted and remembers the choice across sessions', async () => {
    const storage = memoryStorage();
    const audio = fakeAudio();
    const board = createSoundBoard({ createContext: () => audio.context, fetchBytes: () => Promise.resolve(new ArrayBuffer(8)), storage, baseUrl: '/' });
    const listener = vi.fn();
    board.subscribe(listener);

    board.setMuted(true);
    board.play('victory');
    await flush();

    expect(audio.started).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(createSoundBoard({ createContext: () => null, fetchBytes: vi.fn(), storage, baseUrl: '/' }).isMuted()).toBe(true);
  });

  it('is a silent no-op where the browser has no Web Audio', () => {
    const fetchBytes = vi.fn();
    const board = createSoundBoard({ createContext: () => null, fetchBytes, storage: null, baseUrl: '/' });

    expect(() => board.play('incident')).not.toThrow();
    expect(fetchBytes).not.toHaveBeenCalled();
  });
});
