import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArenaWorkbench } from '../../../src/modules/arena';
import { TopologyEdgesSvg } from '../../../src/modules/arena/presentation/topology-edges-svg';
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

  it('tracks 3D tilt and holographic foil coordinates on double-bezel hand cards', () => {
    const { container } = render(
      <ArenaWorkbench
        catalogRepository={createStaticCatalogRepository()}
        progressRepository={new InMemoryProgressRepository()}
      />,
    );
    const bezel = container.querySelector<HTMLElement>('.deck-card-bezel');
    expect(bezel?.querySelector('.deck-card-foil')).not.toBeNull();
    if (bezel === null) return;

    bezel.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 160 } as DOMRect);
    fireEvent(bezel, new MouseEvent('pointermove', { bubbles: true, clientX: 150, clientY: 40 }));
    expect(bezel.style.getPropertyValue('--pointer-x')).toBe('75%');
    expect(bezel.style.getPropertyValue('--tilt-y')).toBe('2.50deg');

    fireEvent(bezel, new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
    expect(bezel.style.getPropertyValue('--tilt-x')).toBe('0deg');
    expect(bezel.style.getPropertyValue('--tilt-y')).toBe('0deg');
  });

  it('renders animated packet pulse streams on active player synergy buses', () => {
    const blueprint = createStaticCatalogRepository().listBlueprints()[0];
    const edge = blueprint?.edges[0];
    if (blueprint === undefined || edge === undefined) return;

    const deployed = {
      [edge.fromSlotId]: { slotId: edge.fromSlotId, owner: 'player' as const, serviceCardId: 'cloud-cdn', shieldCardId: null, shieldMatchedRecommendation: false },
      [edge.toSlotId]: { slotId: edge.toSlotId, owner: 'player' as const, serviceCardId: 'cloud-storage', shieldCardId: null, shieldMatchedRecommendation: false },
    };
    const { container } = render(<TopologyEdgesSvg blueprint={blueprint} deployedSlots={deployed} maxRow={2} />);
    expect(container.querySelector('.flow-pulse-stream')).not.toBeNull();
  });
});
