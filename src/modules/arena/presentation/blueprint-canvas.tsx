/**
 * Alabaster Architecture Drafting Sheet displaying perimeter zones, flow buses, and slots.
 */

import type { JSX } from 'react';

import type { ArenaMode, SlotDeployment } from '../../battle';
import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  CatalogCard,
  PerimeterZone,
  ServiceCard,
} from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { ProtocolFlowSchedule, TopologyEdgesSvg } from './topology-edges-svg';

export interface BlueprintCanvasProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly mode: ArenaMode;
  readonly playerEnergy: number;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

export function BlueprintCanvas(props: BlueprintCanvasProps): JSX.Element {
  const { blueprint } = props;
  const sortedZones = [...blueprint.zones].sort((a, b) => a.column - b.column);
  const maxRow: 2 | 3 = blueprint.slots.some((s) => s.row === 3) ? 3 : 2;

  return (
    <section className="drafting-sheet" aria-label="Architecture Blueprint Playboard">
      <BlueprintTitleBanner blueprint={blueprint} />
      <p className="workload-brief">{blueprint.workloadBrief}</p>
      <ActiveTargetBanner selectedHandCard={props.selectedHandCard} mode={props.mode} />

      <div className="topology-board-frame">
        <div className="topology-diagram-stage">
          <TopologyEdgesSvg
            blueprint={blueprint}
            deployedSlots={props.deployedSlots}
            maxRow={maxRow}
          />

          <div className={`perimeter-zones-grid rows-${maxRow}`}>
            {sortedZones.map((zone) => (
              <ZoneColumnFrame
                key={zone.id}
                zone={zone}
                slots={blueprint.slots.filter((s) => s.zoneId === zone.id)}
                mode={props.mode}
                playerEnergy={props.playerEnergy}
                deployedSlots={props.deployedSlots}
                cardsById={props.cardsById}
                selectedHandCard={props.selectedHandCard}
                inspectedSlotId={props.inspectedSlotId}
                onInspectSlot={props.onInspectSlot}
                onTargetSlot={props.onTargetSlot}
              />
            ))}
          </div>
        </div>

        <ProtocolFlowSchedule
          blueprint={blueprint}
          deployedSlots={props.deployedSlots}
          onInspectSlot={props.onInspectSlot}
        />
      </div>
    </section>
  );
}

function BlueprintTitleBanner(props: { readonly blueprint: ArchitectureBlueprint }): JSX.Element {
  const { blueprint } = props;

  return (
    <div className="sheet-title-bar">
      <h2 className="sheet-heading">
        {blueprint.code} · {blueprint.title}
      </h2>
      <div className="sheet-badges">
        <span className="spec-tag">{blueprint.difficulty}</span>
        <span className="spec-tag">SLA {blueprint.targetSla}</span>
        <span className="spec-tag">{blueprint.costFocus}</span>
      </div>
    </div>
  );
}

function ActiveTargetBanner(props: {
  readonly selectedHandCard: CatalogCard | undefined;
  readonly mode: ArenaMode;
}): JSX.Element {
  const { selectedHandCard, mode } = props;

  if (selectedHandCard?.kind === 'service') {
    return (
      <div className="target-guidance is-active">
        <TechnicalIcon name={selectedHandCard.ink} size={15} />
        <span>
          Selected <strong>{selectedHandCard.title}</strong> ({selectedHandCard.energyCost}E) — click an open slot or unshielded Rival node ({selectedHandCard.energyCost + 1}E) to deploy.
        </span>
      </div>
    );
  }

  if (selectedHandCard?.kind === 'shield') {
    return (
      <div className="target-guidance is-shield">
        <TechnicalIcon name="shield" size={15} />
        <span>
          Selected <strong>{selectedHandCard.title}</strong> (1E) — click one of YOUR unshielded nodes to harden it against Rival takeover.
        </span>
      </div>
    );
  }

  return (
    <div className="target-guidance">
      <TechnicalIcon name="blueprint" size={15} />
      <span>
        {mode === 'study'
          ? 'Guided Study Active: Optimal GCP services and shields are shown on every slot. Click any node to read exam trade-offs.'
          : 'Select a card in your Hand below to provision Energy, deploy a GCP Service, or harden an owned node.'}
      </span>
    </div>
  );
}

interface ZoneColumnFrameProps {
  readonly zone: PerimeterZone;
  readonly slots: readonly ArchitectureSlot[];
  readonly mode: ArenaMode;
  readonly playerEnergy: number;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

function ZoneColumnFrame(props: ZoneColumnFrameProps): JSX.Element {
  const { zone, slots } = props;

  return (
    <div className={`perimeter-zone zone-ink-${zone.ink}`}>
      <div className="zone-header">
        <TechnicalIcon name={zone.ink} size={14} />
        <span className="zone-label">{zone.label}</span>
      </div>

      <div className="zone-slots-stack">
        {slots.map((slot) => (
          <SlotCutoutCard
            key={slot.id}
            slot={slot}
            zoneInk={zone.ink}
            mode={props.mode}
            playerEnergy={props.playerEnergy}
            slotState={props.deployedSlots[slot.id]}
            cardsById={props.cardsById}
            selectedHandCard={props.selectedHandCard}
            isInspected={props.inspectedSlotId === slot.id}
            onInspectSlot={props.onInspectSlot}
            onTargetSlot={props.onTargetSlot}
          />
        ))}
      </div>
    </div>
  );
}

interface SlotCutoutProps {
  readonly slot: ArchitectureSlot;
  readonly zoneInk: PerimeterZone['ink'];
  readonly mode: ArenaMode;
  readonly playerEnergy: number;
  readonly slotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly isInspected: boolean;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

function SlotCutoutCard(props: SlotCutoutProps): JSX.Element {
  const { slot, mode, slotState, cardsById, selectedHandCard, isInspected } = props;
  const deployedService = slotState?.serviceCardId ? cardsById[slotState.serviceCardId] : undefined;
  const deployedShield = slotState?.shieldCardId ? cardsById[slotState.shieldCardId] : undefined;
  const optimalService = slot.acceptedServiceIds[0] ? cardsById[slot.acceptedServiceIds[0]] : undefined;
  const actionLabel = resolveSlotActionLabel(slotState, selectedHandCard, props.playerEnergy);

  const ownerClass = slotState?.owner ? `is-owned-${slotState.owner}` : 'is-open';
  const inspectClass = isInspected ? 'is-inspected' : '';

  return (
    <article
      className={`slot-cutout ${ownerClass} ${inspectClass}`}
      style={{ gridRow: slot.row }}
    >
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
  slotState: SlotDeployment | undefined,
  selectedCard: CatalogCard | undefined,
  playerEnergy: number,
): string | null {
  if (selectedCard?.kind === 'service') {
    return resolveServiceVerb(slotState, selectedCard, playerEnergy);
  }
  if (selectedCard?.kind === 'shield' && slotState?.owner === 'player' && slotState.shieldCardId === null) {
    return 'Harden (1E)';
  }
  return null;
}

function resolveServiceVerb(
  slotState: SlotDeployment | undefined,
  card: ServiceCard,
  playerEnergy: number,
): string | null {
  if (!slotState?.owner) {
    return `Deploy (${card.energyCost}E)`;
  }
  if (slotState.owner === 'rival' && slotState.shieldCardId === null) {
    const capCost = card.energyCost + 1;
    return playerEnergy >= capCost ? `Capture (${capCost}E)` : `Need ${capCost}E`;
  }
  return null;
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
