import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { ArenaWorkbench, type BoardRendererProps } from '../../../src/modules/arena';
import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { InMemoryProgressRepository } from '../../../src/modules/progression';

/** Stand-in for the WebGL diorama: exposes the props the HUD hands to a 3D renderer. */
function FakeBoard3d(props: BoardRendererProps): JSX.Element {
  const firstSlot = props.blueprint.slots[0];
  return (
    <div data-testid="fake-3d" data-has-insets={String(props.viewInsets !== undefined)}>
      <button type="button" onClick={() => firstSlot !== undefined && props.onInspectSlot(firstSlot.id)}>
        Inspect first pad
      </button>
    </div>
  );
}

function renderImmersive() {
  return render(
    <ArenaWorkbench
      catalogRepository={createStaticCatalogRepository()}
      progressRepository={new InMemoryProgressRepository()}
      boardRenderer3d={FakeBoard3d}
    />,
  );
}

describe('Immersive 3D HUD', () => {
  afterEach(cleanup);

  it('puts the whole game over the 3D board: Rival, hand, energy and End Turn', () => {
    const { container } = renderImmersive();

    expect(container.querySelector('.workbench-shell.is-immersive')).not.toBeNull();
    expect(screen.getByTestId('fake-3d').dataset.hasInsets).toBe('true');
    expect(screen.getByRole('region', { name: 'Rack Gremlin tray' })).toBeDefined();
    expect(screen.getByRole('region', { name: 'Architect Card Hand' })).toBeDefined();
    expect(screen.getByLabelText(/^Energy \d of 6$/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'End Turn' })).toBeDefined();
  });

  it('keeps the specs and log in a drawer that opens when a pad is inspected', () => {
    renderImmersive();
    const tab = screen.getByRole('button', { name: /Specs & Log/ });
    expect(tab.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Inspect first pad' }));
    expect(tab.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(tab.getAttribute('aria-expanded')).toBe('false');
  });

  it('returns to the classic page layout in 2D', () => {
    const { container } = renderImmersive();

    fireEvent.click(screen.getByRole('button', { name: '2D' }));

    expect(container.querySelector('.is-immersive')).toBeNull();
    expect(screen.queryByRole('button', { name: /Specs & Log/ })).toBeNull();
    expect(screen.queryByLabelText(/^Energy \d of 6$/)).toBeNull();
  });
});
