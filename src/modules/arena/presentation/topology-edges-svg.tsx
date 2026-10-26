/**
 * Deterministic orthogonal SVG flow-bus overlay and docked Protocol Dataflow Schedule.
 */

import type { JSX } from 'react';

import { TechnicalIcon } from '../../../shared/gcp-icons';
import type { SlotDeployment } from '../../battle';
import type {
  ArchitectureBlueprint,
  ArchitectureSlot,
  FlowEdge,
  ZoneColumn,
} from '../../catalog';

export interface TopologyEdgesSvgProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
  readonly maxRow: 2 | 3;
}

interface BusGeometry {
  readonly pathData: string;
  readonly badgeX: number;
  readonly badgeY: number;
}

const COL_LEFT: Readonly<Record<ZoneColumn, number>> = { 1: 0, 2: 310, 3: 620 };
const COL_RIGHT: Readonly<Record<ZoneColumn, number>> = { 1: 280, 2: 590, 3: 900 };
const COL_CENTER: Readonly<Record<ZoneColumn, number>> = { 1: 140, 2: 450, 3: 760 };
const ROW_Y: Readonly<Record<1 | 2 | 3, number>> = { 1: 102, 2: 242, 3: 382 };

export function TopologyEdgesSvg(props: TopologyEdgesSvgProps): JSX.Element {
  const { blueprint, deployedSlots, maxRow } = props;
  const zoneColumns = new Map(blueprint.zones.map((z) => [z.id, z.column]));
  const slotById = new Map(blueprint.slots.map((s) => [s.id, s]));
  const viewHeight = maxRow === 3 ? 456 : 316;

  return (
    <svg
      className="topology-flow-svg"
      viewBox={`0 0 900 ${viewHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <FlowMarkerDefs />
      {blueprint.edges.map((edge, idx) => (
        <SingleFlowBus
          key={edge.id}
          edge={edge}
          calloutCode={`F${idx + 1}`}
          edgeIndex={idx}
          slotById={slotById}
          zoneColumns={zoneColumns}
          deployedSlots={deployedSlots}
        />
      ))}
    </svg>
  );
}

export function ProtocolFlowSchedule(props: {
  readonly blueprint: ArchitectureBlueprint;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
  readonly onInspectSlot: (slotId: string) => void;
}): JSX.Element {
  const { blueprint, deployedSlots, onInspectSlot } = props;
  const slotById = new Map(blueprint.slots.map((s) => [s.id, s]));

  return (
    <div className="protocol-bus-schedule" aria-label="Protocol Dataflow Schedule">
      {blueprint.edges.map((edge, idx) => {
        const fromTitle = slotById.get(edge.fromSlotId)?.title ?? edge.fromSlotId;
        const toTitle = slotById.get(edge.toSlotId)?.title ?? edge.toSlotId;
        const isSynergy = isPlayerSynergy(edge, deployedSlots);

        return (
          <button
            key={edge.id}
            type="button"
            className={isSynergy ? 'bus-schedule-chip is-synergy' : 'bus-schedule-chip'}
            onClick={() => onInspectSlot(edge.toSlotId)}
          >
            <span className="bus-callout-id">F{idx + 1}</span>
            <span className="bus-endpoint">{fromTitle}</span>
            <TechnicalIcon name="arrow-right" size={12} />
            <span className="bus-endpoint">{toTitle}</span>
            <span className="bus-protocol-tag">{edge.protocolLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function isPlayerSynergy(
  edge: FlowEdge,
  deployedSlots: Readonly<Record<string, SlotDeployment>>,
): boolean {
  return (
    deployedSlots[edge.fromSlotId]?.owner === 'player' &&
    deployedSlots[edge.toSlotId]?.owner === 'player'
  );
}

function FlowMarkerDefs(): JSX.Element {
  return (
    <defs>
      <marker
        id="flow-arrow-neutral"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="#6E6A5E" />
      </marker>
      <marker
        id="flow-arrow-synergy"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="#1A56DB" />
      </marker>
    </defs>
  );
}

function SingleFlowBus(props: {
  readonly edge: FlowEdge;
  readonly calloutCode: string;
  readonly edgeIndex: number;
  readonly slotById: ReadonlyMap<string, ArchitectureSlot>;
  readonly zoneColumns: ReadonlyMap<string, ZoneColumn>;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
}): JSX.Element | null {
  const { edge, calloutCode, edgeIndex, slotById, zoneColumns, deployedSlots } = props;
  const fromSlot = slotById.get(edge.fromSlotId);
  const toSlot = slotById.get(edge.toSlotId);
  if (fromSlot === undefined || toSlot === undefined) {
    return null;
  }

  const geometry = computeBusGeometry(fromSlot, toSlot, zoneColumns, edgeIndex);
  const isSynergy = isPlayerSynergy(edge, deployedSlots);

  return (
    <g className={isSynergy ? 'flow-edge is-synergy' : 'flow-edge'}>
      <path
        d={geometry.pathData}
        fill="none"
        stroke={isSynergy ? '#1A56DB' : '#8F8878'}
        strokeWidth={isSynergy ? '2.25' : '1.5'}
        strokeDasharray={isSynergy ? undefined : '5 4'}
        markerEnd={isSynergy ? 'url(#flow-arrow-synergy)' : 'url(#flow-arrow-neutral)'}
      />
      <FlowCalloutStamp
        x={geometry.badgeX}
        y={geometry.badgeY}
        code={calloutCode}
        isSynergy={isSynergy}
      />
    </g>
  );
}

function FlowCalloutStamp(props: {
  readonly x: number;
  readonly y: number;
  readonly code: string;
  readonly isSynergy: boolean;
}): JSX.Element {
  return (
    <>
      <rect
        x={props.x - 12}
        y={props.y - 8}
        width="24"
        height="16"
        rx="2"
        fill={props.isSynergy ? '#1A56DB' : '#16191D'}
      />
      <text
        x={props.x}
        y={props.y + 3.5}
        textAnchor="middle"
        fill="#FCFBF7"
        fontSize="9.5"
        fontWeight="600"
        fontFamily="IBM Plex Mono, monospace"
      >
        {props.code}
      </text>
    </>
  );
}

function computeBusGeometry(
  fromSlot: ArchitectureSlot,
  toSlot: ArchitectureSlot,
  zoneColumns: ReadonlyMap<string, ZoneColumn>,
  edgeIndex: number,
): BusGeometry {
  const fromCol = zoneColumns.get(fromSlot.zoneId) ?? 1;
  const toCol = zoneColumns.get(toSlot.zoneId) ?? 1;
  const startY = ROW_Y[fromSlot.row] + ((edgeIndex % 2) * 10 - 5);
  const endY = ROW_Y[toSlot.row] + ((edgeIndex % 2) * 10 - 5);

  if (fromCol === toCol) {
    const centerX = COL_CENTER[fromCol];
    const dir = Math.sign(toSlot.row - fromSlot.row) || 1;
    const vStart = ROW_Y[fromSlot.row] + dir * 56;
    const vEnd = ROW_Y[toSlot.row] - dir * 56;

    return {
      pathData: `M ${centerX} ${vStart} L ${centerX} ${vEnd}`,
      badgeX: centerX,
      badgeY: Math.round((vStart + vEnd) / 2),
    };
  }

  const goingRight = toCol > fromCol;
  const startX = goingRight ? COL_RIGHT[fromCol] : COL_LEFT[fromCol];
  const endX = goingRight ? COL_LEFT[toCol] : COL_RIGHT[toCol];
  const gutterX = resolveGutterX(fromCol, toCol);
  const badgeY = Math.round((startY + endY) / 2) + (startY === endY ? 0 : (edgeIndex % 2) * 16 - 8);

  return {
    pathData: `M ${startX} ${startY} L ${gutterX} ${startY} L ${gutterX} ${endY} L ${endX} ${endY}`,
    badgeX: gutterX,
    badgeY,
  };
}

function resolveGutterX(fromCol: ZoneColumn, toCol: ZoneColumn): number {
  const minCol = Math.min(fromCol, toCol);
  const maxCol = Math.max(fromCol, toCol);
  if (minCol === 1 && maxCol === 2) {
    return 295;
  }
  if (minCol === 2 && maxCol === 3) {
    return 605;
  }
  return 295;
}
