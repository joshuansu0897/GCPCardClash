import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from '../../src/App';

describe('Full GCP Card Clash SPA integration flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('opens the Scenario Curriculum dialog, filters tracks, and switches to Agent Platform RAG', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Blueprints/ }));
    expect(screen.getByRole('heading', { name: 'GCP Reference Architecture Curriculum' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /TRK-04/ }));
    expect(screen.getByText(/ARC-401 · Grounded Enterprise RAG Knowledge Assistant/)).toBeDefined();

    const studyButtons = screen.getAllByRole('button', { name: 'Study Blueprint' });
    const firstStudy = studyButtons[0];
    if (firstStudy !== undefined) {
      fireEvent.click(firstStudy);
    }

    expect(screen.getByRole('heading', { name: /ARC-401/ })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Semantic Embedding Index' })).toBeDefined();
  });
});
