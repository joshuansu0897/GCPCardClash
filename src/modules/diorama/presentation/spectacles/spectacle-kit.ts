/**
 * Shared vocabulary for the incident spectacles: palettes, target areas, the common props,
 * and deterministic scatter helpers so a replayed incident looks the same.
 */

import type { Mesh, MeshBasicMaterial } from 'three';

import type { IncidentManifestation, IncidentPalette } from '../../../battle';
import type { Vec3 } from '../../domain/board-layout';

export const SPECTACLE_DURATION_SEC = 3.6;

export const PALETTE_HEX: Readonly<Record<IncidentPalette, { readonly main: string; readonly accent: string }>> = {
  fire: { main: '#F97316', accent: '#FDE047' },
  ice: { main: '#BAE6FD', accent: '#F0F9FF' },
  gold: { main: '#FACC15', accent: '#FEF9C3' },
  toxic: { main: '#84CC16', accent: '#D9F99D' },
  neon: { main: '#22D3EE', accent: '#A5F3FC' },
  scan: { main: '#4ADE80', accent: '#BBF7D0' },
  shadow: { main: '#7C3AED', accent: '#C4B5FD' },
  glitch: { main: '#E879F9', accent: '#F5D0FE' },
};

export type Colors = (typeof PALETTE_HEX)[IncidentPalette];

export type SkyParticle = NonNullable<IncidentManifestation['particle']>;

/** A rectangular patch of island the incident lands on (a zone terrace or the whole island). */
export interface SpectacleArea {
  readonly center: Vec3;
  readonly size: readonly [width: number, depth: number];
}

export interface IncidentSpectacleProps {
  readonly manifestation: IncidentManifestation;
  readonly startsAt: number;
  readonly areas: readonly SpectacleArea[];
  /** Pads the incident actually hit; meteors and bolts aim at these first. */
  readonly struckPoints: readonly Vec3[];
  readonly islandWidth: number;
  readonly onDone: () => void;
}

export type SpectacleProps = IncidentSpectacleProps & { readonly colors: Colors };

/** Deterministic pseudo-random in [0, 1) so a replayed incident looks the same. */
export function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** The struck pads first, then scattered points across the areas, up to `count`. */
export function pickPoints(areas: readonly SpectacleArea[], struck: readonly Vec3[], count: number): Vec3[] {
  const points: Vec3[] = [...struck];
  for (let i = 0; points.length < count && areas.length > 0; i += 1) {
    const area = areas[i % areas.length] as SpectacleArea;
    points.push([
      area.center[0] + (hash01(i * 3 + 1) - 0.5) * area.size[0] * 0.85,
      area.center[1],
      area.center[2] + (hash01(i * 3 + 2) - 0.5) * area.size[1] * 0.85,
    ]);
  }
  return points.slice(0, count);
}

/** Shows, scales and fades a transient flash mesh once both refs are mounted. */
export function setFlash(
  mesh: Mesh | null,
  material: MeshBasicMaterial | null,
  visible: boolean,
  scale: number,
  opacity: number,
): void {
  if (mesh === null || material === null) {
    return;
  }
  mesh.visible = visible;
  mesh.scale.setScalar(scale);
  material.opacity = opacity;
}
