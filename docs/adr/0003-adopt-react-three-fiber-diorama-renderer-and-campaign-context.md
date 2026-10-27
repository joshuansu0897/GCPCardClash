# ADR-0003: Adopt React Three Fiber Diorama Renderer and Campaign Context

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: diorama,campaign,battle,catalog,arena
* **Supersedes**: None

## Context

GCP Card Clash plays well as a 2D drafting sheet, but the product direction is a tactile, toy-like "Cloud Diorama": a floating island where each architecture slot is a physical pad, deployed services pop up as miniature buildings, live flow synergies stream packets along roads, and shields raise visible domes. That needs a real-time 3D renderer.

The forces are:

* **The engine must stay pure.** `battle` already owns every rule; the renderer must never re-derive legality or scoring.
* **The 2D sheet must survive** for low-end devices, browsers without WebGL, and jsdom tests.
* **Bundle cost.** Three.js is ~1 MB minified and must not slow first paint for players who never see 3D.
* **Accessibility.** A canvas is opaque to keyboards and screen readers; slot actions must remain real buttons.

## Considered Options

1. **Raw Three.js imperative scene** — maximum control, but a second state model to keep in sync with React and no declarative composition.
2. **React Three Fiber + drei** — declarative scene graph that re-renders from the same `MatchState` the 2D sheet uses; mature helpers (`RoundedBox`, `OrbitControls`, `Sparkles`). Chosen.
3. **CSS 3D transforms only** — no new dependency, but no lighting, shadows, shaders, or particles; cannot deliver the diorama look.

## Decision

We will add a new `diorama` bounded context rendered with React Three Fiber, injected into `arena` by the composition root as an optional alternate playboard.

* **`diorama/domain/`** holds pure, framework-free logic:
  * `board-layout.ts` — projects zone columns × slot rows into island world space (pads, stepped terraces, arced road control points) and maps card categories to building archetypes.
  * `board-events.ts` — diffs two `MatchState` snapshots into animation cues (`card-deployed`, `slot-captured`, `shield-locked`, `energy-gained`, `mistake`, `turn-advanced`, `match-completed`, `board-reset`).
  * `pad-affordance.ts` — mirrors engine legality to decide which pads glow (`deploy` / `capture` / `harden` / `unaffordable`).
* **`diorama/presentation/`** holds R3F components (island, pads, buildings, shield-dome shader, flow roads, VFX layer, camera rig) and `DioramaBoard`. Effects are driven only by `BoardEvent`s; game state flows one way from `MatchState`.
* **Labels are DOM, not canvas.** Pad and zone labels render in the board's own React tree as real buttons. A single in-canvas `LabelProjector` positions them each frame by writing CSS transforms. We rejected drei `<Html>` because it mounts one React root per label, which raced with React 19 unmounts and dropped labels in practice.
* **`arena`** defines the `BoardRendererProps` contract and a `BoardViewSwitch` (3D/2D toggle, `Suspense` fallback and error-boundary fallback both render the 2D sheet). `arena` never imports `diorama`.
* **Composition root** (`App.tsx`) probes WebGL with the Three-free `detectWebGLSupport()` and, when available, injects `React.lazy(loadDioramaBoard)`. The diorama facade exposes the board only through that dynamic import so Three.js ships in its own chunk.
* **Campaign context** (world map, unlock rules, boss rival) remains part of this ADR's scope and will land as `src/modules/campaign/` in a later slice.

## Consequences

* **Hexagonal Ring Placement**: `diorama/domain/` is pure and depends only on `battle` and `catalog` facades. `diorama/presentation/` depends on R3F/Three. `diorama/index.ts` exports domain functions, the WebGL probe, and `loadDioramaBoard()`. No outbound ports are needed.
* **Positive**: The engine is unchanged and the renderer is a pure function of `MatchState` plus transient cues. Layout, diffing, and affordance are unit-tested without WebGL. The main bundle stays ~103 kB gzip, with the diorama chunk (~266 kB gzip) loaded on demand. jsdom and non-WebGL browsers automatically get the 2D sheet.
* **Trade-offs**: The diorama itself is verified by a headless-browser smoke run, not by unit tests, because jsdom has no WebGL. `vite.config.ts` raises `chunkSizeWarningLimit` for the intentional large lazy chunk. Reduced-motion users get static buildings and domes without tosses, shakes, or packet motion.

## Compliance

* `tests/modules/diorama/diorama.test.ts` — layout, event diffing, affordance, archetypes, WebGL probe fallback.
* `tests/modules/arena/board-view-switch.test.tsx` — 3D default with injected renderer, 2D toggle, crash fallback to 2D.
* `npm run build` must emit `diorama-board-*.js` as a separate chunk.
