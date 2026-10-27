/**
 * In-match HUD pieces: the Rival's tray (hidden hand count, deck, energy), the active
 * incident ticker, the incident toast, and the turn-phase banner.
 */

import { type CSSProperties, type JSX, useEffect } from 'react';

import { type BossProfile, HAND_LIMIT, type IncidentCard, type MatchState, type RivalPersona } from '../../battle';
import type { TrackId } from '../../catalog';
import { TechnicalIcon, type TechnicalIconName } from '../../../shared/gcp-icons';

/** Long enough to read after the incident has played out on the board. */
const INCIDENT_AUTO_DISMISS_MS = 8000;

const TRACK_ENEMY_ICON: Readonly<Record<TrackId, TechnicalIconName>> = {
  foundations: 'compute',
  architect: 'edge',
  'serverless-data': 'data',
  'vertex-ai': 'ai',
};

export interface RivalDockProps {
  readonly matchState: MatchState;
  readonly rival: RivalPersona;
  readonly isActing: boolean;
}

export function RivalDock(props: RivalDockProps): JSX.Element | null {
  const { matchState, rival, isActing } = props;
  if (matchState.mode === 'study') {
    return null;
  }

  const isBoss = rival.profile === 'boss';
  const handCount = matchState.rivalHand.length;
  const mid = (handCount - 1) / 2;

  return (
    <section
      className={`rival-dock rival-track-${rival.trackId} ${isBoss ? 'is-boss' : ''} ${isActing ? 'is-acting' : ''}`}
      aria-label={`${rival.name} tray`}
    >
      <div className="rival-identity">
        <span className="rival-avatar" aria-hidden="true">
          <TechnicalIcon name={isBoss ? 'crown' : TRACK_ENEMY_ICON[rival.trackId]} size={20} />
        </span>
        <div className="rival-name-block">
          <span className="rival-name">{rival.name}</span>
          <span className="rival-epithet">
            {isActing ? <span className="thinking-dots">Playing</span> : rival.epithet}
          </span>
        </div>
      </div>

      <div className="rival-hand" aria-label={`Rival hand: ${handCount} cards`} role="img">
        {matchState.rivalHand.map((item, index) => (
          <span
            key={item.instanceId}
            className="card-back"
            style={{ '--fan-offset': index - mid } as CSSProperties}
          />
        ))}
        <span className="rival-hand-count" aria-hidden="true">
          {handCount}
        </span>
      </div>

      <RivalStats matchState={matchState} handCount={handCount} />
    </section>
  );
}

function RivalStats(props: { readonly matchState: MatchState; readonly handCount: number }): JSX.Element {
  const { matchState, handCount } = props;

  return (
    <dl className="rival-stats">
      <div>
        <dt>Energy</dt>
        <dd aria-label={`Rival Energy ${matchState.rivalEnergy} of ${matchState.maxEnergy}`}>
          <span className="mini-pips" aria-hidden="true">
            {Array.from({ length: matchState.maxEnergy }, (_, i) => (
              <span key={i} className={i < matchState.rivalEnergy ? 'pip is-on' : 'pip'} />
            ))}
          </span>
        </dd>
      </div>
      <div>
        <dt>Deck</dt>
        <dd>{matchState.rivalDrawPile.length}</dd>
      </div>
      <div>
        <dt>Discard</dt>
        <dd>{matchState.rivalDiscardPile.length}</dd>
      </div>
      <div>
        <dt>Draws</dt>
        <dd aria-label={`Rival draws ${HAND_LIMIT - handCount} at the start of its turn`}>
          +{HAND_LIMIT - handCount}
        </dd>
      </div>
    </dl>
  );
}

export function IncidentTicker(props: {
  readonly incident: IncidentCard | null;
  readonly zoneLabel: string | null;
  readonly turnsUntilNext: number | null;
}): JSX.Element | null {
  const { incident, zoneLabel, turnsUntilNext } = props;

  if (incident === null) {
    return turnsUntilNext === null ? null : (
      <p className="incident-ticker is-idle">
        <TechnicalIcon name="alert" size={14} />
        <span>
          Next Cloud Incident in <strong>{turnsUntilNext}</strong> turn{turnsUntilNext === 1 ? '' : 's'}
        </span>
      </p>
    );
  }

  return (
    <p className={`incident-ticker tone-${incident.tone}`} role="status">
      <TechnicalIcon name="alert" size={14} />
      <span>
        <strong>INCIDENT · {incident.title}</strong> — {incident.rule}
        {zoneLabel !== null ? ` (${zoneLabel})` : ''}
      </span>
    </p>
  );
}

export function IncidentAnnouncement(props: {
  readonly incident: IncidentCard | null;
  readonly boss: BossProfile | null;
  readonly onDismiss: () => void;
}): JSX.Element | null {
  const { incident, boss, onDismiss } = props;

  useEffect(() => {
    if (incident === null) {
      return undefined;
    }
    const id = window.setTimeout(onDismiss, INCIDENT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [incident, onDismiss]);

  if (incident === null) {
    return null;
  }

  const isSignature = boss !== null && boss.signatureIncidentId === incident.id;

  // A toast, not a modal: the incident itself is playing out on the board right now
  return (
    <div className="incident-toast-host">
      <article
        className={`incident-card is-toast tone-${incident.tone}`}
        role="alert"
        aria-label={`Cloud Incident: ${incident.title}`}
      >
        <span className="incident-kicker">
          <TechnicalIcon name={isSignature ? 'crown' : 'alert'} size={16} />
          {isSignature ? `${boss.name} — Signature Incident` : 'Cloud Incident'}
        </span>
        <h2 className="incident-title">{incident.title}</h2>
        <p className="incident-flavor">{isSignature ? `"${boss.taunt}"` : incident.flavor}</p>
        <p className="incident-rule">{incident.rule}</p>
        <p className="incident-lesson">
          <TechnicalIcon name="book" size={13} /> {incident.lesson}
        </p>
        <button type="button" className="incident-dismiss" onClick={onDismiss}>
          Got it
        </button>
      </article>
    </div>
  );
}

export function TurnPhaseBanner(props: {
  readonly turn: number;
  readonly rivalActing: boolean;
  readonly rival: RivalPersona;
  readonly hidden: boolean;
}): JSX.Element | null {
  if (props.hidden) {
    return null;
  }
  const label = props.rivalActing ? `${props.rival.name}'s Turn` : `Turn ${props.turn} · Your Move`;

  return (
    <div
      key={`${props.turn}-${props.rivalActing ? 'rival' : 'player'}`}
      className={`turn-phase-banner ${props.rivalActing ? 'is-rival' : 'is-player'}`}
      aria-live="polite"
    >
      <span>{label}</span>
    </div>
  );
}
