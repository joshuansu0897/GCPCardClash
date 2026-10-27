# ADR-0008: Authored grid architecture diagrams with context actors and request-response lanes

* **Status**: Accepted
* **Date**: 2026-10-27
* **Bounded Contexts**: catalog,arena,diorama
* **Supersedes**: None

## Context

Blueprints were drawn as three fixed columns (one per zone) with slots stacked in rows and
one-way edges between them. Real reference architectures are not shaped like that: they show
external actors (users, browsers, on-prem sites) outside a cloud boundary, fan-out branches,
async side-flows, and labelled request/response pairs. The 2D sheet and the 3D island also
computed their own placement, so the two views could drift apart.

## Considered Options

1. **Auto-layout from the edge graph** (layered/Sugiyama): no authoring, but layouts jump
   between blueprints and fan-outs rarely read like hand-drawn diagrams.
2. **Authored grid cells per blueprint** with a shared router: a few extra fields per slot, but
   every diagram looks exactly as designed and both views read the same model.
3. **Keep columns, add more rows**: cheapest, but still cannot place actors or the cloud boundary.

## Decision

We will author each blueprint on a cell grid (option 2):

* `ArchitectureSlot.cell` places a slot; `ArchitectureBlueprint.contextNodes` adds fixed actors
  (`users`, `browser`, `devices`, `on-prem`, `partner`, `service`) inside or outside the cloud.
* `FlowEdge` connects any two nodes (`fromNodeId`/`toNodeId`) and may carry a `returnLabel`,
  which draws a second, opposite lane for the response.
* `catalog/domain/diagram.ts` resolves a blueprint into a `BlueprintDiagram` (nodes, zone boxes,
  cloud bounds). `cell` is required; the old `zone.column` / `slot.row` layout is removed.
* `catalog/domain/diagram-routing.ts` routes orthogonal lanes in grid units: straight when
  aligned, an L whose legs cross no other node, else a Z past the source; paired lanes run side
  by side and stop at node borders.
* `arena` (SVG over a CSS grid) and `diorama` (tube roads over terraces) both draw that one model.

## Consequences

* **Hexagonal Ring Placement**: the diagram model and router are pure `catalog/domain` code exported
  through `catalog/index.ts`; `arena` and `diorama` only project it into pixels or world units.
* **Positive**: one topology across 2D and 3D; diagrams can show actors, boundaries, branches and
  responses; routing is unit-tested without a renderer.
* **Trade-offs**: every blueprint needs authored cells and context nodes (all 8 now carry 6–7
  slots, outside actors and request/response pairs). Authors must keep lanes from overlapping each
  other, and keep labels short because lanes run in the gap between node cards.

## Compliance

* Verified via `evaluate_code.py`, `tests/modules/catalog/diagram.test.ts` (on every blueprint:
  zone boxes disjoint, actors outside the cloud, 6+ slots, a request/response pair, no lane through
  an unconnected node; plus border trimming and L/Z routing), the catalog integrity
  test (unique cells, edge endpoints resolve), and the diorama layout tests.
