/**
 * The 2D architecture diagram: a grid with the dashed cloud boundary, one tinted box per zone,
 * context actors (users, devices, partners), playable slot nodes, and the routed flow lanes.
 * It draws the same `BlueprintDiagram` as the 3D island, so both views show one topology.
 */

import type { CSSProperties, JSX } from 'react';

import type { ArenaMode, MatchState, SlotDeployment } from '../../battle';
import type {
  ArchitectureBlueprint,
  BlueprintDiagram,
  CatalogCard,
  CellBounds,
  DiagramNode,
  GridCell,
} from '../../catalog';
import { TechnicalIcon } from '../../../shared/gcp-icons';
import { ActorGlyph } from './actor-glyph';
import { SlotCutoutCard } from './slot-node-card';
import { DIAGRAM_CELL, DIAGRAM_NODE, DiagramFlowLayer } from './topology-edges-svg';

/** Narrowest a column may get before the stage scrolls sideways instead. */
const MIN_COLUMN_PX = 160;
/** Widest a column may get, so lane labels (SVG text) keep about one screen size on every blueprint. */
const MAX_COLUMN_PX = 210;

export interface DiagramBoardBindings {
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

export function DiagramStage(props: {
  readonly board: DiagramBoardBindings;
  readonly diagram: BlueprintDiagram;
}): JSX.Element {
  const { board, diagram } = props;
  const stageStyle = {
    gridTemplateColumns: `repeat(${diagram.cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${diagram.rows}, minmax(0, 1fr))`,
    aspectRatio: `${diagram.cols * DIAGRAM_CELL.width} / ${diagram.rows * DIAGRAM_CELL.height}`,
    minWidth: `${diagram.cols * MIN_COLUMN_PX}px`,
    maxWidth: `${diagram.cols * MAX_COLUMN_PX}px`,
  } satisfies CSSProperties;

  return (
    <div className="diagram-scroll">
      <div className="diagram-stage" style={stageStyle}>
        <div className="diagram-cloud" style={spanStyle(diagram.cloud)}>
          <span className="diagram-cloud-tag">Google Cloud</span>
        </div>
        {diagram.zones.map(({ zone, bounds }) => (
          <div key={zone.id} className={`diagram-zone zone-ink-${zone.ink}`} style={spanStyle(bounds)}>
            <span className="diagram-zone-tag" title={zone.label}>
              <TechnicalIcon name={zone.ink} size={11} />
              <span className="diagram-zone-name">{zone.label}</span>
            </span>
          </div>
        ))}

        <DiagramFlowLayer diagram={diagram} deployedSlots={board.deployedSlots} />

        {diagram.nodes.map((node) => (
          <DiagramNodeView key={node.id} node={node} board={board} diagram={diagram} />
        ))}
      </div>
    </div>
  );
}

function DiagramNodeView(props: {
  readonly node: DiagramNode;
  readonly board: DiagramBoardBindings;
  readonly diagram: BlueprintDiagram;
}): JSX.Element | null {
  const { node, board, diagram } = props;
  if (node.kind !== 'slot') {
    return (
      <div className="diagram-actor" style={nodeStyle(node.cell)}>
        <ActorGlyph kind={node.kind} />
        <span className="diagram-actor-label">{node.label}</span>
      </div>
    );
  }

  const slot = board.blueprint.slots.find((s) => s.id === node.id);
  const ink = diagram.zones.find((z) => z.zone.id === node.zoneId)?.zone.ink;
  if (slot === undefined || ink === undefined) {
    return null;
  }
  return (
    <SlotCutoutCard
      slot={slot}
      matchState={board.matchState}
      zoneInk={ink}
      mode={board.mode}
      playerEnergy={board.playerEnergy}
      slotState={board.deployedSlots[slot.id]}
      cardsById={board.cardsById}
      selectedHandCard={board.selectedHandCard}
      isInspected={board.inspectedSlotId === slot.id}
      onInspectSlot={board.onInspectSlot}
      onTargetSlot={board.onTargetSlot}
      style={nodeStyle(node.cell)}
    />
  );
}

function spanStyle(bounds: CellBounds): CSSProperties {
  return {
    gridColumn: `${bounds.from.col} / ${bounds.to.col + 1}`,
    gridRow: `${bounds.from.row} / ${bounds.to.row + 1}`,
  };
}

/** Nodes are drawn at a fixed share of their cell so flow lanes can stop exactly at their border. */
function nodeStyle(cell: GridCell): CSSProperties {
  return {
    gridColumn: cell.col,
    gridRow: cell.row,
    width: `${DIAGRAM_NODE.width * 100}%`,
    height: `${DIAGRAM_NODE.height * 100}%`,
  };
}
