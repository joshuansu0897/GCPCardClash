/**
 * DOM label overlay for the diorama. Labels live in the board's own React tree (real,
 * focusable buttons) and a single in-canvas projector moves them each frame by writing
 * CSS transforms straight to their elements — no per-label React roots, no re-renders.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { type JSX, type RefObject, useCallback, useMemo, useRef } from 'react';
import { Vector3 } from 'three';

import type { ArenaMode, SlotDeployment } from '../../battle';
import type { ArchitectureSlot, CatalogCard } from '../../catalog';
import type { Vec3 } from '../domain/board-layout';
import { type PadAffordance, describeAffordance } from '../domain/pad-affordance';

export interface LabelAnchor {
  readonly id: string;
  readonly position: Vec3;
}

export type LabelRegistry = RefObject<Map<string, HTMLElement>>;

export function useLabelRegistry(): {
  readonly registry: LabelRegistry;
  readonly bind: (id: string) => (element: HTMLElement | null) => void;
} {
  const registry = useRef<Map<string, HTMLElement>>(new Map());
  const bind = useCallback(
    (id: string) => (element: HTMLElement | null) => {
      if (element === null) {
        registry.current.delete(id);
      } else {
        registry.current.set(id, element);
      }
    },
    [],
  );
  return { registry, bind };
}

/** Mounted inside `<Canvas>`: projects each anchor to screen space and positions its label. */
export function LabelProjector(props: {
  readonly anchors: readonly LabelAnchor[];
  readonly registry: LabelRegistry;
}): null {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const scratch = useMemo(() => new Vector3(), []);
  const lastTransforms = useRef<Map<string, string>>(new Map());

  useFrame(() => {
    for (const anchor of props.anchors) {
      const element = props.registry.current.get(anchor.id);
      if (element === undefined) {
        continue;
      }
      scratch.set(anchor.position[0], anchor.position[1], anchor.position[2]).project(camera);
      const x = Math.round(((scratch.x + 1) / 2) * size.width);
      const y = Math.round(((1 - scratch.y) / 2) * size.height);
      const transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      // Write only on change so labels stay pixel-stable between camera moves.
      if (lastTransforms.current.get(anchor.id) !== transform) {
        lastTransforms.current.set(anchor.id, transform);
        element.style.transform = transform;
        element.style.visibility = scratch.z < 1 ? 'visible' : 'hidden';
      }
    }
  });

  return null;
}

export interface PadLabelProps {
  readonly slot: ArchitectureSlot;
  readonly slotState: SlotDeployment | undefined;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly mode: ArenaMode;
  readonly affordance: PadAffordance;
  readonly isInspected: boolean;
  readonly bindRef: (element: HTMLElement | null) => void;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

export function PadLabel(props: PadLabelProps): JSX.Element {
  const { slot, slotState, mode, cardsById, affordance } = props;
  const owner = slotState?.owner ?? null;
  const service = slotState?.serviceCardId ? cardsById[slotState.serviceCardId] : undefined;
  const optimal = slot.acceptedServiceIds[0] ? cardsById[slot.acceptedServiceIds[0]] : undefined;
  const actionLabel = describeAffordance(affordance);
  const isActionable = affordance.kind === 'deploy' || affordance.kind === 'capture' || affordance.kind === 'harden';
  const ownerClass = owner !== null ? `is-owned-${owner}` : 'is-open';

  return (
    <div ref={props.bindRef} className={`pad-label ${ownerClass} ${props.isInspected ? 'is-inspected' : ''}`}>
      <button type="button" className="pad-label-title" onClick={() => props.onInspectSlot(slot.id)}>
        {service !== undefined ? <span className="pad-label-code">{service.shortCode}</span> : null}
        <span>{slot.title}</span>
      </button>
      {mode === 'study' && service === undefined && optimal !== undefined && (
        <span className="pad-label-hint">Fit: {optimal.title}</span>
      )}
      {actionLabel !== null && (
        <button
          type="button"
          className={`pad-label-action is-${affordance.kind}`}
          disabled={!isActionable}
          onClick={() => props.onTargetSlot(slot.id)}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
