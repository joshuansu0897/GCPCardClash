/**
 * Native modal `<dialog>` for browsing the 4 GCP certification tracks and 8 blueprints.
 */

import { type JSX, useRef, useState } from 'react';

import type { ArenaMode } from '../../battle';
import type { ArchitectureBlueprint, TrackId, TrackInfo } from '../../catalog';
import type { CampaignProgress } from '../../progression';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { useNativeModalDialog } from './use-modal-dialog';

export interface ScenarioDialogProps {
  readonly isOpen: boolean;
  readonly tracks: readonly TrackInfo[];
  readonly blueprints: readonly ArchitectureBlueprint[];
  readonly activeBlueprintId: string;
  readonly progress: CampaignProgress;
  readonly onSelectScenario: (blueprintId: string, mode: ArenaMode) => void;
  readonly onClose: () => void;
}

export function ScenarioCatalogDialog(props: ScenarioDialogProps): JSX.Element {
  const { isOpen, tracks, blueprints, activeBlueprintId, progress, onSelectScenario, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [trackFilter, setTrackFilter] = useState<TrackId | 'all'>('all');

  useNativeModalDialog({ dialogRef, isOpen, lightDismiss: true, onDismiss: () => onClose() });

  const visibleBlueprints = trackFilter === 'all'
    ? blueprints
    : blueprints.filter((bp) => bp.trackId === trackFilter);

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog scenario-dialog"
      aria-labelledby="scenario-dialog-title"
      closedby="any"
    >
      <div className="dialog-header-bar">
        <h2 id="scenario-dialog-title" className="dialog-title">
          GCP Reference Architecture Curriculum
        </h2>
        <form method="dialog">
          <button type="submit" value="close" className="icon-close-btn" aria-label="Close Curriculum">
            <TechnicalIcon name="close" size={18} />
          </button>
        </form>
      </div>

      <TrackFilterTabs tracks={tracks} active={trackFilter} onSelect={setTrackFilter} />

      <div className="scenario-cards-grid">
        {visibleBlueprints.map((bp) => (
          <ScenarioBlueprintTile
            key={bp.id}
            blueprint={bp}
            isCurrent={bp.id === activeBlueprintId}
            stars={progress.records[bp.id]?.bestStars ?? 0}
            bestScore={progress.records[bp.id]?.bestScore ?? 0}
            onLaunch={(mode) => onSelectScenario(bp.id, mode)}
          />
        ))}
      </div>
    </dialog>
  );
}

function TrackFilterTabs(props: {
  readonly tracks: readonly TrackInfo[];
  readonly active: TrackId | 'all';
  readonly onSelect: (id: TrackId | 'all') => void;
}): JSX.Element {
  return (
    <div className="track-filter-row" role="group" aria-label="Filter by Certification Track">
      <button
        type="button"
        className={props.active === 'all' ? 'track-tab is-active' : 'track-tab'}
        onClick={() => props.onSelect('all')}
      >
        All Tracks (8)
      </button>
      {props.tracks.map((track) => (
        <button
          key={track.id}
          type="button"
          className={props.active === track.id ? 'track-tab is-active' : 'track-tab'}
          onClick={() => props.onSelect(track.id)}
        >
          {track.code} · {track.title}
        </button>
      ))}
    </div>
  );
}

function ScenarioBlueprintTile(props: {
  readonly blueprint: ArchitectureBlueprint;
  readonly isCurrent: boolean;
  readonly stars: 0 | 1 | 2 | 3;
  readonly bestScore: number;
  readonly onLaunch: (mode: ArenaMode) => void;
}): JSX.Element {
  const { blueprint, isCurrent, stars, bestScore, onLaunch } = props;

  return (
    <article className={isCurrent ? 'scenario-tile is-current' : 'scenario-tile'}>
      <div className="scenario-tile-top">
        <h3 className="scenario-tile-title">
          {blueprint.code} · {blueprint.title}
        </h3>
        <StarRatingRow stars={stars} />
      </div>

      <p className="scenario-tile-brief">{blueprint.workloadBrief}</p>

      <div className="scenario-meta-strip">
        <span className="spec-tag">{blueprint.difficulty}</span>
        <span className="spec-tag">{blueprint.slots.length} Nodes</span>
        <span className="spec-tag">Best: {bestScore} PTS</span>
      </div>

      <div className="scenario-tile-actions">
        <button type="button" className="tile-primary-btn" onClick={() => onLaunch('battle')}>
          Start Battle
        </button>
        <button type="button" className="tile-secondary-btn" onClick={() => onLaunch('study')}>
          Study Blueprint
        </button>
      </div>
    </article>
  );
}

export function StarRatingRow(props: { readonly stars: 0 | 1 | 2 | 3 }): JSX.Element {
  const { stars } = props;

  return (
    <span className="star-row" aria-label={`${stars} of 3 Mastery Stars`}>
      {[1, 2, 3].map((idx) => (
        <TechnicalIcon
          key={idx}
          name={idx <= stars ? 'star-filled' : 'star-outline'}
          size={15}
          className={idx <= stars ? 'star-earned' : 'star-empty'}
        />
      ))}
    </span>
  );
}
