/**
 * Native modal `<dialog>` overlays for Post-Match Architectural Debrief and Field Manual.
 */

import { type JSX, useRef } from 'react';

import type { ArenaMode, MatchOutcome, MatchState } from '../../battle';
import type { ArchitectureBlueprint } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { StarRatingRow } from './scenario-dialog';
import { useNativeModalDialog } from './use-modal-dialog';

export interface DebriefDialogProps {
  readonly isOpen: boolean;
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly onReplay: (mode: ArenaMode) => void;
  readonly onOpenCatalog: () => void;
  readonly onClose: () => void;
}

export function MatchDebriefDialog(props: DebriefDialogProps): JSX.Element {
  const { isOpen, blueprint, matchState, onReplay, onOpenCatalog, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useNativeModalDialog({ dialogRef, isOpen, lightDismiss: false, onDismiss: () => onClose() });

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog debrief-dialog"
      aria-labelledby="debrief-dialog-title"
    >
      <div className="dialog-header-bar">
        <h2 id="debrief-dialog-title" className="dialog-title">
          Architecture Review — {blueprint.code} {blueprint.title}
        </h2>
        <form method="dialog">
          <button type="submit" value="close" className="icon-close-btn" aria-label="Close Debrief">
            <TechnicalIcon name="close" size={18} />
          </button>
        </form>
      </div>

      {matchState.outcome !== null && (
        <DebriefMetricsBody
          blueprint={blueprint}
          matchState={matchState}
          outcome={matchState.outcome}
          onReplay={onReplay}
          onOpenCatalog={onOpenCatalog}
        />
      )}
    </dialog>
  );
}

function DebriefMetricsBody(props: {
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly outcome: MatchOutcome;
  readonly onReplay: (mode: ArenaMode) => void;
  readonly onOpenCatalog: () => void;
}): JSX.Element {
  const { blueprint, matchState, outcome, onReplay, onOpenCatalog } = props;

  return (
    <div className="debrief-content">
      <div className="debrief-verdict-row">
        <StarRatingRow stars={outcome.stars} />
        <p className="debrief-summary-text">{outcome.summary}</p>
      </div>

      <div className="debrief-metrics-grid">
        <MetricCell label="Your Score" value={`${matchState.playerScore} PTS`} />
        <MetricCell label="Rival Score" value={`${matchState.rivalScore} PTS`} />
        <MetricCell label="Mistakes" value={String(matchState.playerMistakes)} />
        <MetricCell label="Shielded Nodes" value={String(outcome.shieldedPlayerNodes)} />
      </div>

      <div className="solution-synthesis-box">
        <h3 className="synthesis-heading">Reference Solution Synthesis</h3>
        <p className="synthesis-copy">{blueprint.solutionSummary}</p>
      </div>

      <div className="debrief-actions-row">
        <button type="button" className="tile-primary-btn" onClick={() => onReplay('battle')}>
          Replay Battle
        </button>
        <button type="button" className="tile-secondary-btn" onClick={() => onReplay('study')}>
          Inspect in Study Mode
        </button>
        <button type="button" className="tile-secondary-btn" onClick={onOpenCatalog}>
          All Blueprints
        </button>
      </div>
    </div>
  );
}

function MetricCell(props: { readonly label: string; readonly value: string }): JSX.Element {
  return (
    <div className="debrief-metric-cell">
      <span className="mono-stamp">{props.label}</span>
      <strong className="metric-value">{props.value}</strong>
    </div>
  );
}

export interface RulesDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function RulesReferenceDialog(props: RulesDialogProps): JSX.Element {
  const { isOpen, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useNativeModalDialog({ dialogRef, isOpen, lightDismiss: true, onDismiss: () => onClose() });

  return (
    <dialog
      ref={dialogRef}
      className="sheet-dialog rules-dialog"
      aria-labelledby="rules-dialog-title"
      closedby="any"
    >
      <div className="dialog-header-bar">
        <h2 id="rules-dialog-title" className="dialog-title">
          GCP Card Clash — Systems Field Manual
        </h2>
        <form method="dialog">
          <button type="submit" value="close" className="icon-close-btn" aria-label="Close Manual">
            <TechnicalIcon name="close" size={18} />
          </button>
        </form>
      </div>

      <ol className="manual-rules-list">
        <li>
          <strong>1. Provision Deploy Energy:</strong> Play Provisioning cards (Cloud Console, gcloud CLI, Terraform, Cloud Build) at 0 cost to boost Deploy Energy up to 6E.
        </li>
        <li>
          <strong>2. Deploy Matching GCP Services (+40 Flow Synergy):</strong> Select a Service card and click the Architecture Slot whose SLA, access pattern, and consistency clue match. Each connected upstream/downstream node you already own grants <strong>+40 Flow Synergy Points</strong>.
        </li>
        <li>
          <strong>3. Learn from Anti-Patterns (-1E Diagnostic):</strong> Deploying an unsuitable GCP service (e.g., Cloud SQL for global active-active writes instead of Cloud Spanner) costs 1 Energy and logs an exam-grade explanation.
        </li>
        <li>
          <strong>4. Defense-in-Depth Shields & Slot Capture:</strong> Unshielded nodes can be compromised by the opponent for <code>Cost + 1E</code>. Attach Cloud IAM, Cloud Armor, VPC-SC, KMS, or IAP shields (1E) for +35/+60 points and permanent takeover immunity.
        </li>
      </ol>
    </dialog>
  );
}
