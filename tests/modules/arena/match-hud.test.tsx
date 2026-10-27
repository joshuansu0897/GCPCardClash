import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArenaWorkbench } from '../../../src/modules/arena';
import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { InMemoryProgressRepository } from '../../../src/modules/progression';

const catalog = createStaticCatalogRepository();

function renderArena(options: { readonly rivalStepDelayMs?: number } = {}) {
  const progress = new InMemoryProgressRepository();
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

  it('names the track boss in the Rival tray', () => {
    renderArena();
    expect(screen.getByRole('region', { name: 'The Monolith tray' })).toBeDefined();
  });

  it('lets the player discard freely and draws back to 6 at the start of the next turn', () => {
    renderArena();
    const hand = screen.getByRole('region', { name: 'Architect Card Hand' });
    for (let i = 0; i < 3; i += 1) {
      const [discard] = screen.getAllByRole('button', { name: /^Discard / });
      if (discard === undefined) {
        throw new Error('Expected a discard button');
      }
      fireEvent.click(discard);
    }
    expect(hand.querySelectorAll('.game-card')).toHaveLength(3);
    expect(screen.getByLabelText('Cards to draw at the start of your next turn: 3')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'End Turn' }));
    expect(hand.querySelectorAll('.game-card')).toHaveLength(6);
  });

  it('renders the hand as game cards with an accessible action per card', () => {
    renderArena();
    const hand = screen.getByRole('region', { name: 'Architect Card Hand' });
    expect(hand.querySelectorAll('.game-card')).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: /^(Provision|Select Service|Select Shield)/ })).toHaveLength(6);
  });

  it('offers only Battle and Study, with no separate boss mode', () => {
    renderArena();
    const modes = screen.getByRole('group', { name: 'Arena Mode' });
    expect([...modes.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Battle', 'Study']);
  });

  it('opens every battle against the track boss, at a gentle pace on Associate blueprints', () => {
    renderArena();
    expect(screen.getByText(/vs The Monolith, Fifteen-Year-Old On-Prem Mainframe/)).toBeDefined();
    expect(screen.getByText(/Next Cloud Incident in/).textContent).toContain('2 turns');
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
    const announcement = screen.getByRole('alert', { name: /^Cloud Incident: / });
    expect(announcement).toBeDefined();
    expect(screen.getByText(/^INCIDENT · /)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByRole('alert', { name: /^Cloud Incident: / })).toBeNull();
  });
});
