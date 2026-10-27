# ADR-0010: Ground curriculum content in official Google Cloud documentation

* **Status**: Accepted
* **Date**: 2026-10-27
* **Bounded Contexts**: catalog,arena
* **Supersedes**: None

## Context

The game teaches Google Cloud architecture, so wrong facts teach wrong answers. Until now, 41 cards and 19 blueprints were written from memory and checked only structurally (diagram geometry, ladders, unique ids). Nothing tied an SLA figure, a limit, or a "use X, not Y" hint to a source. A manual fact-check found 17 claims that were wrong, overstated, or outdated, including three product renames (Vertex AI to Gemini Enterprise Agent Platform, Vertex AI Search to Agent Search, Dataproc to Managed Service for Apache Spark).

## Considered Options

1. **Grounded authoring with citations (chosen)**: every card and blueprint carries the official pages its claims were checked against. A test enforces it, and the UI shows the links.
   * Pros: no runtime dependency, reviewable in a diff, players can verify any claim, and it works offline.
   * Cons: citations go stale as Google renames and moves pages. Re-checking stays a manual task.
2. **Runtime retrieval (RAG) over Google Cloud docs**: Cons: a server, an API key and network access for a static game, and answers that change under a fixed curriculum.
3. **No grounding (status quo)**: Cons: errors ship silently.

## Decision

* `catalog/domain/card.ts` defines `DocReference { title, url }`. `BaseCard.references` and `ArchitectureBlueprint.references` are required, so a new entry without sources does not compile.
* References point only at official hosts (`docs.cloud.google.com`, `cloud.google.com`). SLA figures cite the product's `/sla` page.
* `tests/modules/catalog/references.test.ts` fails when an entry has no source, cites an unofficial or non-HTTPS host, has an empty title, or repeats a URL.
* `arena` shows the links: "Official Docs" in the card spec inspector and "Sources" under the debrief's reference solution. `DocSourceLinks` opens them in a new tab with `rel="noopener noreferrer"`.
* `docs/catalog/fact-check-ledger.md` records each corrected claim, its verdict, source and check date.

## Consequences

* **Hexagonal Ring Placement**: `DocReference` lives in the pure `catalog` domain. The data lives in `catalog/adapters/outbound`. `arena/presentation` reads it through the catalog facade.
* **Positive**: every claim can be traced to a page, and a missing citation fails CI.
* **Trade-offs**: the test checks that sources exist, not that they support the claim. Facts must be re-checked when Google renames products or changes SLAs; the ledger dates show when each was last checked.

## Compliance

* Verified via `references.test.ts`, `evaluate_code.py`, `tsc --noEmit`, and a review of the ledger.
