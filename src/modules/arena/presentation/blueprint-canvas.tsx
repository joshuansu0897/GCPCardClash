/**
 * Alabaster Architecture Drafting Sheet: the blueprint brief, the targeting banner, the
 * architecture diagram (zones, actors, slots and flow lanes), and the flow schedule.
 */

import type { JSX } from 'react';

import type { ArenaMode, MatchState, SlotDeployment } from '../../battle';
import { type ArchitectureBlueprint, type CatalogCard, resolveBlueprintDiagram } from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { DiagramStage } from './diagram-stage';
import { ProtocolFlowSchedule } from './topology-edges-svg';

export interface BlueprintCanvasProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
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
  const diagram = resolveBlueprintDiagram(blueprint);

  return (
    <section className="drafting-sheet" aria-label="Architecture Blueprint Playboard">
      <BlueprintTitleBanner blueprint={blueprint} />
      <p className="workload-brief">{blueprint.workloadBrief}</p>
      <ActiveTargetBanner selectedHandCard={props.selectedHandCard} mode={props.mode} />

      <div className="topology-board-frame">
        <DiagramStage board={props} diagram={diagram} />
        <ProtocolFlowSchedule
          diagram={diagram}
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
