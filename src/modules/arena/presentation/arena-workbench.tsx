/**
 * Primary Arena Workbench shell. With the 3D board active it becomes an immersive game screen
 * (the board fills the viewport behind a HUD); with the 2D sheet it keeps the classic page:
 * header, Rival tray, playboard and inspector side by side, and the hand docked at the bottom.
 */

import { type ComponentType, type JSX, useState } from 'react';

import type { CatalogRepository } from '../../catalog';
import type { ProgressRepository } from '../../progression';
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
import { ImmersiveArena } from './immersive-arena';
import { useArenaController } from './use-arena-controller';

export interface ArenaWorkbenchProps {
  readonly catalogRepository: CatalogRepository;
  readonly progressRepository: ProgressRepository;
  /** Optional 3D playboard injected by the composition root; omitted when WebGL is unavailable. */
  readonly boardRenderer3d?: ComponentType<BoardRendererProps>;
  /** Pause between Rival actions so its turn plays out visibly; 0 resolves the turn instantly. */
  readonly rivalStepDelayMs?: number;
  /** Seed for each new match's shuffles and incident draws; fixed by default so tests are deterministic. */
  readonly nextMatchSeed?: () => number;
}

const FIXED_MATCH_SEED = (): number => 202610;

export function ArenaWorkbench(props: ArenaWorkbenchProps): JSX.Element {
  const ctrl = useArenaController(
    props.catalogRepository,
    props.progressRepository,
    props.rivalStepDelayMs ?? 0,
    props.nextMatchSeed ?? FIXED_MATCH_SEED,
  );
  const renderer3d = props.boardRenderer3d;
  const [boardView, setBoardView] = useState<BoardView>(renderer3d !== undefined ? '3d' : '2d');
  const showTurnBanner = (props.rivalStepDelayMs ?? 0) > 0;

  // Hand the whole screen to the 3D board when it is active
  if (boardView === '3d' && renderer3d !== undefined) {
    return (
      <ImmersiveArena
        ctrl={ctrl}
        renderer3d={renderer3d}
        showTurnBanner={showTurnBanner}
        onChangeBoardView={setBoardView}
        onRendererFailed={() => setBoardView('2d')}
      />
    );
  }

  return (
    <div className={shellClassName(ctrl)}>
      <ArenaHeaderSection
        ctrl={ctrl}
        boardView={renderer3d !== undefined ? boardView : null}
        onChangeBoardView={setBoardView}
      />
      <main className="workbench-stage">
        <div className="arena-main-column">
          <RivalSection ctrl={ctrl} />
          <BoardSection
            ctrl={ctrl}
            boardView="2d"
            renderer3d={undefined}
            onRendererFailed={() => setBoardView('2d')}
            onInspectSlot={ctrl.handleInspectSlot}
          />
        </div>
        <InspectorSection ctrl={ctrl} />
      </main>
      <HandSection ctrl={ctrl} />
      <ArenaOverlays ctrl={ctrl} showTurnBanner={showTurnBanner} />
    </div>
  );
}
