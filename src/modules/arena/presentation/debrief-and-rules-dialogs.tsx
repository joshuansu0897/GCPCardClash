/**
 * Native modal `<dialog>` overlays for Post-Match Architectural Debrief and Field Manual.
 */

import { type JSX, useRef } from 'react';

import { type MatchOutcome, type MatchState, type RivalPersona, resolveRivalForTrack } from '../../battle';
import type { ArchitectureBlueprint } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { DocSourceLinks } from './doc-source-links';
import { StarRatingRow } from './scenario-dialog';
import type { PlayMode } from './use-arena-controller';
import { useNativeModalDialog } from './use-modal-dialog';

export interface DebriefDialogProps {
  readonly isOpen: boolean;
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly onReplay: (mode: PlayMode) => void;
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

function RivalVerdict(props: { readonly rival: RivalPersona; readonly outcome: MatchOutcome }): JSX.Element {
  const { rival, outcome } = props;
  const won = outcome.bossDefeated;
  return (
    <div className={`boss-verdict ${won ? 'is-victory' : 'is-defeat'}`}>
      <TechnicalIcon name="crown" size={22} />
      <div>
        <strong>{won ? `${rival.name} Defeated!` : `${rival.name} Prevails`}</strong>
        <p>"{won ? rival.defeatLine : rival.taunt}"</p>
      </div>
    </div>
  );
}

function DebriefMetricsBody(props: {
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly outcome: MatchOutcome;
  readonly onReplay: (mode: PlayMode) => void;
  readonly onOpenCatalog: () => void;
}): JSX.Element {
  const { blueprint, matchState, outcome, onReplay, onOpenCatalog } = props;
  const playMode = matchState.mode;
  const rival = resolveRivalForTrack(blueprint.trackId);

  return (
    <div className="debrief-content">
      {playMode !== 'study' && (
        <RivalVerdict rival={rival} outcome={outcome} />
      )}
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
        <h4 className="synthesis-sources-heading">Sources (official Google Cloud docs)</h4>
        <DocSourceLinks references={blueprint.references} />
      </div>

      <DebriefActionsRow rivalName={rival.name} onReplay={onReplay} onOpenCatalog={onOpenCatalog} />
    </div>
  );
}

function DebriefActionsRow(props: {
  readonly rivalName: string;
  readonly onReplay: (mode: PlayMode) => void;
  readonly onOpenCatalog: () => void;
}): JSX.Element {
  const { onReplay, onOpenCatalog } = props;

  return (
    <div className="debrief-actions-row">
      <button type="button" className="tile-primary-btn" onClick={() => onReplay('battle')}>
        Rematch {props.rivalName}
      </button>
      <button type="button" className="tile-secondary-btn" onClick={() => onReplay('study')}>
        Inspect in Study Mode
      </button>
      <button type="button" className="tile-secondary-btn" onClick={onOpenCatalog}>
        All Blueprints
      </button>
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

      <ManualRulesList />
    </dialog>
  );
}

function ManualRulesList(): JSX.Element {
  return (
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
      <li>
        <strong>5. A Fair Rival:</strong> The Rival draws from its own deck under your exact limits — a 6-card hand, +1E per turn up to 6E, free discards, a draw back to 6 at the start of its turn, and the same costs. You can see how many cards it holds, never which ones.
      </li>
      <li>
        <strong>6. Discard Freely:</strong> Discard as many cards as you like during your turn — it costs nothing. You do not draw right away: at the start of your next turn you draw back up to 6 cards (the discard pile is reshuffled when your deck runs out).
      </li>
      <li>
        <strong>7. Cloud Incidents:</strong> Every 3 turns (every 2 on Professional and Specialist blueprints) an incident strikes BOTH architects and plays out on the board — meteor showers knock out a zone, scanner ships sweep your nodes, credits rain down, lightning hits the AI tier. Some bend the rules for that turn only.
      </li>
      <li>
        <strong>8. Track Bosses:</strong> Each track has its own world and one boss — The Monolith guards Foundations, the Shadow Admin stalks Global & Hybrid, the Data Swamp floods Serverless & Data, and the Hallucinator warps Agent Platform & GenAI. Every boss follows your rules and mixes its signature incident into every second strike. On Associate blueprints it plays gently; on Professional and Specialist blueprints it chains moves and captures from Turn 2.
      </li>
    </ol>
  );
}
