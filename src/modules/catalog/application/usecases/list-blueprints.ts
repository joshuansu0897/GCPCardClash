/**
 * Application use cases for browsing the GCP curriculum and resolving scenario catalogs.
 */

import type { ArchitectureBlueprint, TrackId, TrackInfo } from '../../domain/blueprint';
import type { CatalogCard } from '../../domain/card';
import type { CatalogRepository } from '../ports/catalog-repository';

export interface CurriculumOverview {
  readonly tracks: readonly TrackInfo[];
  readonly blueprints: readonly ArchitectureBlueprint[];
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
}

export function loadCurriculumOverview(
  repository: CatalogRepository,
  trackFilter?: TrackId,
): CurriculumOverview {
  // Query catalog port
  const tracks = repository.listTracks();
  const blueprints = repository.listBlueprints(trackFilter);
  const allCards = repository.listCards();

  // Index cards by identifier
  const cardsById: Record<string, CatalogCard> = {};
  for (const card of allCards) {
    cardsById[card.id] = card;
  }

  return { tracks, blueprints, cardsById };
}
