/**
 * Per-track look for the diorama: sky, light, island materials, ambient particles, and the
 * form the track's enemy takes. Pure data — the scene reads it, nothing else does.
 */

import type { TrackId } from '../../catalog';

/** One creature family per track, drawn as that track's crowned boss. */
export type EnemyForm = 'rack' | 'wraith' | 'hydra' | 'oracle';

export interface TrackTheme {
  readonly trackId: TrackId;
  readonly name: string;
  readonly skyTop: string;
  readonly skyBottom: string;
  /** Text colour for overlay hints that sit directly on the sky. */
  readonly skyInk: string;
  readonly hemisphereSky: string;
  readonly hemisphereGround: string;
  readonly sunColor: string;
  readonly sunIntensity: number;
  readonly grass: string;
  readonly rock: string;
  readonly soil: string;
  readonly cloud: string;
  readonly cloudOpacity: number;
  readonly ambient: { readonly color: string; readonly count: number; readonly size: number; readonly speed: number };
  readonly enemyForm: EnemyForm;
  /** Primary and glow colours of the enemy model. */
  readonly enemyBody: string;
  readonly enemyGlow: string;
}

export const TRACK_THEMES: Readonly<Record<TrackId, TrackTheme>> = {
  foundations: {
    trackId: 'foundations',
    name: 'Legacy Datacenter at Dusk',
    skyTop: '#FFEDD5',
    skyBottom: '#FDBA74',
    skyInk: '#7C2D12',
    hemisphereSky: '#FFEDD5',
    hemisphereGround: '#FDBA74',
    sunColor: '#FFE4C4',
    sunIntensity: 1.7,
    grass: '#D9F99D',
    rock: '#78716C',
    soil: '#7C5A3A',
    cloud: '#FFF7ED',
    cloudOpacity: 0.92,
    ambient: { color: '#F97316', count: 40, size: 3, speed: 0.5 },
    enemyForm: 'rack',
    enemyBody: '#334155',
    enemyGlow: '#EF4444',
  },
  architect: {
    trackId: 'architect',
    name: 'Orbital Night',
    skyTop: '#0B1026',
    skyBottom: '#1E3A8A',
    skyInk: '#E0E7FF',
    hemisphereSky: '#BFDBFE',
    hemisphereGround: '#312E81',
    sunColor: '#C7D2FE',
    sunIntensity: 1.35,
    grass: '#BBF7D0',
    rock: '#475569',
    soil: '#334155',
    cloud: '#C7D2FE',
    cloudOpacity: 0.55,
    ambient: { color: '#E0E7FF', count: 120, size: 2, speed: 0.15 },
    enemyForm: 'wraith',
    enemyBody: '#1E1B4B',
    enemyGlow: '#818CF8',
  },
  'serverless-data': {
    trackId: 'serverless-data',
    name: 'Mistwater Delta',
    skyTop: '#ECFEFF',
    skyBottom: '#5EEAD4',
    skyInk: '#134E4A',
    hemisphereSky: '#ECFEFF',
    hemisphereGround: '#5EEAD4',
    sunColor: '#F0FDFA',
    sunIntensity: 1.55,
    grass: '#A7F3D0',
    rock: '#57534E',
    soil: '#44403C',
    cloud: '#E6FFFA',
    cloudOpacity: 0.85,
    ambient: { color: '#34D399', count: 60, size: 3.5, speed: 0.3 },
    enemyForm: 'hydra',
    enemyBody: '#3F6212',
    enemyGlow: '#A3E635',
  },
  'vertex-ai': {
    trackId: 'vertex-ai',
    name: 'Neon Synapse',
    skyTop: '#2E1065',
    skyBottom: '#BE185D',
    skyInk: '#FDF4FF',
    hemisphereSky: '#F5D0FE',
    hemisphereGround: '#4C1D95',
    sunColor: '#FAE8FF',
    sunIntensity: 1.45,
    grass: '#F5D0FE',
    rock: '#4C1D95',
    soil: '#3B0764',
    cloud: '#F0ABFC',
    cloudOpacity: 0.6,
    ambient: { color: '#E879F9', count: 80, size: 3, speed: 0.6 },
    enemyForm: 'oracle',
    enemyBody: '#F8FAFC',
    enemyGlow: '#E879F9',
  },
};

export function resolveTrackTheme(trackId: TrackId): TrackTheme {
  return TRACK_THEMES[trackId];
}
