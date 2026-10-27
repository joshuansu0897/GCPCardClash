/**
 * Public facade for the `diorama` bounded context (`ARCH-BOUNDARY`).
 *
 * Everything exported eagerly here is pure or Three.js-free. The R3F board itself is reached
 * only through `loadDioramaBoard()`, a dynamic import that keeps Three.js in its own chunk.
 */

export type { BoardEvent, BoardEventType } from './domain/board-events';
export { diffBoardEvents } from './domain/board-events';

export type {
  BuildingArchetype,
  IslandLayout,
  PadPlacement,
  RoadPlacement,
  TerracePlacement,
  Vec3,
} from './domain/board-layout';
export { computeIslandLayout, resolveBuildingArchetype } from './domain/board-layout';

export type { PadAffordance } from './domain/pad-affordance';
export { describeAffordance, resolvePadAffordance } from './domain/pad-affordance';

export { detectWebGLSupport } from './presentation/webgl-support';

export type { DioramaBoardProps } from './presentation/diorama-board';

export async function loadDioramaBoard(): Promise<typeof import('./presentation/diorama-board').DioramaBoard> {
  const module = await import('./presentation/diorama-board');
  return module.DioramaBoard;
}
