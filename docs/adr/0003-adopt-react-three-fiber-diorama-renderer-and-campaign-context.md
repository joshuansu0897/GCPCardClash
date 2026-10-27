# ADR-0003: Adopt React Three Fiber Diorama Renderer and Campaign Context

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: diorama,campaign,battle,catalog,arena
* **Supersedes**: None

## Context

Describe the concrete architectural force, problem, or constraint driving this decision.

## Considered Options

1. **Option A**: Pros / cons.
2. **Option B**: Pros / cons.

## Decision

State the chosen architecture clearly in active voice ("We will...").

## Consequences

* **Hexagonal Ring Placement**: Specify `domain/`, `application/ports/`, and `adapters/` ownership.
* **Positive**: Maintainability and testability benefits.
* **Trade-offs**: Accepted costs and follow-up obligations.

## Compliance

* Verified via `evaluate_code.py` / `evaluate_go.py` / unit & contract tests.
