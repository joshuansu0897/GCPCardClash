import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArenaWorkbench } from '../../../src/modules/arena';
import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { InMemoryProgressRepository } from '../../../src/modules/progression';

const catalog = createStaticCatalogRepository();

function renderArena(options: { readonly unlockedBoss?: boolean; readonly rivalStepDelayMs?: number } = {}) {
  const progress = new InMemoryProgressRepository(
    options.unlockedBoss === true
      ? {
          lastBlueprintId: 'arc-101-regional-web',
          records: {
            'arc-101-regional-web': {
              blueprintId: 'arc-101-regional-web',
              bestStars: 1,
              bestScore: 120,
              completedCount: 1,
              bossDefeated: false,
            },
          },
        }
      : undefined,
  );
  return render(
    <ArenaWorkbench
      catalogRepository={catalog}
      progressRepository={progress}
      rivalStepDelayMs={options.rivalStepDelayMs}
    />,
  );
}

describe('Match HUD: Rival tray, bosses, incidents, and turn playback', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows how many cards the Rival holds without revealing them', () => {
    renderArena();
    expect(screen.getByRole('img', { name: 'Rival hand: 6 cards' })).toBeDefined();
    expect(screen.getByLabelText('Rival Energy 1 of 6')).toBeDefined();
    expect(screen.getByLabelText(/^Deck: \d+ cards$/)).toBeDefined();
  });

  it('renders the hand as game cards with an accessible action per card', () => {
    renderArena();
    const hand = screen.getByRole('region', { name: 'Architect Card Hand' });
    expect(hand.querySelectorAll('.game-card')).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: /^(Provision|Select Service|Select Shield)/ })).toHaveLength(6);
  });

  it('keeps the boss locked until the blueprint has been completed once', () => {
    renderArena();
    const lockedBoss = screen.getByRole('button', { name: /Boss/ });
    expect((lockedBoss as HTMLButtonElement).disabled).toBe(true);
  });

  it('launches a boss battle once unlocked', () => {
    renderArena({ unlockedBoss: true });
    fireEvent.click(screen.getByRole('button', { name: /Boss/ }));
    expect(screen.getByRole('region', { name: 'The Monolith tray' })).toBeDefined();
    expect(screen.getByText(/BOSS BATTLE — The Monolith/)).toBeDefined();
    expect(screen.getByText(/Next Cloud Incident in/).textContent).toContain('1 turn');
  });

  it('plays the Rival turn out step by step and locks the hand meanwhile', () => {
    vi.useFakeTimers();
    renderArena({ rivalStepDelayMs: 500 });

    fireEvent.click(screen.getByRole('button', { name: 'End Turn' }));
    const locked = screen.getByRole('button', { name: 'Rival Turn…' });
    expect((locked as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText('TURN: 01')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByLabelText('TURN: 02')).toBeDefined();
    expect(screen.getByRole('button', { name: 'End Turn' })).toBeDefined();
  });

  it('announces a Cloud Incident when one strikes on Turn 3', () => {
    renderArena();
    fireEvent.click(screen.getByRole('button', { name: 'End Turn' }));
    fireEvent.click(screen.getByRole('button', { name: 'End Turn' }));

    expect(screen.getByLabelText('TURN: 03')).toBeDefined();
    const announcement = screen.getByRole('alertdialog', { name: /^Cloud Incident: / });
    expect(announcement).toBeDefined();
    expect(screen.getByText(/^INCIDENT · /)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
