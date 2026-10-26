/**
 * Driven port interface for querying GCP cards, certification tracks, and blueprints.
 */

import type { ArchitectureBlueprint, TrackId, TrackInfo } from '../../domain/blueprint';
import type { CatalogCard } from '../../domain/card';

export interface CatalogRepository {
  listTracks(): readonly TrackInfo[];
  listCards(): readonly CatalogCard[];
  getCardById(cardId: string): CatalogCard | undefined;
  listBlueprints(trackId?: TrackId): readonly ArchitectureBlueprint[];
  getBlueprintById(blueprintId: string): ArchitectureBlueprint | undefined;
}
