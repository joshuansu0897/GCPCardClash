# ADR-0002: Pure Domain Card Clash Engine and Browser Progress Port

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: catalog,battle,progression,arena
* **Supersedes**: None

## Context

GCP Card Clash requires two complementary learning modes—turn-based Solo Battles against an AI Rival Architect and pressure-free Guided Study Mode—across four Google Cloud tracks (`foundations`, `architect`, `serverless-data`, `vertex-ai`), deployed as a static zero-backend Single-Page Application (Firebase Hosting / Cloud Storage compatible) with persistent campaign progress.

## Considered Options

1. **Stateful Backend Match Server + Database**: Supports remote multiplayer, but adds mandatory cloud hosting costs, auth friction, and latency for solo certification study.
2. **Pure Immutable Domain Engine + Driven `ProgressRepository` Port**: Executes deterministic deck dealing, energy provisioning, slot validation, `+40` topological flow synergies, security shielding, unshielded slot capture, and AI rival turns purely in `battle/domain`, while persisting mastery stars via a swappable `ProgressRepository` (`BrowserProgressRepository` in production, `InMemoryProgressRepository` in tests).

## Decision

We will implement the GCP Card Clash rules engine as pure, side-effect-free functions over immutable `MatchState` snapshots in `src/modules/battle/domain`, source curated GCP cards and reference blueprints through `CatalogRepository` in `src/modules/catalog`, and persist 3-star scenario records through `ProgressRepository` in `src/modules/progression`.

## Consequences

* **Hexagonal Ring Placement**: `catalog/domain` owns `Card` and `ArchitectureBlueprint`; `battle/domain` owns deck, placement, capture, scoring, and AI rival rules; `progression/application/ports` defines `ProgressRepository` implemented by `InMemoryProgressRepository` and `BrowserProgressRepository`; `arena/presentation` renders the React 19 playboard and native `<dialog>` overlays.
* **Positive**: Zero runtime cloud cost, instant offline-capable gameplay, deterministic seeded deck tests, and clean future extensibility to Firestore or WebSocket multiplayer adapters without touching `domain/`.
* **Trade-offs**: Campaign progress is scoped to the learner's local browser storage unless a cloud adapter is wired in `src/App.tsx`.

## Compliance

* Verified via `vitest run`, `evaluate_code.py --arch strict --style strict --fail-on minor .`, and `adr_manager.py audit --strict .`.
