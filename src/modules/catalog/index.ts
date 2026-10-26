/**
 * Public facade for the `catalog` bounded context (`ARCH-BOUNDARY`).
 */

export type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  DifficultyLevel,
  FlowEdge,
  PerimeterZone,
  SlotRow,
  TrackId,
  TrackInfo,
  ZoneColumn,
} from './domain/blueprint';

export type {
  BaseCard,
  CardKind,
  CatalogCard,
  EnergyCard,
  GcpCategory,
  ServiceCard,
  ShieldCapability,
  ShieldCard,
  SubsystemInk,
} from './domain/card';

export type { CatalogRepository } from './application/ports/catalog-repository';
export type { CurriculumOverview } from './application/usecases/list-blueprints';
export { loadCurriculumOverview } from './application/usecases/list-blueprints';
export {
  StaticCatalogRepository,
  createStaticCatalogRepository,
} from './adapters/outbound/static-catalog-repository';
