/**
 * Explicit constructor/factory Composition Root wiring outbound adapters into ArenaWorkbench.
 */

import { type JSX, useMemo } from 'react';

import { ArenaWorkbench } from './modules/arena';
import { createStaticCatalogRepository } from './modules/catalog';
import { createBrowserProgressRepository } from './modules/progression';

export function App(): JSX.Element {
  const catalogRepository = useMemo(() => createStaticCatalogRepository(), []);
  const progressRepository = useMemo(() => createBrowserProgressRepository(), []);

  return (
    <ArenaWorkbench
      catalogRepository={catalogRepository}
      progressRepository={progressRepository}
    />
  );
}
