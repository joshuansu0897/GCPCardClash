# Bounded Context Map

Human-readable registry of Bounded Contexts, public facades, outbound ports, and governing ADRs for **GCP Card Clash**.

## Bounded Context Registry

| Context | Path | Responsibility | Public Facade | Key Outbound Ports | Governing ADRs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `catalog` | `src/modules/catalog` | Curated GCP Service, Provisioning Energy, and Security cards plus 8 reference architecture blueprints across 4 tracks, the grid diagram model (cells, context actors, request/response edges) and its orthogonal lane router | `src/modules/catalog/index.ts` | `CatalogRepository` (`application/ports/catalog-repository.ts`) | ADR-0001, ADR-0002, ADR-0008 |
| `battle` | `src/modules/battle` | Pure turn-based Card Clash engine with actor-symmetric rules: deck construction for both architects, energy funding, slot validation, incident-aware cost quotes, flow synergy scoring, anti-pattern diagnostics, shielding, slot capture, free discards with a start-of-turn draw, one boss per track playing from its own hand at a tier set by blueprint difficulty, Cloud Incident deck with board manifestations, and 3-star mastery | `src/modules/battle/index.ts` | Pure functional transformations over `Catalog` entities | ADR-0001, ADR-0002, ADR-0004, ADR-0005, ADR-0007 |
| `progression` | `src/modules/progression` | Learner campaign state, best scores, 1–3 star mastery per blueprint, boss defeats, and Architect Rank progression | `src/modules/progression/index.ts` | `ProgressRepository` (`application/ports/progress-repository.ts`) | ADR-0001, ADR-0002, ADR-0007 |
| `arena` | `src/modules/arena` | Systems Flight-Plan & Block-Diagram Playboard React 19 UI: header scoreboard, interactive grid architecture diagram (SVG lanes over a CSS grid), spec/diagnostic inspector, card hand dock, native `<dialog>` modals, a 3D/2D `BoardViewSwitch` accepting any renderer satisfying `BoardRendererProps`, and an immersive full-screen HUD (`ImmersiveArena`) that passes measured `viewInsets` to the 3D renderer | `src/modules/arena/index.ts` | Consumes `catalog`, `battle`, and `progression` public facades | ADR-0001, ADR-0002, ADR-0003, ADR-0006, ADR-0007, ADR-0008 |
| `diorama` | `src/modules/diorama` | Cloud Diorama 3D playboard (React Three Fiber): pure island layout, HUD-aware camera fit, `MatchState` → animation-cue diffing, pad targeting affordance, per-track world themes, plus R3F island, pads, building miniatures, shield domes, request/response flow roads, context actors, the cloud boundary, the track enemy, incident spectacles, and combat VFX | `src/modules/diorama/index.ts` (board reached only via lazy `loadDioramaBoard()`) | None — pure projection of `battle` state and `catalog` entities | ADR-0003, ADR-0005, ADR-0006, ADR-0007, ADR-0008 |

## Shared Kernel & Composition Root

* **`src/shared/`**: Pure presentational SVG technical icons (`gcp-icons.tsx`) with zero domain state.
* **`src/App.tsx` & `src/main.tsx`**: Explicit constructor/factory composition root wiring `StaticCatalogRepository` and `BrowserProgressRepository` into the `arena` playboard, and lazily injecting the `diorama` board when `detectWebGLSupport()` passes.

## Context Relationships

* Dependencies point strictly inward (`Adapters -> Application -> Domain`).
* `battle` imports immutable blueprint and card types strictly through `src/modules/catalog/index.ts`.
* `arena` orchestrates UI interactions exclusively through the public `index.ts` facades of `catalog`, `battle`, and `progression` (`ARCH-BOUNDARY`).
* `diorama` imports only the `battle` and `catalog` facades; `arena` never imports `diorama` — the composition root injects it.
