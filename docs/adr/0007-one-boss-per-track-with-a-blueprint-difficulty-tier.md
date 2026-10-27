# ADR-0007: One boss per track with a blueprint-difficulty tier

* **Status**: Accepted
* **Date**: 2026-10-27
* **Bounded Contexts**: battle,arena,diorama,progression
* **Supersedes**: None
* **Amends**: ADR-0004 (boss profiles) and ADR-0005 (per-track everyday Rivals)

## Context

Each track had two enemies: an everyday Rival and a boss you unlocked by finishing the blueprint once. Both played on the same board under the same rules; only their tactics differed. In playtesting, two enemies for one area did not make sense to the player. The separate Boss mode added a lock, an extra button, and a second persona per track, without adding a different game.

## Considered Options

1. **Keep Battle and Boss modes**: no rework needed. Cons: two enemies for the same area, and a locked mode that confuses players.
2. **One boss per track, always at full strength**: simple. Cons: the very first Associate match is as hard as the hardest one.
3. **One boss per track, with a tier set by blueprint difficulty**: one enemy per area, and a learning curve that follows the certification ladder.

## Decision

We chose option 3.

* `battle/domain/rival-roster.ts` keeps a single `RIVAL_ROSTER` with one boss per track: The Monolith, Shadow Admin, The Data Swamp and The Hallucinator. `resolveRivalForTrack(trackId)` returns it.
* `MatchState.rivalProfile` (`standard | boss`) becomes `rivalTier` (`gentle | sharp`). It is set at match start by `rivalTierFor(blueprint.difficulty)`:
  * Associate blueprints get `gentle`.
  * Professional and Specialist blueprints get `sharp`.
* The tier selects the old tactics and incident cadence:
  * `gentle` uses the former everyday-Rival tactics, with an incident every 3 turns.
  * `sharp` uses the former boss tactics, with an incident every 2 turns.
* Every enemy mixes its signature incident into every second strike.
* `arena` offers only Battle and Study. The boss unlock gate (`isBossUnlocked`) and every Boss button are removed.
* `MatchOutcome.bossDefeated` now means "won a battle". The persisted progress field keeps its name, so saved progress still loads.
* `diorama` always draws the enemy as the crowned, scaled-up boss model.

## Consequences

* **Hexagonal Ring Placement**: the tier rule is pure `battle/domain`. `arena` and `diorama` only read the persona and the tier through the `battle` facade.
* **Positive**:
  * There is one enemy per area and one fewer mode to explain.
  * Difficulty rises with the certification level.
  * The persona, tactics and cadence code paths are simpler.
* **Trade-offs**:
  * The four everyday Rival personas (Rack Gremlin, Latency Wraith, Backlog Hydra, Drift Sprite) are retired.
  * Players can no longer pick a harder fight on an Associate blueprint.

## Compliance

* `tests/modules/battle/rival-boss-incidents.test.ts` covers tier from difficulty, cadence per tier, signature strikes, and any win counting as a boss defeat.
* `tests/modules/battle/discard-and-track-rivals.test.ts` covers one boss per track with a real signature incident.
* `tests/modules/arena/match-hud.test.tsx` covers the Battle/Study switch and the boss opening line.
* Verified via `evaluate_code.py` and `adr_manager.py audit`.
