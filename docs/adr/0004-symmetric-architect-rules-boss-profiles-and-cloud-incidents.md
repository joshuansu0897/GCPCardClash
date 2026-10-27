# ADR-0004: Symmetric Architect Rules, Boss Profiles, and Cloud Incidents

* **Status**: Accepted
* **Date**: 2026-10-26
* **Bounded Contexts**: battle,arena,progression,diorama
* **Supersedes**: None

## Context

The original Rival had no hand or deck. It gained +2 energy a turn, deployed each slot's reference service from thin air, captured for a flat 3 energy, and scored at 0.85× with a +10 "reserve" bonus. Players could not see or reason about its resources, and it did not play by their rules.

We also want boss fights and turn-to-turn variety (events) without forking the rules for each feature.

## Considered Options

1. **Keep a bespoke Rival code path and add boss/event special cases.** This is fast, but every new rule would need two implementations, and the gap between the Rival and the player would keep growing.
2. **Make every rule actor-generic and give the Rival a real hand.** Bosses differ only in tactics, and events modify shared cost quotes. Chosen.

## Decision

* **Actor-generic rules.** `architect-side.ts` reads and writes one architect's energy, score, mistakes, hand, piles and cycle quota. `placement-rules.ts` and `shield-rules.ts` take an `actor`, and `turn-actions.ts#performCardAction` is the single dispatcher used by both the player's UI and the Rival AI.
* **The Rival has a real deck.** `MatchState` gains `rivalHand` / `rivalDrawPile` / `rivalDiscardPile` / `rivalDiscardsRemaining` / `rivalMistakes`. Both decks come from the same scenario pool with independent seeds. The Rival gets +1E per turn up to 6, 2 cycles per turn, and refills to 6 at the end of its turn — exactly the player's rules. The UI shows only counts.
* **One source of costs.** `cost-rules.ts` (`quoteServiceCost`, `quoteShieldCost`, `incidentDeployBonus`) is used by the engine, the AI, and both boards' target labels.
* **Rival profiles.** `RivalProfile = 'standard' | 'boss'` changes tactics only:
  * Standard: one deploy and one shield per turn, open slots first, captures from Turn 3.
  * Boss: chains up to three deploys, captures from Turn 2, and maximises value.
* **Turns as sequences.** `resolveEndTurnSequence` returns one state per Rival action, plus the next-turn state. The arena plays them back with a delay injected from the composition root (`rivalStepDelayMs`; 0 in tests).
* **Cloud Incidents.** `incident-rules.ts` holds a seeded, deterministic deck that strikes both architects every 3 turns, or every 2 against a boss. An incident either applies instant effects (energy, node score, shield stripping, zonal outage) or sets round modifiers (capture surcharge, free shields, zone deploy bonus) that last until the next turn. Each boss in `boss-roster.ts` adds a signature incident on every second strike.
* **Progression.** `ScenarioMasteryRecord.bossDefeated`. A blueprint's boss unlocks once that blueprint has been completed at least once (`isBossUnlocked`).

## Consequences

* **Hexagonal Ring Placement**: All new rules live in `battle/domain/`. `progression/domain/` owns unlock and defeat records. `arena/presentation/` owns the playback timing, the Rival tray, and the incident UI. `diorama/domain/pad-affordance.ts` now delegates to the battle cost quotes.
* **Positive**: Symmetry is structural rather than conventional. A new rule written once applies to both sides, and incidents automatically show up in pad labels and capture prices.
* **Trade-offs**: `MatchState` keeps flat player fields, with rival twins beside them, to avoid churning every UI consumer. A future refactor could nest both under `sides`. The Rival AI is greedy, not search-based.

## Compliance

* `tests/modules/battle/rival-boss-incidents.test.ts` — hidden hand, deck conservation, hand-only deploys, step sequence, incident cadence and effects, boss defeat.
* `tests/modules/arena/match-hud.test.tsx` — Rival hand count, boss lock and launch, step playback lock, incident announcement.
