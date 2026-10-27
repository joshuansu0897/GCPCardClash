import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArenaWorkbench, type BoardRendererProps } from '../../../src/modules/arena';
import { createStaticCatalogRepository } from '../../../src/modules/catalog';
import { InMemoryProgressRepository } from '../../../src/modules/progression';

function FakeDiorama(props: BoardRendererProps): JSX.Element {
  return (
    <section aria-label="Fake 3D Board">
      <button type="button" onClick={() => props.onInspectSlot(props.blueprint.slots[0]?.id ?? '')}>
        {props.blueprint.code} in 3D
      </button>
    </section>
  );
}

function ExplodingDiorama(): JSX.Element {
  throw new Error('WebGL context lost');
}

describe('Arena board view switch', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides the 3D/2D toggle when no 3D renderer is injected', () => {
    render(
      <ArenaWorkbench
        catalogRepository={createStaticCatalogRepository()}
        progressRepository={new InMemoryProgressRepository()}
      />,
    );

    expect(screen.queryByRole('group', { name: 'Board View' })).toBeNull();
  });

  it('defaults to the injected 3D renderer and switches to the 2D drafting sheet', () => {
    render(
      <ArenaWorkbench
        catalogRepository={createStaticCatalogRepository()}
        progressRepository={new InMemoryProgressRepository()}
        boardRenderer3d={FakeDiorama}
      />,
    );

    expect(screen.getByRole('region', { name: 'Fake 3D Board' })).toBeDefined();
    expect(screen.getByRole('button', { name: '3D' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: '2D' }));

    expect(screen.queryByRole('region', { name: 'Fake 3D Board' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Architecture Blueprint Playboard' })).toBeDefined();
  });

  it('falls back to the 2D sheet when the 3D renderer crashes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ArenaWorkbench
        catalogRepository={createStaticCatalogRepository()}
        progressRepository={new InMemoryProgressRepository()}
        boardRenderer3d={ExplodingDiorama}
      />,
    );

    expect(screen.getByRole('region', { name: 'Architecture Blueprint Playboard' })).toBeDefined();
    expect(screen.getByRole('button', { name: '2D' }).getAttribute('aria-pressed')).toBe('true');
    consoleError.mockRestore();
  });
});
