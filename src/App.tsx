/**
 * Explicit constructor/factory Composition Root wiring outbound adapters into ArenaWorkbench.
 * The 3D diorama board is injected lazily, and only when the browser supports WebGL.
 */

import { type JSX, lazy, useMemo } from 'react';

import { ArenaWorkbench } from './modules/arena';
import { createStaticCatalogRepository } from './modules/catalog';
import { detectWebGLSupport, loadDioramaBoard } from './modules/diorama';
import { createBrowserProgressRepository } from './modules/progression';

const LazyDioramaBoard = lazy(async () => ({ default: await loadDioramaBoard() }));

export function App(): JSX.Element {
  const catalogRepository = useMemo(() => createStaticCatalogRepository(), []);
  const progressRepository = useMemo(() => createBrowserProgressRepository(), []);
  const boardRenderer3d = useMemo(() => (detectWebGLSupport() ? LazyDioramaBoard : undefined), []);

  return (
    <ArenaWorkbench
      catalogRepository={catalogRepository}
      progressRepository={progressRepository}
      boardRenderer3d={boardRenderer3d}
    />
  );
}
