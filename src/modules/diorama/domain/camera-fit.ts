/**
 * Pure camera framing for the diorama. Projects the points that must stay visible (the island's
 * corners, the enemy) through a pinhole camera looking at `focus` from `direction`, finds the
 * closest distance at which their on-screen footprint fits the part of the screen the HUD leaves
 * free, and returns the view shift that centres the island in the free area (the enemy gets room
 * beside it without pushing the island off-centre).
 */

import type { IslandLayout, Vec3 } from './board-layout';

/** Lowest point of the island slab, and the height the tallest buildings reach above a terrace. */
const ISLAND_UNDERSIDE_Y = -0.7;
const SKYLINE_HEIGHT = 1.9;
/** Half-extents of the enemy model at scale 1, from its anchor. */
const ENEMY_HALF_WIDTH = 1.1;
const ENEMY_HALF_HEIGHT = 1.5;

/** Breathing room (CSS px) kept around the framed footprint. */
const FRAME_PADDING_PX = 16;
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 400;
const SEARCH_STEPS = 40;

/** Screen space (CSS px) covered by HUD panels on each edge of the board. */
export interface ViewInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface CameraFit {
  readonly distance: number;
  /** `setViewOffset` shift (px) that moves the framed footprint onto the free area's centre. */
  readonly offset: readonly [x: number, y: number];
}

/** What the camera must keep in view, what it centres on, and the point it orbits around. */
export interface CameraFrame {
  readonly focus: Vec3;
  readonly points: readonly Vec3[];
  readonly centrePoints: readonly Vec3[];
}

/** The enemy hovering beside the island: where, and how much larger than standard it is drawn. */
export interface EnemyPresence {
  readonly anchor: Vec3;
  readonly scale: number;
}

/** The island's bounding box (slab to skyline) plus the enemy's, orbiting around the island's centre. */
export function computeBoardFrame(layout: IslandLayout, enemy: EnemyPresence | null): CameraFrame {
  const [width, depth] = layout.islandSize;
  const topY = Math.max(0, ...layout.terraces.map((t) => t.center[1])) + SKYLINE_HEIGHT;
  const points: Vec3[] = [];
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      points.push([x, ISLAND_UNDERSIDE_Y, z], [x, topY, z]);
    }
  }

  if (enemy === null) {
    return { focus: [0, 0, 0], points, centrePoints: points };
  }
  const [ax, ay, az] = enemy.anchor;
  const hw = ENEMY_HALF_WIDTH * enemy.scale;
  const hh = ENEMY_HALF_HEIGHT * enemy.scale;
  const enemyPoints: Vec3[] = [[ax - hw, ay - hh, az], [ax - hw, ay + hh, az], [ax + hw, ay + hh, az]];
  return { focus: [0, 0, 0], points: [...points, ...enemyPoints], centrePoints: points };
}

export interface CameraFitRequest {
  readonly points: readonly Vec3[];
  /** Points whose footprint is centred in the free area; defaults to `points`. */
  readonly centrePoints?: readonly Vec3[];
  readonly focus: Vec3;
  /** Unit vector from the focus toward the camera. */
  readonly direction: Vec3;
  readonly fovDeg: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly insets: ViewInsets | undefined;
}

interface Footprint {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export function computeCameraFit(request: CameraFitRequest): CameraFit {
  const { width: vw, height: vh } = request.viewport;
  const insets = request.insets ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const freeW = Math.max(1, vw - insets.left - insets.right - FRAME_PADDING_PX * 2);
  const freeH = Math.max(1, vh - insets.top - insets.bottom - FRAME_PADDING_PX * 2);

  // Binary-search the closest distance at which everything fits once the centre box is centred
  let near = MIN_DISTANCE;
  let far = MAX_DISTANCE;
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const mid = (near + far) / 2;
    const span = centredSpan(request, mid);
    if (span !== null && span.width <= freeW && span.height <= freeH) {
      far = mid;
    } else {
      near = mid;
    }
  }

  // Shift the view so the centre box lands on the free area's centre
  const box = projectFootprint(request.centrePoints ?? request.points, request, far) ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  const boxCenterX = vw / 2 + (box.minX + box.maxX) / 2;
  const boxCenterY = vh / 2 + (box.minY + box.maxY) / 2;
  const freeCenterX = insets.left + (vw - insets.left - insets.right) / 2;
  const freeCenterY = insets.top + (vh - insets.top - insets.bottom) / 2;
  return { distance: far, offset: [boxCenterX - freeCenterX, boxCenterY - freeCenterY] };
}

/** Size the free area must have to hold every point while the centre box sits in its middle. */
function centredSpan(request: CameraFitRequest, distance: number): { width: number; height: number } | null {
  const all = projectFootprint(request.points, request, distance);
  const centre = projectFootprint(request.centrePoints ?? request.points, request, distance);
  if (all === null || centre === null) {
    return null;
  }
  const cx = (centre.minX + centre.maxX) / 2;
  const cy = (centre.minY + centre.maxY) / 2;
  return {
    width: 2 * Math.max(cx - all.minX, all.maxX - cx),
    height: 2 * Math.max(cy - all.minY, all.maxY - cy),
  };
}

/** Screen-space bounds (px from the viewport centre, y down); `null` if a point is behind the camera. */
function projectFootprint(points: readonly Vec3[], request: CameraFitRequest, distance: number): Footprint | null {
  const [dx, dy, dz] = request.direction;
  const [fx, fy, fz] = request.focus;
  const eye: Vec3 = [fx + dx * distance, fy + dy * distance, fz + dz * distance];
  const basis = cameraBasis(request.direction);
  const pxPerUnit = request.viewport.height / 2 / Math.tan((request.fovDeg * Math.PI) / 360);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    const rel: Vec3 = [point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]];
    const depth = dot(rel, basis.forward);
    if (depth <= 0.01) {
      return null;
    }
    const x = (dot(rel, basis.right) / depth) * pxPerUnit;
    const y = -(dot(rel, basis.up) / depth) * pxPerUnit;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

function cameraBasis(direction: Vec3): { readonly forward: Vec3; readonly right: Vec3; readonly up: Vec3 } {
  const forward: Vec3 = [-direction[0], -direction[1], -direction[2]];
  const right = normalize(cross(forward, [0, 1, 0]));
  return { forward, right, up: cross(right, forward) };
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
