/**
 * A playable slot drawn as a node on the blueprint diagram: its title, owner, deployed service
 * (or requirement clue), shield status, and the action the selected hand card would take on it.
 */

import type { CSSProperties, JSX } from 'react';

import { type ArenaMode, type MatchState, type SlotDeployment, quoteServiceCost, quoteShieldCost } from '../../battle';
import type { ArchitectureSlot, CatalogCard, PerimeterZone, ServiceCard } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';

export interface SlotCutoutProps {
  readonly slot: ArchitectureSlot;
  readonly matchState: MatchState;
  readonly zoneInk: PerimeterZone['ink'];
  readonly mode: ArenaMode;
  readonly playerEnergy: number;
  readonly slotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly isInspected: boolean;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
  /** Grid placement inside the diagram stage. */
  readonly style?: CSSProperties;
}

export function SlotCutoutCard(props: SlotCutoutProps): JSX.Element {
  const { slot, mode, slotState, cardsById, selectedHandCard, isInspected } = props;
  const deployedService = slotState?.serviceCardId ? cardsById[slotState.serviceCardId] : undefined;
  const deployedShield = slotState?.shieldCardId ? cardsById[slotState.shieldCardId] : undefined;
  const optimalService = slot.acceptedServiceIds[0] ? cardsById[slot.acceptedServiceIds[0]] : undefined;
  const actionLabel = resolveSlotActionLabel(props.matchState, slotState, selectedHandCard);

  const ownerClass = slotState?.owner ? `is-owned-${slotState.owner}` : 'is-open';
  const inspectClass = isInspected ? 'is-inspected' : '';

  return (
    <article className={`slot-cutout ${ownerClass} ${inspectClass}`} style={props.style} title={slot.requirementClue}>
      <div className={`slot-ink-band ink-bg-${props.zoneInk}`} aria-hidden="true" />

      <div className="slot-top-row">
        <button
          type="button"
          className="slot-title-btn"
          onClick={() => props.onInspectSlot(slot.id)}
        >
          {slot.title}
        </button>
        <SlotOwnerStamp slotState={slotState} />
      </div>

      {deployedService !== undefined ? (
        <div className="slot-deployed-box">
          <span className="service-code-chip">{deployedService.shortCode}</span>
          <span className="deployed-service-name">{deployedService.title}</span>
        </div>
      ) : (
        <p className="slot-clue">{slot.requirementClue}</p>
      )}

      <SlotFooterRow
        mode={mode}
        recommendedShieldTitle={cardsById[slot.recommendedShield]?.title ?? slot.recommendedShield}
        slotState={slotState}
        deployedShield={deployedShield}
        optimalService={optimalService}
        actionLabel={actionLabel}
        onTarget={() => props.onTargetSlot(slot.id)}
      />
    </article>
  );
}

function SlotOwnerStamp(props: { readonly slotState: SlotDeployment | undefined }): JSX.Element {
  const owner = props.slotState?.owner;
  if (owner === 'player') {
    return <span className="owner-pill owner-player">YOU</span>;
  }
  if (owner === 'rival') {
    return <span className="owner-pill owner-rival">RIVAL</span>;
  }
  return <span className="owner-pill owner-open">OPEN</span>;
}

function resolveSlotActionLabel(
  state: MatchState,
  slotState: SlotDeployment | undefined,
  selectedCard: CatalogCard | undefined,
): string | null {
  if (selectedCard?.kind === 'service') {
    return resolveServiceVerb(state, slotState, selectedCard);
  }
  if (selectedCard?.kind === 'shield' && slotState?.owner === 'player' && slotState.shieldCardId === null) {
    return `Harden (${quoteShieldCost(state, selectedCard)}E)`;
  }
  return null;
}

function resolveServiceVerb(
  state: MatchState,
  slotState: SlotDeployment | undefined,
  card: ServiceCard,
): string | null {
  const cost = quoteServiceCost(state, 'player', card, slotState);
  if (cost === null) {
    return null;
  }
  if (!slotState?.owner) {
    return `Deploy (${cost}E)`;
  }
  return state.playerEnergy >= cost ? `Capture (${cost}E)` : `Need ${cost}E`;
}

function SlotFooterRow(props: {
  readonly mode: ArenaMode;
  readonly recommendedShieldTitle: string;
  readonly slotState: SlotDeployment | undefined;
  readonly deployedShield: CatalogCard | undefined;
  readonly optimalService: CatalogCard | undefined;
  readonly actionLabel: string | null;
  readonly onTarget: () => void;
}): JSX.Element {
  const { mode, recommendedShieldTitle, slotState, deployedShield, optimalService, actionLabel, onTarget } = props;

  return (
    <div className="slot-footer-row">
      {deployedShield !== undefined ? (
        <span className="shield-status is-hardened">
          <TechnicalIcon name="shield" size={13} />
          <span>{deployedShield.shortCode} Hardened</span>
        </span>
      ) : slotState?.owner !== null && slotState?.owner !== undefined ? (
        <span className="shield-status is-vulnerable">
          <TechnicalIcon name="alert" size={13} />
          <span>Unshielded</span>
        </span>
      ) : mode === 'study' && optimalService !== undefined ? (
        <span className="study-answer-chip">
          <TechnicalIcon name="check" size={13} />
          <span>Fit: {optimalService.title}</span>
        </span>
      ) : (
        <span className="shield-rec-hint">Shield: {recommendedShieldTitle}</span>
      )}

      {actionLabel !== null && (
        <button type="button" className="slot-deploy-btn" onClick={onTarget}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
