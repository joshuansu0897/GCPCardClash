/**
 * Right-side Technical Specification Inspector and Anti-Pattern Turn Diagnostic Feed.
 */

import type { JSX } from 'react';

import type { ArenaMode, SlotDeployment, TurnLogEntry } from '../../battle';
import type { ArchitectureSlot, CatalogCard } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { DocSourceLinks } from './doc-source-links';

export interface SpecInspectorPanelProps {
  readonly mode: ArenaMode;
  readonly inspectedCard: CatalogCard | undefined;
  readonly inspectedSlot: ArchitectureSlot | undefined;
  readonly inspectedSlotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly logs: readonly TurnLogEntry[];
}

export function SpecInspectorPanel(props: SpecInspectorPanelProps): JSX.Element {
  const { mode, inspectedCard, inspectedSlot, inspectedSlotState, cardsById, logs } = props;

  return (
    <aside className="spec-inspector" aria-label="Technical Specification and Diagnostic Log">
      <div className="inspector-section">
        <div className="panel-bar">
          <h2 className="panel-heading">Specification Dossier</h2>
          <span className="mono-stamp">GCP-REF</span>
        </div>

        {inspectedCard !== undefined ? (
          <CardSpecSheet card={inspectedCard} />
        ) : inspectedSlot !== undefined ? (
          <SlotSpecSheet
            mode={mode}
            slot={inspectedSlot}
            slotState={inspectedSlotState}
            cardsById={cardsById}
          />
        ) : (
          <p className="empty-spec-note">
            Select any card in your hand or click a topology slot to inspect its GCP SLA, fit criteria, and certification exam trade-offs.
          </p>
        )}
      </div>

      <TelemetryFeedSection logs={logs} />
    </aside>
  );
}

function TelemetryFeedSection(props: { readonly logs: readonly TurnLogEntry[] }): JSX.Element {
  const { logs } = props;

  return (
    <div className="inspector-log-section">
      <div className="panel-bar">
        <h2 className="panel-heading">Architecture Telemetry Log</h2>
        <span className="mono-stamp">{logs.length} EVENTS</span>
      </div>

      <ul className="telemetry-log-list" aria-live="polite">
        {logs.slice(0, 12).map((entry) => (
          <li key={entry.id} className={`log-item log-sev-${entry.severity}`}>
            <div className="log-item-top">
              <span className="log-turn-tag">T{entry.turn} · {entry.severity.toUpperCase()}</span>
              {entry.pointsDelta > 0 && (
                <span className="log-points-tag">+{entry.pointsDelta} PTS</span>
              )}
            </div>
            <strong className="log-headline">{entry.headline}</strong>
            <p className="log-detail">{entry.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardSpecSheet(props: { readonly card: CatalogCard }): JSX.Element {
  const { card } = props;

  return (
    <div className="spec-card-body">
      <div className="spec-title-line">
        <span className={`service-code-chip ink-chip-${card.ink}`}>{card.shortCode}</span>
        <h3 className="spec-subject-title">{card.title}</h3>
      </div>

      <p className="spec-summary">{card.summary}</p>

      <dl className="spec-definition-list">
        <div>
          <dt>Category & Cost</dt>
          <dd>
            {card.category} · {card.kind === 'energy' ? `Grants +${card.energyGrant}E` : `Costs ${card.energyCost}E`}
            {card.kind === 'service' ? ` · ${card.slaTier}` : ''}
          </dd>
        </div>
        <div>
          <dt>When to Choose</dt>
          <dd>{card.whenToUse}</dd>
        </div>
        <div>
          <dt>Avoid When (Anti-Pattern)</dt>
          <dd>{card.avoidWhen}</dd>
        </div>
        <div>
          <dt>GCP Exam Signal</dt>
          <dd>{card.examTip}</dd>
        </div>
        <div>
          <dt>Official Docs</dt>
          <dd>
            <DocSourceLinks references={card.references} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SlotSpecSheet(props: {
  readonly mode: ArenaMode;
  readonly slot: ArchitectureSlot;
  readonly slotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
}): JSX.Element {
  const { mode, slot, slotState, cardsById } = props;
  const revealSolution = mode === 'study' || (slotState?.serviceCardId !== null && slotState?.serviceCardId !== undefined);
  const acceptedNames = slot.acceptedServiceIds
    .map((id) => cardsById[id]?.title ?? id)
    .join(' or ');

  return (
    <div className="spec-card-body">
      <div className="spec-title-line">
        <TechnicalIcon name="blueprint" size={16} />
        <h3 className="spec-subject-title">{slot.title}</h3>
      </div>

      <p className="spec-summary">{slot.requirementClue}</p>

      <dl className="spec-definition-list">
        <div>
          <dt>Recommended Security Control</dt>
          <dd>{cardsById[slot.recommendedShield]?.title ?? slot.recommendedShield} (+60 Hardening Bonus)</dd>
        </div>
        {revealSolution ? (
          <>
            <div>
              <dt>Reference GCP Service</dt>
              <dd>{acceptedNames}</dd>
            </div>
            <div>
              <dt>Architectural Rationale</dt>
              <dd>{slot.architecturalRationale}</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Battle Clue</dt>
            <dd>Match workload SLA, access pattern, and consistency model—or switch to Study Mode to reveal the reference solution.</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
