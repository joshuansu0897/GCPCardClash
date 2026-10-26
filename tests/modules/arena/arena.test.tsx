import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArenaWorkbench } from '../../../src/modules/arena';
import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { InMemoryProgressRepository } from '../../../src/modules/progression';

describe('Arena bounded context presentation', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the Flight-Plan scoreboard, active blueprint slots, and 6-card hand', () => {
    const catalog = createStaticCatalogRepository();
    const progress = new InMemoryProgressRepository();

    render(<ArenaWorkbench catalogRepository={catalog} progressRepository={progress} />);

    expect(screen.getByRole('heading', { name: 'GCP Card Clash' })).toBeDefined();
    expect(
      screen.getByRole('heading', { name: 'ARC-101 · Resilient Serverless Web Storefront' }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Anycast HTTPS Ingress' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'End Turn' })).toBeDefined();
  });

  it('toggles into Guided Study mode and reveals optimal GCP services on slots', () => {
    const catalog = createStaticCatalogRepository();
    const progress = new InMemoryProgressRepository();

    render(<ArenaWorkbench catalogRepository={catalog} progressRepository={progress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Study' }));

    expect(screen.getByText(/Guided Study Active/)).toBeDefined();
    expect(screen.getAllByText(/Fit:/).length).toBeGreaterThanOrEqual(4);
  });

  it('provisions energy from hand and advances turn against the AI Rival', () => {
    const catalog = createStaticCatalogRepository();
    const progress = new InMemoryProgressRepository();

    render(<ArenaWorkbench catalogRepository={catalog} progressRepository={progress} />);

    const provisionButtons = screen.getAllByRole('button', { name: /Provision \+/ });
    expect(provisionButtons.length).toBeGreaterThanOrEqual(1);
    const firstProvision = provisionButtons[0];
    if (firstProvision !== undefined) {
      fireEvent.click(firstProvision);
    }

    expect(screen.getByLabelText(/Deploy Energy [34] of 6/)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'End Turn' }));
    expect(screen.getByLabelText('TURN: 02')).toBeDefined();
  });
});
