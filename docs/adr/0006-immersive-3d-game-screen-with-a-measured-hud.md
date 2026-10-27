# ADR-0006: Immersive 3D game screen with a measured HUD

* **Status**: Accepted
* **Date**: 2026-10-27
* **Bounded Contexts**: arena,diorama
* **Supersedes**: None

## Context

In 3D mode the diorama was one panel on a scrolling page. The header, the Rival tray, the hand, End Turn and the inspector sat around it as page sections. The game did not read as one screen, and the enemy hovering above the island's far edge was clipped at the top of the stage.

## Considered Options

1. **HUD overlaid on a full-screen board (chosen)**: the canvas fills the viewport and the existing DOM components float over it.
   * Pros: sharp text, accessible buttons, the existing tests keep working, the card tilt and foil effects survive.
   * Cons: the 3D camera has to know which parts of the screen the HUD covers.
2. **Everything as 3D objects**: hand cards, energy crystals and the End Turn button rendered in the scene.
   * Pros: the most immersive option.
   * Cons: card text is hard to read, a11y needs hidden duplicate controls, and much more code lives in `diorama`.
3. **Shrink the canvas to the free area**: no camera changes needed.
   * Cons: meteors, the scanner ship and the enemy get clipped at the canvas edges.

## Decision

* When the 3D board is active, `ArenaWorkbench` renders `ImmersiveArena`:
  * The board fills the viewport.
  * The scoreboard sits on top.
  * The Rival tray and the incident ticker form a rail on the left.
  * The hand, an energy meter and End Turn sit along the bottom.
  * The spec inspector and the match log move into a slide-out drawer on the right. Inspecting a pad opens it.
  * The 2D sheet keeps the classic page layout.
* `useHudInsets` measures the HUD panels and passes them to the renderer as `BoardRendererProps.viewInsets`. This is optional, so 2D and older renderers are unaffected. The same measurements are exposed as CSS variables for the elements floating over the board.
* `diorama/domain/camera-fit.ts` (pure) projects the island's bounding points (slab underside to skyline) and the enemy's bounds through the real camera, then searches the distance so that footprint fits the free area. It returns a `setViewOffset` shift so the footprint is centred there and not in the whole viewport. Bosses get a larger enemy box and side gap.
* `diorama/domain/terrace-decor.ts` (pure, deterministic) places district props per zone ink (racks, tanks, antennas, bollards, crystals, trees) in the terrace margins between pad rows, clear of the flow roads.
* The camera starts higher, at about 55°.
* The track enemy hovers off the island's left edge and turns to face the board. It lunges toward the island, and the camera frames extra room for it.

## Consequences

* **Hexagonal Ring Placement**:
  * The layout lives in `arena/presentation/`: `immersive-arena.tsx`, `arena-sections.tsx`, `inspector-drawer.tsx` and `use-hud-insets.ts`.
  * The framing math is pure, in `diorama/domain/`.
  * `arena` still never imports `diorama`. The contract stays `BoardRendererProps`, now carrying an optional `ViewInsets`.
* **Positive**: the 3D mode plays as one cohesive game screen. Every control stays a real DOM element, and the camera adapts to any HUD size, including the stacked rail on narrow screens.
* **Trade-offs**:
  * Portrait phones leave the board small; landscape is recommended.
  * The blueprint's cost focus is hidden from the on-board plate (it remains in 2D and in the debrief).

## Compliance

* `tests/modules/arena/immersive-hud.test.tsx` covers:
  * the full HUD over the 3D board;
  * the drawer opening on inspect and closing on Escape;
  * the return to the classic layout in 2D.
* `tests/modules/diorama/camera-fit.test.ts` covers framing with and without HUD insets.
* `tests/modules/diorama/terrace-decor.test.ts` covers decor staying on its terrace and being deterministic.
