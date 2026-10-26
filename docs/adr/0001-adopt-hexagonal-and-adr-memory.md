# ADR-0001: Adopt Hexagonal Screaming Architecture and Markdown ADRs

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: repository-wide
* **Supersedes**: None

## Context

GCP Card Clash teaches Google Cloud Platform reference architectures through an interactive card-placement and topological battle workbench inspired by AWS Card Clash. Embedding card validation rules, synergy calculations, AI rival heuristics, and certification diagnostics inside React components or horizontal MVC folders (`controllers/`, `models/`, `views/`, `utils/`) would tightly couple game logic to DOM state and prevent fast, deterministic unit testing.

## Considered Options

1. **Horizontal MVC or Flat React Components**: Fast initial setup, but tangles domain rules, local persistence, and UI rendering across shared folders.
2. **Modular Hexagonal Screaming Architecture (`src/modules/<context>/`) with Markdown ADRs**: Groups vertical bounded contexts (`catalog`, `battle`, `progression`, `arena`) with pure `domain/` cores, `application/` ports/use cases, and `adapters/` at the edges.

## Decision

We will organize GCP Card Clash into explicit bounded contexts under `src/modules/{catalog,battle,progression,arena}` enforcing strict inward dependencies (`adapters -> application -> domain`) and public `index.ts` module facades, backed by plain-Markdown ADRs in `docs/adr/` and `docs/architecture/CONTEXT_MAP.md`.

## Consequences

* **Hexagonal Ring Placement**: `domain/` holds pure TypeScript entities, value types, and rules (`0` React or browser API imports); `application/` holds driven port interfaces and use-case orchestrators; `adapters/` holds React inbound views and static/browser outbound implementations.
* **Positive**: Every game mechanic, GCP architectural rule, and AI rival decision is 100% deterministically testable without DOM mounting or mocks.
* **Trade-offs**: Cross-module imports must strictly target `src/modules/<context>/index.ts` public boundaries rather than deep internal paths.

## Compliance

* Verified via `evaluate_code.py --arch strict --style strict --fail-on minor .`, `adr_manager.py audit --strict .`, and mirrored Vitest suites in `tests/modules/`.
