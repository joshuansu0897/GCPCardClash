# Bounded Context Map

Human-readable registry of Bounded Contexts, public facades, outbound ports, and governing ADRs for **GCP Card Clash**.

## Bounded Context Registry

| Context | Path | Responsibility | Public Facade | Key Outbound Ports | Governing ADRs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `catalog` | `src/modules/catalog` | Curated GCP Service, Provisioning Energy, and Security cards plus 8 reference architecture blueprints across 4 tracks | `src/modules/catalog/index.ts` | `CatalogRepository` (`application/ports/catalog-repository.ts`) | ADR-0001, ADR-0002 |
| `battle` | `src/modules/battle` | Pure turn-based Card Clash engine: deck construction, energy funding, slot validation, flow synergy scoring, anti-pattern diagnostics, shielding, slot capture, AI Rival, and 3-star mastery | `src/modules/battle/index.ts` | Pure functional transformations over `Catalog` entities | ADR-0001, ADR-0002 |
| `progression` | `src/modules/progression` | Learner campaign state, best scores, 1–3 star mastery per blueprint, and Architect Rank progression | `src/modules/progression/index.ts` | `ProgressRepository` (`application/ports/progress-repository.ts`) | ADR-0001, ADR-0002 |
| `arena` | `src/modules/arena` | Systems Flight-Plan & Block-Diagram Playboard React 19 UI: header scoreboard, interactive topology sheet, spec/diagnostic inspector, card hand dock, and native `<dialog>` modals | `src/modules/arena/index.ts` | Consumes `catalog`, `battle`, and `progression` public facades | ADR-0001, ADR-0002 |

## Shared Kernel & Composition Root

* **`src/shared/`**: Pure presentational SVG technical icons (`gcp-icons.tsx`) with zero domain state.
* **`src/App.tsx` & `src/main.tsx`**: Explicit constructor/factory composition root wiring `StaticCatalogRepository` and `BrowserProgressRepository` into the `arena` playboard.

## Context Relationships

* Dependencies point strictly inward (`Adapters -> Application -> Domain`).
* `battle` imports immutable blueprint and card types strictly through `src/modules/catalog/index.ts`.
* `arena` orchestrates UI interactions exclusively through the public `index.ts` facades of `catalog`, `battle`, and `progression` (`ARCH-BOUNDARY`).
