/**
 * Carbon-ink Flight-Plan Header Bar with fixed-cell split-flap scoreboard and energy gauge.
 */

import type { JSX } from 'react';

import type { ArchitectRank } from '../../progression';
import type { BoardView } from './board-view-switch';
import type { PlayMode } from './use-arena-controller';
import { TechnicalIcon } from '../../../shared/gcp-icons';

export interface FlightHeaderProps {
  readonly mode: PlayMode;
  readonly bossUnlocked: boolean;
  readonly turn: number;
  readonly playerScore: number;
  readonly rivalScore: number;
  readonly playerEnergy: number;
  readonly maxEnergy: number;
  readonly totalStars: number;
  readonly maxCampaignStars: number;
  readonly rank: ArchitectRank;
  /** Current playboard renderer, or `null` when only the 2D sheet is available. */
  readonly boardView: BoardView | null;
  readonly onChangeBoardView: (view: BoardView) => void;
  readonly onOpenScenarios: () => void;
  readonly onOpenRules: () => void;
  readonly onToggleMode: (nextMode: PlayMode) => void;
  readonly onRestartMatch: () => void;
}

export function FlightHeader(props: FlightHeaderProps): JSX.Element {
  return (
    <header className="flight-header">
      <div className="flight-brand-cluster">
        <div className="brand-emblem" aria-hidden="true">
          <TechnicalIcon name="blueprint" size={20} />
        </div>
        <div className="brand-title-row">
          <h1 className="brand-title">GCP Card Clash</h1>
          <span className="rank-stamp">{props.rank}</span>
        </div>
      </div>

      <div className="flight-telemetry-strip" aria-label="Match Scoreboard and Turn Telemetry">
        <SplitFlapReadout label="YOU" value={String(props.playerScore).padStart(4, '0')} tone="player" />
        <SplitFlapReadout
          label="RIVAL"
          value={props.mode === 'study' ? 'STDY' : String(props.rivalScore).padStart(4, '0')}
          tone="rival"
        />
        <SplitFlapReadout label="TURN" value={String(props.turn).padStart(2, '0')} tone="neutral" />
        <EnergyCapacitorGauge current={props.playerEnergy} max={props.maxEnergy} />
      </div>

      <FlightControlNav
        mode={props.mode}
        bossUnlocked={props.bossUnlocked}
        boardView={props.boardView}
        onChangeBoardView={props.onChangeBoardView}
        totalStars={props.totalStars}
        maxCampaignStars={props.maxCampaignStars}
        onToggleMode={props.onToggleMode}
        onOpenScenarios={props.onOpenScenarios}
        onRestartMatch={props.onRestartMatch}
        onOpenRules={props.onOpenRules}
      />
    </header>
  );
}

function FlightControlNav(props: {
  readonly mode: PlayMode;
  readonly bossUnlocked: boolean;
  readonly boardView: BoardView | null;
  readonly onChangeBoardView: (view: BoardView) => void;
  readonly totalStars: number;
  readonly maxCampaignStars: number;
  readonly onToggleMode: (nextMode: PlayMode) => void;
  readonly onOpenScenarios: () => void;
  readonly onRestartMatch: () => void;
  readonly onOpenRules: () => void;
}): JSX.Element {
  const { totalStars, maxCampaignStars } = props;

  return (
    <nav className="flight-controls" aria-label="Workbench Controls">
      <ArenaModeSwitch mode={props.mode} bossUnlocked={props.bossUnlocked} onToggleMode={props.onToggleMode} />
      {props.boardView !== null && (
        <BoardViewToggle boardView={props.boardView} onChangeBoardView={props.onChangeBoardView} />
      )}

      <button type="button" className="rail-btn" onClick={props.onOpenScenarios}>
        <TechnicalIcon name="star-filled" size={15} />
        <span>Blueprints ({totalStars}/{maxCampaignStars})</span>
      </button>
      <button type="button" className="rail-btn" onClick={props.onRestartMatch} title="Restart Scenario">
        <TechnicalIcon name="refresh" size={15} />
        <span>Reset</span>
      </button>
      <button type="button" className="rail-btn" onClick={props.onOpenRules}>
        <TechnicalIcon name="book" size={15} />
        <span>Manual</span>
      </button>
    </nav>
  );
}

function ArenaModeSwitch(props: {
  readonly mode: PlayMode;
  readonly bossUnlocked: boolean;
  readonly onToggleMode: (nextMode: PlayMode) => void;
}): JSX.Element {
  const { mode } = props;

  return (
    <div className="mode-switch" role="group" aria-label="Arena Mode">
      <button
        type="button"
        className={mode === 'battle' ? 'mode-btn is-active' : 'mode-btn'}
        aria-pressed={mode === 'battle'}
        onClick={() => props.onToggleMode('battle')}
      >
        Battle
      </button>
      <button
        type="button"
        className={mode === 'boss' ? 'mode-btn is-active is-boss' : 'mode-btn is-boss'}
        aria-pressed={mode === 'boss'}
        disabled={!props.bossUnlocked && mode !== 'boss'}
        title={props.bossUnlocked ? 'Challenge this track’s boss' : 'Finish this blueprint once to unlock its boss'}
        onClick={() => props.onToggleMode('boss')}
      >
        <TechnicalIcon name={props.bossUnlocked || mode === 'boss' ? 'crown' : 'lock'} size={13} />
        Boss
      </button>
      <button
        type="button"
        className={mode === 'study' ? 'mode-btn is-active' : 'mode-btn'}
        aria-pressed={mode === 'study'}
        onClick={() => props.onToggleMode('study')}
      >
        Study
      </button>
    </div>
  );
}

function BoardViewToggle(props: {
  readonly boardView: BoardView;
  readonly onChangeBoardView: (view: BoardView) => void;
}): JSX.Element {
  return (
    <div className="mode-switch" role="group" aria-label="Board View">
      {(['3d', '2d'] as const).map((view) => (
        <button
          key={view}
          type="button"
          className={props.boardView === view ? 'mode-btn is-active' : 'mode-btn'}
          aria-pressed={props.boardView === view}
          onClick={() => props.onChangeBoardView(view)}
        >
          {view.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SplitFlapReadout(props: {
  readonly label: string;
  readonly value: string;
  readonly tone: 'player' | 'rival' | 'neutral';
}): JSX.Element {
  const { label, value, tone } = props;

  return (
    <div className={`flap-group flap-tone-${tone}`}>
      <span className="flap-label">{label}</span>
      <span className="flap-cells" aria-label={`${label}: ${value}`}>
        {Array.from(value).map((char, idx) => (
          <span key={`${label}-${idx}`} className="flap-digit">
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}

function EnergyCapacitorGauge(props: { readonly current: number; readonly max: number }): JSX.Element {
  const { current, max } = props;
  const cells = Array.from({ length: max }, (_, idx) => idx < current);

  return (
    <div className="energy-gauge" aria-label={`Deploy Energy ${current} of ${max}`}>
      <span className="flap-label">
        <TechnicalIcon name="bolt" size={13} />
        <span>ENERGY {current}/{max}</span>
      </span>
      <div className="capacitor-bars" aria-hidden="true">
        {cells.map((charged, idx) => (
          <span
            key={`cap-${idx}`}
            className={charged ? 'capacitor-cell is-charged' : 'capacitor-cell'}
          />
        ))}
      </div>
    </div>
  );
}
