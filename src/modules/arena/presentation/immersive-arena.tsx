/**
 * Immersive game screen for the 3D board: the board fills the viewport and the HUD floats over
 * it — scoreboard on top, the Rival and incidents on the left, the hand with energy and End Turn
 * along the bottom, and the spec inspector plus match log in a drawer on the right.
 */

import { type ComponentType, type JSX, useState } from 'react';

import {
  ArenaHeaderSection,
  ArenaOverlays,
  BoardSection,
  HandSection,
  InspectorSection,
  RivalSection,
  shellClassName,
} from './arena-sections';
import type { BoardRendererProps, BoardView } from './board-view-switch';
import { InspectorDrawer } from './inspector-drawer';
import { useHudInsets } from './use-hud-insets';
import type { ArenaControllerState } from './use-arena-controller';

export interface ImmersiveArenaProps {
  readonly ctrl: ArenaControllerState;
  readonly renderer3d: ComponentType<BoardRendererProps>;
  readonly showTurnBanner: boolean;
  readonly onChangeBoardView: (view: BoardView) => void;
  readonly onRendererFailed: () => void;
}

export function ImmersiveArena(props: ImmersiveArenaProps): JSX.Element {
  const { ctrl } = props;
  const hud = useHudInsets();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Inspecting a pad opens its dossier in the drawer
  const inspectSlot = (slotId: string): void => {
    ctrl.handleInspectSlot(slotId);
    setDrawerOpen(true);
  };

  return (
    <div className={shellClassName(ctrl, 'is-immersive')} style={hud.style}>
      <main className="immersive-board-layer">
        <BoardSection
          ctrl={ctrl}
          boardView="3d"
          renderer3d={props.renderer3d}
          onRendererFailed={props.onRendererFailed}
          onInspectSlot={inspectSlot}
          viewInsets={hud.insets}
        />
      </main>

      <div ref={hud.topRef} className="immersive-top">
        <ArenaHeaderSection ctrl={ctrl} boardView="3d" onChangeBoardView={props.onChangeBoardView} />
      </div>
      <div ref={hud.railRef} className="immersive-left-rail">
        <RivalSection ctrl={ctrl} />
      </div>
      <InspectorDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <InspectorSection ctrl={ctrl} />
      </InspectorDrawer>
      <div ref={hud.bottomRef} className="immersive-bottom">
        <HandSection ctrl={ctrl} withEnergy />
      </div>

      <ArenaOverlays ctrl={ctrl} showTurnBanner={props.showTurnBanner} />
    </div>
  );
}
