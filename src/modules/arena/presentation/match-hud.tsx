/**
 * In-match HUD pieces: the Rival's tray (hidden hand count, deck, energy), the active
 * incident ticker, the incident announcement card, and the turn-phase banner.
 */

import { type CSSProperties, type JSX, useEffect } from 'react';

import { type BossProfile, DISCARDS_PER_TURN, type IncidentCard, type MatchState } from '../../battle';
import { TechnicalIcon } from '../../../shared/gcp-icons';

const INCIDENT_AUTO_DISMISS_MS = 5200;

export interface RivalDockProps {
  readonly matchState: MatchState;
  readonly boss: BossProfile | null;
  readonly isActing: boolean;
}

export function RivalDock(props: RivalDockProps): JSX.Element | null {
  const { matchState, boss, isActing } = props;
  if (matchState.mode === 'study') {
    return null;
  }

  const handCount = matchState.rivalHand.length;
  const mid = (handCount - 1) / 2;
  const name = boss?.name ?? 'Rival Architect';

  return (
    <section
      className={`rival-dock ${boss !== null ? 'is-boss' : ''} ${isActing ? 'is-acting' : ''}`}
      aria-label={`${name} tray`}
    >
      <div className="rival-identity">
        <span className="rival-avatar" aria-hidden="true">
          <TechnicalIcon name={boss !== null ? 'crown' : 'compute'} size={20} />
        </span>
        <div className="rival-name-block">
          <span className="rival-name">{name}</span>
          <span className="rival-epithet">
            {isActing ? <span className="thinking-dots">Playing</span> : (boss?.epithet ?? 'Plays by your exact rules')}
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
          <dt>Cycles</dt>
          <dd>
            {matchState.rivalDiscardsRemaining}/{DISCARDS_PER_TURN}
          </dd>
        </div>
      </dl>
    </section>
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

  return (
    <div className="incident-overlay" role="alertdialog" aria-label={`Cloud Incident: ${incident.title}`}>
      <article className={`incident-card tone-${incident.tone}`}>
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
  readonly boss: BossProfile | null;
  readonly hidden: boolean;
}): JSX.Element | null {
  if (props.hidden) {
    return null;
  }
  const label = props.rivalActing ? `${props.boss !== null ? props.boss.name : 'Rival'}'s Turn` : `Turn ${props.turn} · Your Move`;

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
