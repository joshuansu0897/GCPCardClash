/**
 * Routed SVG flow lanes over the 2D architecture diagram (request above, response below, arrows
 * at the target) and the docked Protocol Dataflow Schedule listing every flow.
 */

import type { JSX } from 'react';

import { TechnicalIcon } from '../../../shared/gcp-icons';
import type { SlotDeployment } from '../../battle';
import {
  type BlueprintDiagram,
  type DiagramLane,
  type FlowEdge,
  type GridPoint,
  routeDiagramLanes,
} from '../../catalog';

/** SVG units per diagram cell; the stage keeps this aspect ratio so lanes never stretch. */
export const DIAGRAM_CELL = { width: 200, height: 150 } as const;
/** Share of its cell a node card fills. */
export const DIAGRAM_NODE = { width: 0.64, height: 0.74 } as const;

const LANE_OPTIONS = { laneGap: 0.09, nodeHalf: { x: DIAGRAM_NODE.width / 2, y: DIAGRAM_NODE.height / 2 } };
const LABEL_OFFSET = { x: 0.04, y: 0.07 } as const;

export function DiagramFlowLayer(props: {
  readonly diagram: BlueprintDiagram;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
}): JSX.Element {
  const { diagram, deployedSlots } = props;
  const lanes = routeDiagramLanes(diagram, LANE_OPTIONS);

  return (
    <svg
      className="topology-flow-svg"
      viewBox={`0 0 ${diagram.cols * DIAGRAM_CELL.width} ${diagram.rows * DIAGRAM_CELL.height}`}
      aria-hidden="true"
    >
      <FlowMarkerDefs />
      {lanes.map((lane) => (
        <FlowLane key={lane.id} lane={lane} isSynergy={isPlayerSynergy(lane, deployedSlots)} />
      ))}
    </svg>
  );
}

function FlowLane(props: { readonly lane: DiagramLane; readonly isSynergy: boolean }): JSX.Element {
  const { lane, isSynergy } = props;
  const points = lane.points.map(toSvg).map(([x, y]) => `${x},${y}`).join(' ');
  const [labelX, labelY] = toSvg({
    x: lane.labelAt.x + lane.labelNormal.x * LABEL_OFFSET.x,
    y: lane.labelAt.y + lane.labelNormal.y * LABEL_OFFSET.y,
  });
  const anchor = lane.labelNormal.x > 0.5 ? 'start' : lane.labelNormal.x < -0.5 ? 'end' : 'middle';

  return (
    <g className={`flow-edge is-${lane.direction} ${isSynergy ? 'is-synergy' : ''}`}>
      <polyline
        points={points}
        fill="none"
        stroke={isSynergy ? '#2563EB' : '#64748B'}
        strokeWidth={isSynergy ? 2.4 : 1.5}
        strokeDasharray={lane.direction === 'response' ? '5 4' : undefined}
        markerEnd={isSynergy ? 'url(#flow-arrow-synergy)' : 'url(#flow-arrow-neutral)'}
      />
      {isSynergy && (
        <polyline points={points} className="flow-pulse-stream" fill="none" stroke="#93C5FD" strokeWidth={2} strokeDasharray="6 18" />
      )}
      <text x={labelX} y={labelY} textAnchor={anchor} dominantBaseline="middle" className="flow-lane-label">
        {lane.label}
      </text>
    </g>
  );
}

function toSvg(point: GridPoint): readonly [number, number] {
  return [(point.x - 0.5) * DIAGRAM_CELL.width, (point.y - 0.5) * DIAGRAM_CELL.height];
}

export function ProtocolFlowSchedule(props: {
  readonly diagram: BlueprintDiagram;
  readonly deployedSlots: Readonly<Record<string, SlotDeployment>>;
  readonly onInspectSlot: (slotId: string) => void;
}): JSX.Element {
  const { diagram, deployedSlots, onInspectSlot } = props;

  return (
    <div className="protocol-bus-schedule" aria-label="Protocol Dataflow Schedule">
      {diagram.edges.map((edge, idx) => (
        <button
          key={edge.id}
          type="button"
          className={isPlayerSynergy(edge, deployedSlots) ? 'bus-schedule-chip is-synergy' : 'bus-schedule-chip'}
          onClick={() => onInspectSlot(diagram.nodesById[edge.toNodeId]?.kind === 'slot' ? edge.toNodeId : edge.fromNodeId)}
        >
          <span className="bus-callout-id">F{idx + 1}</span>
          <span className="bus-endpoint">{diagram.nodesById[edge.fromNodeId]?.label ?? edge.fromNodeId}</span>
          <TechnicalIcon name="arrow-right" size={12} />
          <span className="bus-endpoint">{diagram.nodesById[edge.toNodeId]?.label ?? edge.toNodeId}</span>
          <span className="bus-protocol-tag">
            {edge.protocolLabel}
            {edge.returnLabel !== undefined ? ` ⇄ ${edge.returnLabel}` : ''}
          </span>
        </button>
      ))}
    </div>
  );
}

function isPlayerSynergy(
  flow: Pick<FlowEdge, 'fromNodeId' | 'toNodeId'>,
  deployedSlots: Readonly<Record<string, SlotDeployment>>,
): boolean {
  return deployedSlots[flow.fromNodeId]?.owner === 'player' && deployedSlots[flow.toNodeId]?.owner === 'player';
}

function FlowMarkerDefs(): JSX.Element {
  return (
    <defs>
      <marker id="flow-arrow-neutral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="#64748B" />
      </marker>
      <marker id="flow-arrow-synergy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="#1A56DB" />
      </marker>
    </defs>
  );
}
