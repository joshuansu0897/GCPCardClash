/**
 * Chooses between an injected 3D board renderer and the built-in 2D drafting sheet.
 * The 2D sheet doubles as the Suspense fallback while the 3D chunk loads and as the
 * error-boundary fallback if WebGL fails at runtime.
 */

import { Component, type ComponentType, type JSX, type ReactNode, Suspense } from 'react';

import type { MatchState } from '../../battle';
import type { ArchitectureBlueprint, CatalogCard } from '../../catalog';
import { BlueprintCanvas } from './blueprint-canvas';

export type BoardView = '3d' | '2d';

/** Contract any alternate playboard renderer (e.g. the `diorama` context) must satisfy. */
export interface BoardRendererProps {
  readonly blueprint: ArchitectureBlueprint;
  readonly matchState: MatchState;
  readonly cardsById: Readonly<Record<string, CatalogCard>>;
  readonly selectedHandCard: CatalogCard | undefined;
  readonly inspectedSlotId: string | null;
  readonly onInspectSlot: (slotId: string) => void;
  readonly onTargetSlot: (slotId: string) => void;
}

export interface BoardViewSwitchProps extends BoardRendererProps {
  readonly view: BoardView;
  readonly renderer3d: ComponentType<BoardRendererProps> | undefined;
  readonly onRendererFailed: () => void;
}

export function BoardViewSwitch(props: BoardViewSwitchProps): JSX.Element {
  const { view, renderer3d: Renderer3d, onRendererFailed, ...boardProps } = props;
  const sheet = <DraftingSheet {...boardProps} />;

  if (view === '2d' || Renderer3d === undefined) {
    return sheet;
  }

  return (
    <RendererErrorBoundary fallback={sheet} onError={onRendererFailed}>
      <Suspense fallback={sheet}>
        <Renderer3d {...boardProps} />
      </Suspense>
    </RendererErrorBoundary>
  );
}

function DraftingSheet(props: BoardRendererProps): JSX.Element {
  return (
    <BlueprintCanvas
      blueprint={props.blueprint}
      mode={props.matchState.mode}
      playerEnergy={props.matchState.playerEnergy}
      deployedSlots={props.matchState.slots}
      cardsById={props.cardsById}
      selectedHandCard={props.selectedHandCard}
      inspectedSlotId={props.inspectedSlotId}
      onInspectSlot={props.onInspectSlot}
      onTargetSlot={props.onTargetSlot}
    />
  );
}

class RendererErrorBoundary extends Component<
  { readonly fallback: ReactNode; readonly onError: () => void; readonly children: ReactNode },
  { readonly failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError();
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
