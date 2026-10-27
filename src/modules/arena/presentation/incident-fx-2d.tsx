/**
 * CSS-only incident effects over the 2D drafting sheet, so the fallback board also shows a
 * meteor shower, a scanner ship, falling credits, lightning, or a packet storm. Mounted per
 * strike (keyed by incident and turn); it plays once and then fades away.
 */

import type { CSSProperties, JSX } from 'react';

import { type IncidentManifestation, type MatchState, getIncidentCard } from '../../battle';

const BIT_COUNT: Readonly<Record<IncidentManifestation['kind'], number>> = {
  'meteor-shower': 12,
  flyover: 0,
  'sky-fall': 46,
  lightning: 5,
  'packet-stream': 36,
};

/** Deterministic spread in [0, 1) so each bit lands in the same place on every render. */
function spread(n: number): number {
  const x = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return x - Math.floor(x);
}

export function IncidentFx2d(props: { readonly matchState: MatchState }): JSX.Element | null {
  const { incident, turn, mode } = props.matchState;
  if (incident === null || incident.turn !== turn || mode === 'study') {
    return null;
  }
  const manifestation = getIncidentCard(incident.incidentId)?.manifestation;
  if (manifestation === undefined) {
    return null;
  }

  const classes = [
    'incident-fx-2d',
    `fx-${manifestation.kind}`,
    `fx-palette-${manifestation.palette}`,
    manifestation.particle !== undefined ? `fx-particle-${manifestation.particle}` : '',
  ].join(' ');

  return (
    <div key={`${incident.incidentId}:${incident.turn}`} className={classes} aria-hidden="true">
      {Array.from({ length: BIT_COUNT[manifestation.kind] }, (_, index) => (
        <span
          key={index}
          className="fx-bit"
          style={
            {
              '--fx-x': `${Math.round(spread(index) * 100)}%`,
              '--fx-y': `${Math.round(spread(index + 101) * 100)}%`,
              '--fx-delay': `${(spread(index + 211) * 1.8).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
      {manifestation.kind === 'flyover' && (
        <span className="fx-ship">
          <span className="fx-beam" />
        </span>
      )}
    </div>
  );
}
