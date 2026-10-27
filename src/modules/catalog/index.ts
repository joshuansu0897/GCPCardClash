/**
 * Public facade for the `catalog` bounded context (`ARCH-BOUNDARY`).
 */

export type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  ContextNode,
  ContextNodeKind,
  DifficultyLevel,
  FlowEdge,
  GridCell,
  PerimeterZone,
  TrackId,
  TrackInfo,
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

export type { BlueprintDiagram, CellBounds, DiagramNode, DiagramNodeKind, DiagramZone } from './domain/diagram';
export { boundsOf, cellInBounds, resolveBlueprintDiagram } from './domain/diagram';
export type { DiagramLane, GridPoint, LaneDirection, LaneOptions } from './domain/diagram-routing';
export { routeDiagramLanes } from './domain/diagram-routing';

export type { CatalogRepository } from './application/ports/catalog-repository';
export type { CurriculumOverview } from './application/usecases/list-blueprints';
export { loadCurriculumOverview } from './application/usecases/list-blueprints';
export {
  StaticCatalogRepository,
  createStaticCatalogRepository,
} from './adapters/outbound/static-catalog-repository';
